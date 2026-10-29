import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { apiClient } from "../services/apiClient.js";
import { useAuth } from "../context/AuthContext.jsx";
import { accountTypeConfig } from "../config/accountTypeConfig.js";

export function RegisterPage() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "", accountType: "student" });
  const [error, setError] = useState(""); const [fields, setFields] = useState({});
  if (user) return <Navigate to="/dashboard" replace />;
  async function submit(event) {
    event.preventDefault(); setError(""); setFields({});
    if (form.password !== form.confirmPassword) { setFields({ confirmPassword: "Passwords do not match" }); return; }
    try { const data = await apiClient("/api/auth/register", { method: "POST", body: JSON.stringify(form) }); setUser(data.user); }
    catch (requestError) { setError(requestError.message); setFields(requestError.fields); }
  }
  function updateField(name, value) { setForm({ ...form, [name]: value }); }
  return <main className="auth-page"><section className="auth-panel register-panel"><div className="brand auth-brand"><span className="brand-mark">S</span><span>SpendWise</span></div><p className="tagline">Take control of your money.</p><h1>Create an account</h1>{error && <div className="error-banner" role="alert">{error}</div>}<form onSubmit={submit}><label>Full name<input value={form.name} onChange={function update(event) { updateField("name", event.target.value); }} required /></label><label>Email<input type="email" value={form.email} onChange={function update(event) { updateField("email", event.target.value); }} required /></label><label>Password<input type="password" minLength="8" maxLength="72" value={form.password} onChange={function update(event) { updateField("password", event.target.value); }} required /></label><label>Confirm password<input type="password" value={form.confirmPassword} onChange={function update(event) { updateField("confirmPassword", event.target.value); }} required />{fields.confirmPassword && <small className="field-error">{fields.confirmPassword}</small>}</label><fieldset><legend>Account type</legend>{Object.entries(accountTypeConfig).map(function account([value, config]) { return <label className="account-option" key={value}><input type="radio" name="accountType" checked={form.accountType === value} onChange={function choose() { updateField("accountType", value); }} /><span><strong>{config.displayName}</strong><small>{config.description}</small></span></label>; })}</fieldset><button className="primary-button" type="submit">Create account</button></form><p>Already have an account? <Link to="/login">Log in</Link></p></section><footer>SpendWise is a student project. It does not connect to any bank and does not move real money.</footer></main>;
}
