import Transaction from "../models/Transaction.js";
import Budget from "../models/Budget.js";
import User from "../models/User.js";

const millisecondsPerDay = 24 * 60 * 60 * 1000;
const fixedExpenseCategories = new Set(["rent", "bills", "subscriptions"]);

// UTC Month Range
export function monthRange(month) {
  const year = Number(month.slice(0, 4));
  const monthNumber = Number(month.slice(5, 7));
  const start = new Date(Date.UTC(year, monthNumber - 1, 1));
  const end = new Date(Date.UTC(year, monthNumber, 1));
  return { start, end };
}

export function calculateStudentInsights({ overallBudgetMinor, expenseMinor, month, now = new Date() }) {
  if (overallBudgetMinor === null || overallBudgetMinor === undefined) {
    return {
      hasBudget: false,
      dailySpendingLimitMinor: null,
      budgetRunwayDays: null,
      note: "Set an overall budget to see your daily limit."
    };
  }

  const range = monthRange(month);
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const daysInMonth = (range.end.getTime() - range.start.getTime()) / millisecondsPerDay;
  const daysElapsed = today < range.start.getTime()
    ? 0
    : today >= range.end.getTime()
      ? daysInMonth
      : Math.floor((today - range.start.getTime()) / millisecondsPerDay) + 1;
  const daysLeft = Math.max(0, daysInMonth - daysElapsed + (daysElapsed > 0 && daysElapsed < daysInMonth ? 1 : 0));
  const remainingBudgetMinor = overallBudgetMinor - expenseMinor;
  const dailySpendingLimitMinor = daysLeft ? Math.floor(remainingBudgetMinor / daysLeft) : null;
  const averageDailySpendingMinor = daysElapsed ? expenseMinor / daysElapsed : 0;
  const budgetRunwayDays = averageDailySpendingMinor > 0
    ? Math.round((Math.max(0, remainingBudgetMinor) / averageDailySpendingMinor) * 10) / 10
    : null;

  return {
    hasBudget: true,
    remainingBudgetMinor,
    dailySpendingLimitMinor,
    budgetRunwayDays,
    note: "Daily limit divides your remaining budget by days left, including today. Runway uses your average daily spending so far."
  };
}

export function calculateProfessionalInsights({ incomeMinor, categoryRows }) {
  let fixedSpendingMinor = 0;
  let flexibleSpendingMinor = 0;

  for (const row of categoryRows) {
    if (fixedExpenseCategories.has(row.category.toLowerCase())) {
      fixedSpendingMinor += row.amountMinor;
    } else {
      flexibleSpendingMinor += row.amountMinor;
    }
  }

  const savingsRatePercent = incomeMinor > 0
    ? Math.round(((incomeMinor - fixedSpendingMinor - flexibleSpendingMinor) / incomeMinor) * 1000) / 10
    : null;
  const totalSpendingMinor = fixedSpendingMinor + flexibleSpendingMinor;

  return {
    savingsRatePercent,
    fixedSpendingMinor,
    flexibleSpendingMinor,
    fixedSpendingPercent: totalSpendingMinor
      ? Math.round((fixedSpendingMinor / totalSpendingMinor) * 1000) / 10
      : 0,
    note: "Savings rate is (income minus expenses) divided by income. Fixed includes Rent, Bills and Subscriptions."
  };
}

export function calculateIncomeStabilityInsights({ currentMonthIncomeMinor, previousMonthlyIncomes }) {
  const previousIncomeMonths = previousMonthlyIncomes.filter((item) => item.incomeMinor > 0);

  if (!previousIncomeMonths.length) {
    return {
      currentMonthIncomeMinor,
      previousIncomeMonthCount: 0,
      averagePreviousMonthlyIncomeMinor: null,
      lowestPreviousMonthlyIncomeMinor: null,
      note: "Add income in earlier months to compare income stability."
    };
  }

  const totalPreviousIncomeMinor = previousIncomeMonths.reduce(
    (total, item) => total + item.incomeMinor,
    0
  );
  const lowestPreviousMonthlyIncomeMinor = Math.min(
    ...previousIncomeMonths.map((item) => item.incomeMinor)
  );

  return {
    currentMonthIncomeMinor,
    previousIncomeMonthCount: previousIncomeMonths.length,
    averagePreviousMonthlyIncomeMinor: Math.round(totalPreviousIncomeMinor / previousIncomeMonths.length),
    lowestPreviousMonthlyIncomeMinor,
    note: `Average and lowest use the previous ${previousIncomeMonths.length} month${previousIncomeMonths.length === 1 ? "" : "s"} with recorded income.`
  };
}

async function findPreviousMonthlyIncomes(userId, month) {
  const selectedRange = monthRange(month);
  const start = new Date(Date.UTC(
    selectedRange.start.getUTCFullYear(),
    selectedRange.start.getUTCMonth() - 3,
    1
  ));
  const transactions = await Transaction.find({
    user: userId,
    type: "income",
    date: { $gte: start, $lt: selectedRange.start }
  });
  const monthlyTotals = new Map();

  for (const transaction of transactions) {
    const transactionMonth = transaction.date.toISOString().slice(0, 7);
    monthlyTotals.set(
      transactionMonth,
      (monthlyTotals.get(transactionMonth) || 0) + transaction.amountMinor
    );
  }

  return Array.from(monthlyTotals, ([previousMonth, incomeMinor]) => ({
    month: previousMonth,
    incomeMinor
  })).sort((first, second) => first.month.localeCompare(second.month));
}

async function calculateAccountTypeInsights({ userId, accountType, month, incomeMinor, expenseMinor, overallBudgetMinor, categoryRows, now }) {
  if (accountType === "student") {
    return {
      type: accountType,
      ...calculateStudentInsights({ overallBudgetMinor, expenseMinor, month, now })
    };
  }

  if (accountType === "workingProfessional") {
    return {
      type: accountType,
      ...calculateProfessionalInsights({ incomeMinor, categoryRows })
    };
  }

  const previousMonthlyIncomes = await findPreviousMonthlyIncomes(userId, month);
  return {
    type: "personalFinance",
    ...calculateIncomeStabilityInsights({
      currentMonthIncomeMinor: incomeMinor,
      previousMonthlyIncomes
    })
  };
}

// Dashboard Totals
export async function calculateSummary(userId, month, now = new Date()) {
  const range = monthRange(month);
  const [transactions, budgets, user] = await Promise.all([
    Transaction.find({ user: userId, date: { $gte: range.start, $lt: range.end } }),
    Budget.find({ user: userId, month }),
    User.findById(userId).select("accountType")
  ]);
  let incomeMinor = 0;
  let expenseMinor = 0;
  const categoryTotals = {};
  for (const transaction of transactions) {
    if (transaction.type === "income") incomeMinor += transaction.amountMinor;
    if (transaction.type === "expense") {
      expenseMinor += transaction.amountMinor;
      categoryTotals[transaction.category] = (categoryTotals[transaction.category] || 0) + transaction.amountMinor;
    }
  }
  const categoryRows = [];
  for (const category in categoryTotals) categoryRows.push({ category, amountMinor: categoryTotals[category] });
  categoryRows.sort(function byAmount(first, second) { return second.amountMinor - first.amountMinor; });
  let overallBudgetMinor = 0;
  for (const budget of budgets) if (!budget.category) overallBudgetMinor = budget.amountMinor;
  const remainingBudgetMinor = budgets.some((budget) => !budget.category)
    ? overallBudgetMinor - expenseMinor
    : null;
  const accountTypeInsights = await calculateAccountTypeInsights({
    userId,
    accountType: user?.accountType || "student",
    month,
    incomeMinor,
    expenseMinor,
    overallBudgetMinor: remainingBudgetMinor === null ? null : overallBudgetMinor,
    categoryRows,
    now
  });

  return {
    month,
    incomeMinor,
    expenseMinor,
    netCashFlowMinor: incomeMinor - expenseMinor,
    overallBudgetMinor,
    remainingBudgetMinor,
    categoryRows,
    accountTypeInsights
  };
}

// Monthly Trends
export async function calculateMonthlyTrends(userId, fromMonth, toMonth) {
  const from = monthRange(fromMonth + "-01").start;
  const toRange = monthRange(toMonth + "-01");
  const transactions = await Transaction.find({ user: userId, date: { $gte: from, $lt: toRange.end } });
  const totals = {};
  for (const transaction of transactions) {
    const month = transaction.date.toISOString().slice(0, 7);
    if (!totals[month]) totals[month] = { month, incomeMinor: 0, expenseMinor: 0 };
    if (transaction.type === "income") totals[month].incomeMinor += transaction.amountMinor;
    if (transaction.type === "expense") totals[month].expenseMinor += transaction.amountMinor;
  }
  return Object.values(totals).sort(function byMonth(first, second) { return first.month.localeCompare(second.month); });
}
