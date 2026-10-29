import { useMemo, useState } from "react";
import { Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAuth } from "../context/AuthContext.jsx";
import { useApiData } from "../hooks/useApiData.js";
import { formatMoney } from "../utils/money.js";
import { getCategoryColor, getChartPalette } from "../utils/chartColors.js";

export function AnalyticsPage() {
  const { user } = useAuth();
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [fromMonth, setFromMonth] = useState(currentMonth);
  const [toMonth, setToMonth] = useState(currentMonth);
  const trends = useApiData(`/api/analytics/monthly-trends?fromMonth=${fromMonth}&toMonth=${toMonth}`);
  const category = useApiData(`/api/analytics/spending-by-category?month=${toMonth}`);
  const palette = useMemo(getChartPalette, []);

  return <div className="page">
    <div className="page-heading">
      <div><p className="eyebrow">Real records</p><h1>Analytics</h1></div>
      <div className="heading-actions">
        <label>From<input type="month" value={fromMonth} onChange={(event) => setFromMonth(event.target.value)} /></label>
        <label>To<input type="month" value={toMonth} onChange={(event) => setToMonth(event.target.value)} /></label>
      </div>
    </div>
    <div className="analytics-grid">
      <article className="panel">
        <h2>Income and expense trend</h2>
        {trends.loading ? <p>Loading chart...</p> : trends.error ? <div className="error-banner" role="alert">{trends.error}</div> : trends.data?.rows?.length ? (
          <div className="chart-box">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={trends.data.rows}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatMoney(value, user?.currency)} />
                <Line type="monotone" dataKey="incomeMinor" name="Income" stroke={palette[2]} />
                <Line type="monotone" dataKey="expenseMinor" name="Expenses" stroke={palette[4]} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : <p>No analytics data for this date range.</p>}
      </article>
      <article className="panel">
        <h2>Spending by category</h2>
        {category.loading ? <p>Loading chart...</p> : category.error ? <div className="error-banner" role="alert">{category.error}</div> : category.data?.categoryRows?.length ? (
          <div className="chart-box">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={category.data.categoryRows} dataKey="amountMinor" nameKey="category" outerRadius={90}>
                  {category.data.categoryRows.map((row) => <Cell key={row.category} fill={getCategoryColor(row.category)} />)}
                </Pie>
                <Tooltip formatter={(value) => formatMoney(value, user?.currency)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : <p>No category spending data for this month.</p>}
      </article>
    </div>
  </div>;
}
