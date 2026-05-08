import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../config/api.js";
import styles from "./LoginPage.module.css";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError("İstifadəçi adı və şifrəni daxil edin.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/admin/login", { username, password });
      if (res.data.success) {
        login(res.data.data.token);
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Giriş uğursuz oldu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <span className={styles.logo}>Q</span>
          <h1 className={styles.title}>Qurban.az</h1>
          <p className={styles.subtitle}>Admin Panel Girişi</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>⚠️ {error}</div>}

          <div className={styles.field}>
            <label className={styles.label}>İstifadəçi adı</label>
            <input
              type="text"
              className={styles.input}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              autoComplete="username"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Şifrə</label>
            <input
              type="password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? "Giriş edilir..." : "Daxil ol"}
          </button>
        </form>

        <p className={styles.hint}>Default: admin / Admin@2025</p>
      </div>
    </div>
  );
}
