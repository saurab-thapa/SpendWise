import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { ChartPie, Plus, ReceiptText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useApiData } from "../hooks/useApiData.js";
import { accountTypeConfig } from "../config/accountTypeConfig.js";
import { formatMoney } from "../utils/money.js";
import { getCategoryColor, getChartPalette } from "../utils/chartColors.js";
import { OnboardingDialog } from "../components/OnboardingDialog.jsx";

export function DashboardPage() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const accountConfig = accountTypeConfig[user?.accountType || "student"];
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const summary = useApiData(`/api/analytics/summary?month=${month}`);
  const transactions = useApiData("/api/transactions?limit=5&page=1");
  const palette = useMemo(getChartPalette, []);
  const chartData = useMemo(
    function categoryData() { return summary.data?.categoryRows || []; },
    [summary.data]
  );
  const comparisonData = useMemo(
    function incomeExpenseData() {
      if (!summary.data) return [];
      return [
        { name: "Income", amountMinor: summary.data.incomeMinor },
        { name: "Expenses", amountMinor: summary.data.expenseMinor }
      ];
    },
    [summary.data]
  );

  if (!user?.onboardingCompleted) {
    return <OnboardingDialog user={user} refreshUser={refreshUser} />;
  }

  function openTransactions() {
    navigate("/transactions");
  }

  function openBudgets() {
    navigate("/budgets");
  }

  function renderSignatureEmptyState(message, actionLabel, action) {
    return <div className="signature-empty-state">
      <ChartPie size={24} aria-hidden="true" />
      <p>{message}</p>
      <button className="secondary-button" type="button" onClick={action}>{actionLabel}</button>
    </div>;
  }

  function renderChartEmpty(message) {
    return <div className="chart-empty">
      <ChartPie size={28} aria-hidden="true" />
      <p>{message}</p>
      <button className="secondary-button" type="button" onClick={openTransactions}>Add transaction</button>
    </div>;
  }

  function renderSignatureCard(insights) {
    if (insights.type === "student") {
      return <section className="panel signature-card" style={{ "--type-accent": accountConfig.accentColor }}>
        <h2>{accountConfig.focusTitle}</h2>
        {!insights.hasBudget ? (
          renderSignatureEmptyState(insights.note, "Set an overall budget", openBudgets)
        ) : (
          <>
            <p className="signature-note">{insights.note}</p>
            <div className="signature-metrics">
              <div className="signature-metric">
                <span>Daily spending limit</span>
                <strong>{insights.dailySpendingLimitMinor === null
                  ? "No days remain"
                  : formatMoney(insights.dailySpendingLimitMinor, user?.currency)}</strong>
                <small>Remaining overall budget divided by days left in the month.</small>
              </div>
              <div className="signature-metric">
                <span>Budget runway</span>
                <strong>{insights.budgetRunwayDays === null
                  ? "Not enough spending data"
                  : `${insights.budgetRunwayDays} days`}</strong>
                <small>{insights.budgetRunwayDays === null
                  ? "Add expenses to estimate how long the budget may last."
                  : "Estimate based on average daily spending so far."}</small>
              </div>
            </div>
          </>
        )}
      </section>;
    }

    if (insights.type === "workingProfessional") {
      const spendingTotal = insights.fixedSpendingMinor + insights.flexibleSpendingMinor;
      return <section className="panel signature-card" style={{ "--type-accent": accountConfig.accentColor }}>
        <h2>{accountConfig.focusTitle}</h2>
        <p className="signature-note">{insights.note}</p>
        <div className="signature-metrics">
          <div className="signature-metric">
            <span>Savings rate</span>
            <strong className={insights.savingsRatePercent === null ? "signature-empty" : ""}>
              {insights.savingsRatePercent === null ? "No income recorded" : `${insights.savingsRatePercent}%`}
            </strong>
            <small>Calculated from this month's recorded income and expenses.</small>
          </div>
          <div className="signature-metric">
            <span>Fixed spending</span>
            <strong>{formatMoney(insights.fixedSpendingMinor, user?.currency)}</strong>
            <small>Rent, Bills and Subscriptions.</small>
          </div>
          <div className="signature-metric">
            <span>Flexible spending</span>
            <strong>{formatMoney(insights.flexibleSpendingMinor, user?.currency)}</strong>
            <small>All other expense categories this month.</small>
          </div>
        </div>
        <div className="signature-bar" role="img" aria-label={spendingTotal
          ? `Fixed spending ${insights.fixedSpendingPercent} percent, flexible spending ${100 - insights.fixedSpendingPercent} percent`
          : "No expenses recorded to compare"}>
          <div className="signature-bar-fixed" style={{ width: `${spendingTotal ? insights.fixedSpendingPercent : 0}%` }} />
          <div className="signature-bar-flexible" style={{ width: `${spendingTotal ? 100 - insights.fixedSpendingPercent : 0}%` }} />
        </div>
        <div className="signature-legend">
          <span className="legend-key"><span className="legend-swatch" style={{ "--legend-color": "var(--chart-navy)" }} /> Fixed</span>
          <span className="legend-key"><span className="legend-swatch" style={{ "--legend-color": "var(--chart-teal)" }} /> Flexible</span>
        </div>
        {insights.savingsRatePercent === null && renderSignatureEmptyState(
          "Record income to calculate your savings rate.",
          "Add transaction",
          openTransactions
        )}
      </section>;
    }

    return <section className="panel signature-card" style={{ "--type-accent": accountConfig.accentColor }}>
      <h2>{accountConfig.focusTitle}</h2>
      {insights.previousIncomeMonthCount > 0 && <p className="signature-note">{insights.note}</p>}
      <div className="signature-metrics">
        <div className="signature-metric">
          <span>This month's income</span>
          <strong>{formatMoney(insights.currentMonthIncomeMinor, user?.currency)}</strong>
          <small>Total income transactions in the selected month.</small>
        </div>
        <div className="signature-metric">
          <span>Average previous monthly income</span>
          <strong>{insights.averagePreviousMonthlyIncomeMinor === null
            ? "No previous income"
            : formatMoney(insights.averagePreviousMonthlyIncomeMinor, user?.currency)}</strong>
          <small>{insights.previousIncomeMonthCount
            ? `Average from ${insights.previousIncomeMonthCount} previous month${insights.previousIncomeMonthCount === 1 ? "" : "s"} with income.`
            : "Average from previous months with recorded income."}</small>
        </div>
        <div className="signature-metric">
          <span>Lowest previous monthly income</span>
          <strong>{insights.lowestPreviousMonthlyIncomeMinor === null
            ? "No previous income"
            : formatMoney(insights.lowestPreviousMonthlyIncomeMinor, user?.currency)}</strong>
          <small>Lowest of the previous months with recorded income.</small>
        </div>
      </div>
      {!insights.previousIncomeMonthCount && renderSignatureEmptyState(
        insights.note,
        "Add transaction",
        openTransactions
      )}
    </section>;
  }

  return <div className="page">
    <div className="page-heading dashboard-heading">
      <div>
        <p className="eyebrow">{accountConfig.displayName}</p>
        <h1>{accountConfig.dashboardHeading}</h1>
        <p>{accountConfig.dashboardSubheading}</p>
      </div>
      <div className="dashboard-heading-controls">
        <span className="account-badge" style={{ "--type-accent": accountConfig.accentColor }}>{accountConfig.displayName}</span>
        <label className="period-label">Month<input type="month" value={month} onChange={(event) => setMonth(event.target.value)} /></label>
      </div>
    </div>

    {summary.loading ? <div className="loading-state">Loading dashboard...</div> : summary.error ? (
      <div className="error-banner" role="alert">{summary.error}</div>
    ) : (
      <>
        <section className="metric-grid" aria-label="Monthly summary">
          <article className="income-metric"><span>Total income</span><strong>{formatMoney(summary.data.incomeMinor, user?.currency)}</strong><small>Recorded income this month.</small></article>
          <article className="expense-metric"><span>Total expenses</span><strong>{formatMoney(summary.data.expenseMinor, user?.currency)}</strong><small>Recorded expenses this month.</small></article>
          <article className={summary.data.netCashFlowMinor >= 0 ? "cashflow-positive" : "cashflow-negative"}>
            <span>Net cash flow</span>
            <strong>{formatMoney(summary.data.netCashFlowMinor, user?.currency)}</strong>
            <small>Net income minus expenses. Net cash flow is not a bank balance.</small>
          </article>
          <article>
            <span>Overall budget remaining</span>
            <strong className={summary.data.remainingBudgetMinor !== null && summary.data.remainingBudgetMinor < 0 ? "negative" : ""}>
              {summary.data.remainingBudgetMinor === null
                ? "No overall budget set"
                : formatMoney(summary.data.remainingBudgetMinor, user?.currency)}
            </strong>
            <small>{summary.data.remainingBudgetMinor === null ? "Set an overall monthly budget to track the remainder." : "Overall monthly limit minus recorded expenses."}</small>
          </article>
        </section>

        {renderSignatureCard(summary.data.accountTypeInsights)}

        <section className="dashboard-chart-grid">
          <article className="panel">
            <h2>Category spending</h2>
            {chartData.length ? (
              <div className="chart-box">
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={chartData} dataKey="amountMinor" nameKey="category" outerRadius={92}>
                      {chartData.map((row) => <Cell key={row.category} fill={getCategoryColor(row.category)} />)}
                    </Pie>
                    <Tooltip formatter={(value) => formatMoney(value, user?.currency)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : renderChartEmpty("No expense categories recorded for this month.")}
          </article>
          <article className="panel">
            <h2>Income vs expenses</h2>
            {summary.data.incomeMinor || summary.data.expenseMinor ? (
              <div className="chart-box">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={comparisonData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatMoney(value, user?.currency)} />
                    <Bar dataKey="amountMinor" name="Amount">
                      {comparisonData.map((row, index) => (
                        <Cell key={row.name} fill={index === 0 ? palette[2] : palette[4]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : renderChartEmpty("Record income or expenses to compare your monthly totals.")}
          </article>
        </section>

        <section className="panel recent-transactions">
          <h2>Recent transactions</h2>
          {transactions.loading ? <p>Loading transactions...</p> : transactions.error ? (
            <div className="error-banner" role="alert">{transactions.error}</div>
          ) : transactions.data?.items?.length ? transactions.data.items.map((item) => (
            <div className="transaction-row" key={item._id}>
              <span><strong>{item.description}</strong><small>{item.category}</small></span>
              <strong className={item.type === "income" ? "positive" : "negative"}>
                {item.type === "income" ? "+" : "-"}{formatMoney(item.amountMinor, user?.currency)}
              </strong>
            </div>
          )) : <div className="chart-empty">
            <ReceiptText size={28} aria-hidden="true" />
            <p>No transactions recorded yet.</p>
            <button className="primary-button icon-button" type="button" onClick={openTransactions}><Plus size={16} /> Add transaction</button>
          </div>}
        </section>
      </>
    )}
  </div>;
}
