import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Leaf, ShoppingBag, CreditCard, Map,
  Users, ShieldCheck, BarChart3, User, LogOut, Menu, X,
  Bell, Search, TreePine, Zap, ChevronRight
} from 'lucide-react';
import './Layout.css';

const NAV_ITEMS = [
  { to: '/dashboard',  label: 'Dashboard',    icon: LayoutDashboard, roles: null },
  { to: '/activities', label: 'Activities',   icon: Leaf,            roles: null },
  { to: '/map',        label: 'Map View',     icon: Map,             roles: null },
  { to: '/marketplace',label: 'Marketplace',  icon: ShoppingBag,     roles: null },
  { to: '/credits',    label: 'My Credits',   icon: CreditCard,      roles: null },
  { to: '/leaderboard',label: 'Leaderboard',  icon: BarChart3,       roles: null },
  { to: '/auditor',    label: 'Auditor Panel',icon: ShieldCheck,     roles: ['auditor','admin'] },
  { to: '/admin',      label: 'Admin Panel',  icon: Users,           roles: ['admin'] },
  { to: '/profile',    label: 'Profile',      icon: User,            roles: null },
];

const ROLE_COLORS = {
  citizen: '#2d9b5a', farmer: '#e8a020', auditor: '#1a7fa8',
  company: '#7b4fd4', admin: '#e05c3a'
};

const ROLE_ICONS = { citizen: '🧑', farmer: '🌾', auditor: '🔍', company: '🏢', admin: '⚡' };

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const roleColor = ROLE_COLORS[user?.role] || '#2d9b5a';
  const allowedNav = NAV_ITEMS.filter(item => !item.roles || item.roles.includes(user?.role));

  return (
    <div className="app-layout">
      {/* Mobile overlay */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="logo-icon">
            <TreePine size={22} strokeWidth={2.5} />
            <Zap size={12} className="logo-zap" />
          </div>
          <div className="logo-text">
            <span className="logo-main">KCRVP</span>
            <span className="logo-sub">Kerala Carbon Registry</span>
          </div>
          <button className="sidebar-close-btn" onClick={() => setSidebarOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {/* User card */}
        <div className="sidebar-user">
          <div className="user-avatar" style={{ background: `${roleColor}22`, borderColor: roleColor }}>
            {user?.avatar
              ? <img src={user.avatar} alt={user.name} />
              : <span>{user?.name?.charAt(0).toUpperCase()}</span>
            }
          </div>
          <div className="user-info">
            <span className="user-name">{user?.name}</span>
            <span className="user-role" style={{ color: roleColor }}>
              {ROLE_ICONS[user?.role]} {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
            </span>
          </div>
        </div>

        {/* Carbon score */}
        <div className="sidebar-score">
          <div className="score-item">
            <span className="score-num">{(user?.totalCarbonSaved || 0).toFixed(1)}</span>
            <span className="score-label">kg CO₂ saved</span>
          </div>
          <div className="score-divider" />
          <div className="score-item">
            <span className="score-num">{(user?.carbonCredits || 0).toFixed(3)}</span>
            <span className="score-label">Credits</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {allowedNav.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon size={18} strokeWidth={2} />
              <span>{item.label}</span>
              <ChevronRight size={14} className="nav-chevron" />
            </NavLink>
          ))}
        </nav>

        {/* Submit CTA */}
        <div className="sidebar-cta">
          <button className="cta-btn" onClick={() => { navigate('/activities/submit'); setSidebarOpen(false); }}>
            <Leaf size={16} />
            Log Green Activity
          </button>
        </div>

        {/* Logout */}
        <button className="sidebar-logout" onClick={logout}>
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </aside>

      {/* Main */}
      <div className="main-content">
        {/* Topbar */}
        <header className="topbar">
          <button className="menu-btn" onClick={() => setSidebarOpen(true)}>
            <Menu size={22} />
          </button>

          <div className="topbar-search">
            <Search size={16} className="search-icon" />
            <input placeholder="Search activities, credits…" />
          </div>

          <div className="topbar-right">
            <div className="eco-score-pill">
              <span className="eco-dot" />
              <span>Score: <strong>{user?.sustainabilityScore || 0}</strong>/100</span>
            </div>
            <button className="notif-btn">
              <Bell size={18} />
              <span className="notif-dot" />
            </button>
            <div className="topbar-avatar" onClick={() => navigate('/profile')}>
              {user?.avatar
                ? <img src={user.avatar} alt="" />
                : <span>{user?.name?.charAt(0)}</span>
              }
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
