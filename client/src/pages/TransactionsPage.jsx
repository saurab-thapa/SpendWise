import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { apiClient } from "../services/apiClient.js";
import { useAuth } from "../context/AuthContext.jsx";
import { formatMoney, toMinor } from "../utils/money.js";
import { accountTypeConfig } from "../config/accountTypeConfig.js";

export function TransactionsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [categoriesByType, setCategoriesByType] = useState({ income: [], expense: [] });
  const [filters, setFilters] = useState({ search: "", type: "", category: "" });
  const [form, setForm] = useState({
    type: "expense",
    amountMinor: "",
    category: "",
    description: "",
    notes: "",
    date: new Date().toISOString().slice(0, 10)
  });
  const accountConfig = accountTypeConfig[user?.accountType || "student"];
  const allCategories = [...new Set([...categoriesByType.income, ...categoriesByType.expense])];

  async function loadTransactions() {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      if (filters.search) params.set("search", filters.search);
      if (filters.type) params.set("type", filters.type);
      if (filters.category) params.set("category", filters.category);
      const data = await apiClient("/api/transactions?" + params.toString());
      setItems(data.items);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadCategories() {
    try {
      const data = await apiClient("/api/categories");
      setCategoriesByType({
        income: [...new Set([...data.income, ...data.custom.filter((item) => item.type === "income").map((item) => item.name)])],
        expense: [...new Set([...data.expense, ...data.custom.filter((item) => item.type === "expense").map((item) => item.name)])]
      });
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  useEffect(function loadPage() {
    loadTransactions();
    loadCategories();
  }, []);

  function getOrderedCategories(type) {
    const categories = categoriesByType[type];
    const preferred = accountConfig[`${type}Order`];
    return [
      ...preferred.filter((category) => categories.includes(category)),
      ...categories.filter((category) => !preferred.includes(category))
    ];
  }

  function openCreate() {
    const type = "expense";
    setEditing(null);
    setForm({
      type,
      amountMinor: "",
      category: getOrderedCategories(type)[0] || "",
      description: "",
      notes: "",
      date: new Date().toISOString().slice(0, 10)
    });
    setShowForm(true);
  }

  function openEdit(item) {
    setEditing(item);
    setForm({
      type: item.type,
      amountMinor: (item.amountMinor / 100).toFixed(2),
      category: item.category,
      description: item.description,
      notes: item.notes || "",
      date: item.date.slice(0, 10)
    });
    setShowForm(true);
  }

  async function saveTransaction(event) {
    event.preventDefault();
    setError("");

    try {
      const body = { ...form, amountMinor: toMinor(form.amountMinor) };
      if (editing) {
        await apiClient("/api/transactions/" + editing._id, { method: "PATCH", body: JSON.stringify(body) });
      } else {
        await apiClient("/api/transactions", { method: "POST", body: JSON.stringify(body) });
      }
      setShowForm(false);
      await loadTransactions();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function deleteTransaction(item) {
    if (!window.confirm("Delete this transaction? This cannot be undone.")) return;

    try {
      await apiClient("/api/transactions/" + item._id, { method: "DELETE" });
      await loadTransactions();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  function changeTransactionType(type) {
    setForm({ ...form, type, category: getOrderedCategories(type)[0] || "" });
  }

  return <div className="page">
    <div className="page-heading">
      <div><p className="eyebrow">Money history</p><h1>Transactions</h1></div>
      <button className="primary-button icon-button" onClick={openCreate}><Plus size={18} /> Add transaction</button>
    </div>
    <div className="filter-row">
      <label>Search<input value={filters.search} onChange={function change(event) { setFilters({ ...filters, search: event.target.value }); }} placeholder="Description" /></label>
      <label>Type<select value={filters.type} onChange={function change(event) { setFilters({ ...filters, type: event.target.value }); }}><option value="">All types</option><option value="income">Income</option><option value="expense">Expense</option></select></label>
      <label>Category<select value={filters.category} onChange={function change(event) { setFilters({ ...filters, category: event.target.value }); }}><option value="">All categories</option>{allCategories.map((category) => <option key={category}>{category}</option>)}</select></label>
      <button className="secondary-button" onClick={loadTransactions}>Apply</button>
    </div>
    {error && <div className="error-banner" role="alert">{error}</div>}
    {loading ? <div className="loading-state">Loading transactions...</div> : items.length === 0 ? (
      <div className="empty-state"><h2>No transactions found</h2><p>Add an income or expense record to begin.</p><button className="primary-button" onClick={openCreate}>Add transaction</button></div>
    ) : (
      <div className="record-list">{items.map((item) => <article className="record-row" key={item._id}>
        <div><strong>{item.description}</strong><small>{item.category} · {item.date.slice(0, 10)}</small></div>
        <strong className={item.type === "income" ? "positive" : "negative"}>{item.type === "income" ? "+" : "-"}{formatMoney(item.amountMinor, user?.currency)}</strong>
        <div className="row-actions">
          <button className="icon-only" aria-label="Edit transaction" onClick={() => openEdit(item)}><Pencil size={17} /></button>
          <button className="icon-only danger" aria-label="Delete transaction" onClick={() => deleteTransaction(item)}><Trash2 size={17} /></button>
        </div>
      </article>)}</div>
    )}
    {showForm && <div className="dialog-backdrop" role="presentation"><section className="dialog" role="dialog" aria-modal="true" aria-labelledby="transaction-dialog-title">
      <h2 id="transaction-dialog-title">{editing ? "Edit transaction" : "Add transaction"}</h2>
      <form onSubmit={saveTransaction}>
        <label>Type<select value={form.type} onChange={(event) => changeTransactionType(event.target.value)}><option value="income">Income</option><option value="expense">Expense</option></select></label>
        <label>Amount<input type="number" min="0.01" step="0.01" value={form.amountMinor} onChange={(event) => setForm({ ...form, amountMinor: event.target.value })} required /></label>
        <label>Category<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{getOrderedCategories(form.type).map((category) => <option key={category}>{category}</option>)}</select></label>
        <label>Description<input value={form.description} maxLength="120" onChange={(event) => setForm({ ...form, description: event.target.value })} required /></label>
        <label>Notes<textarea value={form.notes} maxLength="500" onChange={(event) => setForm({ ...form, notes: event.target.value })} /></label>
        <label>Date<input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} required /></label>
        <div className="dialog-actions"><button type="button" className="secondary-button" onClick={() => setShowForm(false)}>Cancel</button><button className="primary-button" type="submit">Save</button></div>
      </form>
    </section></div>}
  </div>;
}
