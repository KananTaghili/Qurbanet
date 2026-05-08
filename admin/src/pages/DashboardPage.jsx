import React, { useState, useEffect } from "react";
import api from "../config/api.js";
import styles from "./DashboardPage.module.css";

const STATUS_LABELS = {
  placed: "Sifariş verildi",
  confirmed: "Sifariş təsdiqləndi",
  slaughtering: "Kəsilir",
  preparing: "Hazırlanır",
  delivering: "Çatdırılır",
  completed: "Tamamlandı",
  cancelled: "Ləğv edildi",
};

const STATUS_COLORS = {
  placed: "#FF8F00",
  confirmed: "#1565C0",
  slaughtering: "#7C2D12",
  preparing: "#6A1B9A",
  delivering: "#1D4ED8",
  completed: "#1B5E20",
  cancelled: "#B71C1C",
};

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get("/admin/stats");
      setStats(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className={styles.loading}>Yüklənir...</div>;
  if (!stats) return null;

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>📊 Dashboard</h1>

      {/* Əsas statistika */}
      <div className={styles.statsGrid}>
        <StatCard
          icon="📋"
          label="Cəmi sifarişlər"
          value={stats.totalOrders}
          color="#1B5E20"
        />
        <StatCard
          icon="👥"
          label="İstifadəçilər"
          value={stats.totalUsers}
          color="#1565C0"
        />
        <StatCard
          icon="💰"
          label="Cəmi gəlir (ödənilmiş)"
          value={`${stats.totalRevenue} ₼`}
          color="#6A1B9A"
        />
      </div>

      {/* Status bölgüsü */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Sifariş statusları</h2>
        <div className={styles.statusGrid}>
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <div key={key} className={styles.statusCard}>
              <div
                className={styles.statusDot}
                style={{ backgroundColor: STATUS_COLORS[key] }}
              />
              <div>
                <p className={styles.statusCount}>
                  {stats.statusStats[key] || 0}
                </p>
                <p className={styles.statusLabel}>{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Heyvan statistikası */}
      {stats.animalStats.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Heyvan üzrə statistika</h2>
          <div className={styles.animalGrid}>
            {stats.animalStats.map((a) => (
              <div key={a._id} className={styles.animalCard}>
                {a.imageUrl ? (
                  <img
                    src={a.imageUrl}
                    alt={a.nameAz || a._id}
                    className={styles.animalImage}
                  />
                ) : (
                  <div className={styles.animalImagePlaceholder}>
                    {(a.nameAz || a._id || "H").charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className={styles.animalName}>{a.nameAz || a._id}</p>
                  <p className={styles.animalCount}>{a.count} sifariş</p>
                  <p className={styles.animalRevenue}>{a.revenue} ₼ gəlir</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className={styles.statCard} style={{ borderTopColor: color }}>
      <span className={styles.statIcon}>{icon}</span>
      <p className={styles.statValue} style={{ color }}>
        {value}
      </p>
      <p className={styles.statLabel}>{label}</p>
    </div>
  );
}
