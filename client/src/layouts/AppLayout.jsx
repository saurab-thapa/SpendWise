import { NavLink, Outlet } from "react-router-dom";
import { LayoutDashboard, ArrowLeftRight, WalletCards, Target, BarChart3, FileText, Settings, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { apiClient } from "../services/apiClient.js";
import { accountTypeConfig } from "../config/accountTypeConfig.js";

export function AppLayout() {
  const { user, setUser } = useAuth();

  async function logout() {
    await apiClient("/api/auth/logout", { method: "POST", body: "{}" });
    setUser(null);
    window.location.assign("/login");
  }

  const links = [
    ["/dashboard", LayoutDashboard, "Dashboard"], ["/transactions", ArrowLeftRight, "Transactions"],
    ["/budgets", WalletCards, "Budgets"], ["/savings", Target, "Savings"],
    ["/analytics", BarChart3, "Analytics"], ["/reports", FileText, "Reports"], ["/settings", Settings, "Settings"]
  ];

  const accountConfig = accountTypeConfig[user?.accountType] || accountTypeConfig.student;

  return <div className="app-shell" style={{ "--type-accent": accountConfig.accentColor }}>
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark">S</span><span>SpendWise</span></div>
      <nav aria-label="Main navigation">
        {links.map(function navItem([path, Icon, label]) {
          return <NavLink key={path} to={path}><Icon size={19} /><span>{label}</span></NavLink>;
        })}
      </nav>
      <button className="logout-button" onClick={logout}><LogOut size={18} /> Log out</button>
    </aside>
    <main className="main-content">
      <header className="topbar"><div><strong>{user?.name}</strong><span className="account-badge">{accountConfig.displayName}</span></div></header>
      <Outlet />
      <footer className="app-footer">SpendWise is a student project. It does not connect to any bank and does not move real money.</footer>
    </main>
    <nav className="mobile-nav" aria-label="Mobile navigation">
      {links.slice(0, 5).map(function mobileItem([path, Icon, label]) {
        return <NavLink key={path} to={path}><Icon size={20} /><span>{label}</span></NavLink>;
      })}
    </nav>
  </div>;
}
