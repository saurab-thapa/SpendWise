import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus } from "lucide-react";
import { apiClient } from "../services/apiClient.js";
import { useAuth } from "../context/AuthContext.jsx";
import { accountTypeConfig } from "../config/accountTypeConfig.js";
import { formatMoney, toMinor } from "../utils/money.js";

export function BudgetsPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [month, setMonth] = useState(searchParams.get("month") || new Date().toISOString().slice(0, 7));
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showTemplate, setShowTemplate] = useState(false);
  const [form, setForm] = useState({ category: "", amountMinor: "" });
  const [templateAmounts, setTemplateAmounts] = useState([]);
  const accountConfig = accountTypeConfig[user?.accountType || "student"];

  async function load() {
    setLoading(true);
    setError("");

    try {
      const data = await apiClient("/api/budgets?month=" + month);
      setBudgets(data.budgets);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(function loadMonth() {
    load();
  }, [month]);

  useEffect(function openLinkedTemplate() {
    if (searchParams.get("template") !== "1") return;

    const templateMonth = searchParams.get("month") || new Date().toISOString().slice(0, 7);
    setMonth(templateMonth);
    setTemplateAmounts(accountConfig.budgetTemplate.map((category) => ({ category, amount: "" })));
    setShowTemplate(true);
    setSearchParams({ month: templateMonth }, { replace: true });
  }, [searchParams, setSearchParams, accountConfig]);

  function openBudgetForm() {
    setForm({ category: "", amountMinor: "" });
    setShowForm(true);
  }

  async function createBudget(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      await apiClient("/api/budgets", {
        method: "POST",
        body: JSON.stringify({
          month,
          category: form.category || null,
          amountMinor: toMinor(form.amountMinor)
        })
      });
      setShowForm(false);
      setMessage("Budget created.");
      await load();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function deleteBudget(budget) {
    if (!window.confirm("Delete this budget?")) return;

    try {
      await apiClient("/api/budgets/" + budget._id, { method: "DELETE" });
      await load();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  function updateTemplateAmount(category, amount) {
    setTemplateAmounts(templateAmounts.map((item) => (
      item.category === category ? { ...item, amount } : item
    )));
  }

  async function createTemplateBudgets(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    const completedRows = templateAmounts.filter((item) => item.amount.trim() !== "");
    if (!completedRows.length) {
      setError("Enter an amount for at least one suggested category.");
      return;
    }

    try {
      await apiClient("/api/budgets", {
        method: "POST",
        body: JSON.stringify({
          month,
          budgets: completedRows.map((item) => ({
            category: item.category,
            amountMinor: toMinor(item.amount)
          }))
        })
      });
      setShowTemplate(false);
      setMessage("Suggested budgets created.");
      await load();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  function openSuggestedTemplate() {
    setTemplateAmounts(accountConfig.budgetTemplate.map((category) => ({ category, amount: "" })));
    setShowTemplate(true);
  }

  return <div className="page">
    <div className="page-heading">
      <div><p className="eyebrow">Monthly limits</p><h1>Budgets</h1></div>
      <div className="heading-actions">
        <label>Month<input type="month" value={month} onChange={(event) => setMonth(event.target.value)} /></label>
        <button className="secondary-button" type="button" onClick={openSuggestedTemplate}>Use suggested template</button>
        <button className="primary-button icon-button" type="button" onClick={openBudgetForm}><Plus size={18} /> Add budget</button>
      </div>
    </div>
    {error && <div className="error-banner" role="alert">{error}</div>}
    {message && <div className="success-banner" role="status">{message}</div>}
    {loading ? <p>Loading budgets...</p> : budgets.length === 0 ? (
      <div className="empty-state"><h2>No budgets for this month</h2><p>Create an overall budget or a category limit.</p><button className="primary-button" onClick={openBudgetForm}>Add budget</button></div>
    ) : (
      <div className="budget-list">{budgets.map((budget) => <article className="panel budget-row" key={budget._id}>
        <div className="budget-title">
          <div><strong>{budget.category || "Overall monthly budget"}</strong><small>{budget.status}</small></div>
          <strong>{formatMoney(budget.remainingMinor, user?.currency)} remaining</strong>
        </div>
        <progress max="100" value={Math.min(budget.percentUsed, 100)} aria-label={`${budget.category || "Overall"} budget used ${budget.percentUsed} percent`} />
        <div className="budget-values">
          <span>{formatMoney(budget.spentMinor, user?.currency)} spent</span>
          <span>{formatMoney(budget.amountMinor, user?.currency)} limit</span>
          <button className="text-button danger" onClick={() => deleteBudget(budget)}>Delete</button>
        </div>
      </article>)}</div>
    )}
    {showForm && <div className="dialog-backdrop">
      <section className="dialog" role="dialog" aria-modal="true" aria-labelledby="budget-dialog-title">
        <h2 id="budget-dialog-title">Add budget</h2>
        <form onSubmit={createBudget}>
          <label>Category<input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} placeholder="Leave blank for overall budget" /></label>
          <label>Amount<input type="number" min="0.01" step="0.01" value={form.amountMinor} onChange={(event) => setForm({ ...form, amountMinor: event.target.value })} required /></label>
          <div className="dialog-actions">
            <button type="button" className="secondary-button" onClick={() => setShowForm(false)}>Cancel</button>
            <button className="primary-button" type="submit">Create budget</button>
          </div>
        </form>
      </section>
    </div>}
    {showTemplate && <div className="dialog-backdrop">
      <section className="dialog" role="dialog" aria-modal="true" aria-labelledby="template-dialog-title">
        <h2 id="template-dialog-title">{accountConfig.displayName} suggested budget</h2>
        <p>Enter limits for the categories you want. Nothing is saved until you confirm.</p>
        <form onSubmit={createTemplateBudgets}>
          {templateAmounts.map((item) => {
            const existing = budgets.some((budget) => budget.category === item.category);
            return <label key={item.category}>
              {item.category}{existing && <small> A budget already exists for this month and will not be changed.</small>}
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={item.amount}
                onChange={(event) => updateTemplateAmount(item.category, event.target.value)}
                disabled={existing}
                placeholder={existing ? "Already set" : "Enter monthly limit"}
              />
            </label>;
          })}
          <div className="dialog-actions">
            <button type="button" className="secondary-button" onClick={() => setShowTemplate(false)}>Cancel</button>
            <button className="primary-button" type="submit">Confirm and create budgets</button>
          </div>
        </form>
      </section>
    </div>}
  </div>;
}
