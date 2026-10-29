import { useState } from "react";
import { apiClient } from "../services/apiClient.js";

// Onboarding Dialog
export function OnboardingDialog({ user, refreshUser }) {
  const [form, setForm] = useState({ currency: user?.currency || "INR", estimatedMonthlyIncomeMinor: "", estimatedMonthlyBudgetMinor: "", goalsNote: "" });
  const [error, setError] = useState("");

  // Update form
  function updateField(name, value) {
    setForm({ ...form, [name]: value });
  }

  // Save onboarding
  async function save(event) {
    event.preventDefault();
    setError("");
    try {
      const body = {
        currency: form.currency,
        estimatedMonthlyIncomeMinor: form.estimatedMonthlyIncomeMinor ? Math.round(Number(form.estimatedMonthlyIncomeMinor) * 100) : 0,
        estimatedMonthlyBudgetMinor: form.estimatedMonthlyBudgetMinor ? Math.round(Number(form.estimatedMonthlyBudgetMinor) * 100) : 0,
        goalsNote: form.goalsNote
      };
      await apiClient("/api/profile/onboarding", { method: "PATCH", body: JSON.stringify(body) });
      await refreshUser();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  // Skip onboarding
  async function skip() {
    try {
      await apiClient("/api/profile/onboarding", { method: "PATCH", body: JSON.stringify({ currency: user?.currency || "INR", estimatedMonthlyIncomeMinor: 0, estimatedMonthlyBudgetMinor: 0, goalsNote: "" }) });
      await refreshUser();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return <div className="dialog-backdrop"><section className="dialog" role="dialog" aria-modal="true" aria-labelledby="onboarding-title"><div className="dialog-heading"><h2 id="onboarding-title">Set up SpendWise</h2><button className="icon-only" type="button" aria-label="Close onboarding" onClick={skip}>X</button></div><p>These details are optional. You can complete or change them later.</p>{error && <div className="error-banner" role="alert">{error}</div>}<form onSubmit={save}><label>Preferred currency<select value={form.currency} onChange={function update(event) { updateField("currency", event.target.value); }}><option value="INR">INR</option><option value="USD">USD</option><option value="EUR">EUR</option><option value="GBP">GBP</option><option value="JPY">JPY</option><option value="AUD">AUD</option><option value="CAD">CAD</option></select></label><label>Estimated monthly income<input type="number" min="0" step="0.01" value={form.estimatedMonthlyIncomeMinor} onChange={function update(event) { updateField("estimatedMonthlyIncomeMinor", event.target.value); }} /></label><label>Estimated monthly budget<input type="number" min="0" step="0.01" value={form.estimatedMonthlyBudgetMinor} onChange={function update(event) { updateField("estimatedMonthlyBudgetMinor", event.target.value); }} /></label><label>Financial goals<textarea maxLength="300" value={form.goalsNote} onChange={function update(event) { updateField("goalsNote", event.target.value); }} /></label><div className="dialog-actions"><button type="button" className="secondary-button" onClick={skip}>Skip for now</button><button type="submit" className="primary-button">Save and continue</button></div></form></section></div>;
}
