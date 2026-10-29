import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { apiClient } from "../services/apiClient.js";
import { useAuth } from "../context/AuthContext.jsx";

export function LoginPage() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  if (user) return <Navigate to="/dashboard" replace />;
  async function submit(event) {
    event.preventDefault(); setError("");
    try { const data = await apiClient("/api/auth/login", { method: "POST", body: JSON.stringify(form) }); setUser(data.user); }
    catch (requestError) { setError(requestError.message); }
  }
  return <main className="auth-page"><section className="auth-panel"><div className="brand auth-brand"><span className="brand-mark">S</span><span>SpendWise</span></div><p className="tagline">Take control of your money.</p><h1>Log in</h1>{error && <div className="error-banner" role="alert">{error}</div>}<form onSubmit={submit}><label>Email<input type="email" value={form.email} onChange={function update(event) { setForm({ ...form, email: event.target.value }); }} required /></label><label>Password<input type="password" value={form.password} onChange={function update(event) { setForm({ ...form, password: event.target.value }); }} required /></label><button className="primary-button" type="submit">Log in</button></form><p>New to SpendWise? <Link to="/register">Create an account</Link></p></section><footer>SpendWise is a student project. It does not connect to any bank and does not move real money.</footer></main>;
}
