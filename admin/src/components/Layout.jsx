import React from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import styles from "./Layout.module.css";

export default function Layout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className={styles.shell}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}>
          <div>
            <p className={styles.logoTitle}>Qurban.az</p>
            <p className={styles.logoSub}>Admin Panel</p>
          </div>
        </div>

        <nav className={styles.nav}>
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.navItemActive : ""}`
            }
          >
            <span>📊</span> Dashboard
          </NavLink>
          <NavLink
            to="/orders"
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.navItemActive : ""}`
            }
          >
            <span>📋</span> Sifarişlər
          </NavLink>
          <NavLink
            to="/shared-customers"
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.navItemActive : ""}`
            }
          >
            <span>🧩</span> Şərikli müştərilər
          </NavLink>
          <NavLink
            to="/categories"
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.navItemActive : ""}`
            }
          >
            Kateqoriyalar
          </NavLink>
        </nav>

        <button className={styles.logoutBtn} onClick={handleLogout}>
          🚪 Çıxış
        </button>
      </aside>

      {/* Main content */}
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
