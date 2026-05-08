import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import api from "../config/api.js";
import styles from "./OrdersPage.module.css";

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
  placed: { bg: "#FFF3E0", text: "#E65100" },
  confirmed: { bg: "#E3F2FD", text: "#1565C0" },
  slaughtering: { bg: "#FCE7D6", text: "#7C2D12" },
  preparing: { bg: "#F3E5F5", text: "#6A1B9A" },
  delivering: { bg: "#E8F0FE", text: "#1D4ED8" },
  completed: { bg: "#E8F5E9", text: "#1B5E20" },
  cancelled: { bg: "#FFEBEE", text: "#B71C1C" },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterStatus, setFilterStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (filterStatus) params.status = filterStatus;
      const res = await api.get("/admin/orders", { params });
      setOrders(res.data.data.orders);
      setTotal(res.data.data.pagination.total);
      setTotalPages(res.data.data.pagination.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    const socketUrl = "http://localhost:5000";
    const socket = io(socketUrl, { transports: ["websocket"] });
    socket.on("new_order", () => fetchOrders());
    socket.on("order_updated", () => fetchOrders());
    return () => socket.disconnect();
  }, [fetchOrders]);

  const handleFilterChange = (status) => {
    setFilterStatus(status);
    setPage(1);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>
          📋 Sifarişlər <span className={styles.count}>({total})</span>
        </h1>
      </div>

      {/* Filter */}
      <div className={styles.filters}>
        <button
          className={`${styles.filterBtn} ${filterStatus === "" ? styles.filterActive : ""}`}
          onClick={() => handleFilterChange("")}
        >
          Hamısı
        </button>
        {Object.entries(STATUS_LABELS).map(([key, label]) => (
          <button
            key={key}
            className={`${styles.filterBtn} ${filterStatus === key ? styles.filterActive : ""}`}
            onClick={() => handleFilterChange(key)}
            style={
              filterStatus === key
                ? {
                    background: STATUS_COLORS[key]?.bg,
                    color: STATUS_COLORS[key]?.text,
                    borderColor: STATUS_COLORS[key]?.text,
                  }
                : {}
            }
          >
            {label}
          </button>
        ))}
      </div>

      {/* Cədvəl */}
      {loading ? (
        <div className={styles.loading}>Yüklənir...</div>
      ) : orders.length === 0 ? (
        <div className={styles.empty}>Sifariş tapılmadı</div>
      ) : (
        <>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Sifariş №</th>
                  <th>İstifadəçi</th>
                  <th>Heyvan</th>
                  <th>Növ</th>
                  <th>Miqdar</th>
                  <th>Məbləğ</th>
                  <th>Status</th>
                  <th>Tarix</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const sc = STATUS_COLORS[order.status] || {
                    bg: "#f5f5f5",
                    text: "#757575",
                  };
                  return (
                    <tr
                      key={order.id}
                      className={styles.tableRow}
                      onClick={() => navigate(`/orders/${order.id}`)}
                    >
                      <td className={styles.orderNum}>{order.orderNumber}</td>
                      <td>
                        <div className={styles.userCell}>
                          <span className={styles.userPhone}>
                            {order.user?.phone}
                          </span>
                          {order.user?.name && (
                            <span className={styles.userName}>
                              {order.user.name}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className={styles.animalCell}>
                          {order.animalImageUrl ? (
                            <img
                              src={order.animalImageUrl}
                              alt={order.animalNameAz}
                              className={styles.animalImage}
                            />
                          ) : (
                            <div className={styles.animalImagePlaceholder}>
                              {(order.animalNameAz || "H").charAt(0)}
                            </div>
                          )}
                          <span>{order.animalNameAz}</span>
                        </div>
                      </td>
                      <td>
                        {order.orderMode === "serikli" ? "Şərikli" : "Yatək"}
                      </td>
                      <td>
                        {order.orderMode === "serikli"
                          ? Number(
                              order.sharedPortion || order.quantity,
                            ).toFixed(1)
                          : order.quantity}
                      </td>
                      <td className={styles.price}>{order.totalPrice} ₼</td>
                      <td>
                        <span
                          className={styles.statusBadge}
                          style={{ background: sc.bg, color: sc.text }}
                        >
                          {STATUS_LABELS[order.status] || order.status}
                        </span>
                      </td>
                      <td>
                        {new Date(order.createdAt).toLocaleDateString("az-AZ")}
                      </td>
                      <td className={styles.arrow}>→</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className={styles.pageBtn}
              >
                ← Əvvəlki
              </button>
              <span className={styles.pageInfo}>
                {page} / {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className={styles.pageBtn}
              >
                Növbəti →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
