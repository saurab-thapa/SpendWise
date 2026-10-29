import Transaction from "../models/Transaction.js";

// Budget Calculations
export async function calculateBudgets(userId, budgets, month) {
  const start = new Date(month + "-01T00:00:00.000Z");
  const year = Number(month.slice(0, 4));
  const monthNumber = Number(month.slice(5, 7));
  const end = new Date(Date.UTC(year, monthNumber, 1));
  const expenses = await Transaction.find({ user: userId, type: "expense", date: { $gte: start, $lt: end } });
  return budgets.map(function addCalculation(budget) {
    let spentMinor = 0;
    for (const expense of expenses) {
      if (budget.category === null || budget.category === undefined || budget.category === expense.category) {
        spentMinor += expense.amountMinor;
      }
    }
    const remainingMinor = budget.amountMinor - spentMinor;
    const percentUsed = Math.round((spentMinor / budget.amountMinor) * 100);
    return { ...budget.toObject(), spentMinor, remainingMinor, percentUsed };
  });
}

// Calculate Budget Status
export function addBudgetStatus(budgets, warningPercent) {
  return budgets.map(function statusBudget(budget) {
    let status = "within budget";
    if (budget.percentUsed >= 100) status = "budget exceeded";
    else if (budget.percentUsed >= warningPercent) status = "approaching limit";
    return { ...budget, status };
  });
}
