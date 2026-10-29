import { useEffect, useState } from "react";
import { apiClient } from "../services/apiClient.js";

// Custom Categories
export function CustomCategories() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [type, setType] = useState("expense");
  const [error, setError] = useState("");

  // Load categories
  async function loadCategories() {
    try {
      const data = await apiClient("/api/categories");
      setCategories(data.custom || []);
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  useEffect(function loadOnStart() { loadCategories(); }, []);

  // Add category
  async function addCategory(event) {
    event.preventDefault();
    try {
      await apiClient("/api/categories", { method: "POST", body: JSON.stringify({ name, type }) });
      setName("");
      await loadCategories();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  // Delete category
  async function deleteCategory(category) {
    try {
      await apiClient("/api/categories/" + category._id, { method: "DELETE" });
      await loadCategories();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return <section className="panel"><h2>Custom categories</h2>{error && <div className="error-banner" role="alert">{error}</div>}<form onSubmit={addCategory}><label>Category name<input value={name} maxLength="40" onChange={function update(event) { setName(event.target.value); }} required /></label><label>Type<select value={type} onChange={function update(event) { setType(event.target.value); }}><option value="expense">Expense</option><option value="income">Income</option></select></label><button className="primary-button" type="submit">Add category</button></form>{categories.length === 0 ? <p>No custom categories yet.</p> : <div className="record-list">{categories.map(function categoryRow(category) { return <article className="transaction-row" key={category._id}><span><strong>{category.name}</strong><small>{category.type}</small></span><button className="text-button danger" onClick={function removeCategory() { deleteCategory(category); }}>Delete</button></article>; })}</div>}</section>;
}
