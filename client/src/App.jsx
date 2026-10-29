import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { AppLayout } from "./layouts/AppLayout.jsx";
import { LoginPage } from "./pages/LoginPage.jsx";
import { RegisterPage } from "./pages/RegisterPage.jsx";
import { DashboardPage } from "./pages/DashboardPage.jsx";
import { TransactionsPage } from "./pages/TransactionsPage.jsx";
import { BudgetsPage } from "./pages/BudgetsPage.jsx";
import { SavingsPage } from "./pages/SavingsPage.jsx";
import { AnalyticsPage } from "./pages/AnalyticsPage.jsx";
import { ReportsPage } from "./pages/ReportsPage.jsx";
import { SettingsPage } from "./pages/SettingsPage.jsx";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <main className="loading-page">Loading SpendWise...</main>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export function App() {
  return <AuthProvider><BrowserRouter><Routes><Route path="/login" element={<LoginPage />} /><Route path="/register" element={<RegisterPage />} /><Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}><Route path="/dashboard" element={<DashboardPage />} /><Route path="/transactions" element={<TransactionsPage />} /><Route path="/budgets" element={<BudgetsPage />} /><Route path="/savings" element={<SavingsPage />} /><Route path="/analytics" element={<AnalyticsPage />} /><Route path="/reports" element={<ReportsPage />} /><Route path="/settings" element={<SettingsPage />} /></Route><Route path="/" element={<ProtectedRoot />} /><Route path="*" element={<Navigate to="/dashboard" replace />} /></Routes></BrowserRouter></AuthProvider>;
}

function ProtectedRoot() { const { user, loading } = useAuth(); if (loading) return <main className="loading-page">Loading SpendWise...</main>; if (!user) return <Navigate to="/login" replace />; return <Navigate to="/dashboard" replace />; }
