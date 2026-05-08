import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../config/api.js";
import styles from "./OrderDetailPage.module.css";

const ALL_STATUSES = [
  { value: "placed", label: "Sifariş verildi" },
  { value: "confirmed", label: "Sifariş təsdiqləndi" },
  { value: "slaughtering", label: "Kəsilir" },
  { value: "preparing", label: "Hazırlanır" },
  { value: "delivering", label: "Çatdırılır" },
  { value: "completed", label: "Tamamlandı" },
  { value: "cancelled", label: "Ləğv edildi" },
];

const DISTRIBUTION_LABELS = {
  catdirilsin: "🚚 Sizə çatdırılsın",
  ozun_gotur: "🏠 Özünüz götürün",
  usaqlar_evi: "🏫 Uşaqlar evi",
  qocalar_evi: "👵 Qocalar evi",
  ehtiyac_sahibleri: "🤲 Ehtiyac sahibləri",
};

export default function OrderDetailPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusValue, setStatusValue] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/orders/${orderId}`);
      const o = res.data.data.order;
      setOrder(o);
      setStatusValue(o.status);
      setAdminNote(o.adminNote || "");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3500);
  };

  const handleUpdateStatus = async () => {
    setSaving(true);
    try {
      await api.put(`/admin/orders/${orderId}/status`, {
        status: statusValue,
        adminNote: adminNote.trim(),
      });
      showMessage("✅ Sifariş yeniləndi.");
      fetchOrder();
    } catch (err) {
      showMessage("❌ Xəta baş verdi.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleUploadMedia = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const formData = new FormData();
    Array.from(files).forEach((f) => formData.append("files", f));

    setUploading(true);
    try {
      await api.post(`/admin/orders/${orderId}/media`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      showMessage(`✅ ${files.length} fayl yükləndi.`);
      fetchOrder();
    } catch (err) {
      showMessage("❌ Fayl yüklənmədi.", "error");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDeleteMedia = async (filename) => {
    if (!confirm("Bu media faylını silmək istədiyinizə əminsiniz?")) return;
    try {
      await api.delete(`/admin/orders/${orderId}/media/${filename}`);
      showMessage("🗑️ Media silindi.");
      fetchOrder();
    } catch (err) {
      showMessage("❌ Silmə uğursuz.", "error");
    }
  };

  if (loading) return <div className={styles.loading}>Yüklənir...</div>;
  if (!order) return <div className={styles.loading}>Sifariş tapılmadı.</div>;

  return (
    <div className={styles.container}>
      {/* Mesaj */}
      {message && (
        <div
          className={`${styles.toast} ${message.type === "error" ? styles.toastError : styles.toastSuccess}`}
        >
          {message.text}
        </div>
      )}

      {/* Başlıq */}
      <div className={styles.pageHeader}>
        <button
          type="button"
          className={styles.backBtn}
          onClick={() => navigate("/orders")}
        >
          ← Sifarişlər
        </button>
        <div>
          <h1 className={styles.pageTitle}>{order.orderNumber}</h1>
          <div className={styles.pageSubRow}>
            {order.animalImageUrl ? (
              <img
                src={order.animalImageUrl}
                alt={order.animalNameAz}
                className={styles.headerAnimalImage}
              />
            ) : (
              <div className={styles.headerAnimalPlaceholder}>
                {(order.animalNameAz || "H").charAt(0)}
              </div>
            )}
            <p className={styles.pageSub}>
              {order.animalNameAz} • {order.user?.phone}
            </p>
          </div>
        </div>
      </div>

      <div className={styles.grid}>
        {/* Sol sütun */}
        <div className={styles.leftCol}>
          {/* Sifariş məlumatları */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>📋 Sifariş məlumatları</h2>
            <InfoRow label="Heyvan" value={order.animalNameAz} />
            <InfoRow
              label="Sifariş növü"
              value={order.orderMode === "serikli" ? "Şərikli" : "Yatək"}
            />
            <InfoRow
              label={order.orderMode === "serikli" ? "Hissə" : "Miqdar"}
              value={
                order.orderMode === "serikli"
                  ? `${Number(order.sharedPortion || order.quantity).toFixed(1)} hissə`
                  : `${order.quantity} ədəd`
              }
            />
            <InfoRow label="Vahid qiymət" value={`${order.pricePerUnit} ₼`} />
            <InfoRow label="Cəmi" value={`${order.totalPrice} ₼`} bold />
            <InfoRow
              label="Paylama"
              value={
                DISTRIBUTION_LABELS[order.distribution?.type] ||
                order.distribution?.type
              }
            />
            {order.distribution?.location && (
              <InfoRow label="Ünvan" value={order.distribution.location} />
            )}
            {order.distribution?.coordinates && (
              <InfoRow
                label="Koordinat"
                value={`${order.distribution.coordinates.lat.toFixed(5)}, ${order.distribution.coordinates.lng.toFixed(5)}`}
              />
            )}
            <InfoRow
              label="Ödəniş"
              value={
                order.payment?.status === "paid"
                  ? "✅ Ödənilib"
                  : "⏳ Gözlənilir"
              }
            />
            <InfoRow
              label="Sifariş tarixi"
              value={new Date(order.createdAt).toLocaleDateString("az-AZ", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            />
          </div>

          {/* İstifadəçi */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>👤 İstifadəçi</h2>
            <InfoRow label="Telefon" value={order.user?.phone} />
            {order.user?.name && <InfoRow label="Ad" value={order.user.name} />}
            <InfoRow
              label="Qeydiyyat"
              value={
                order.user?.createdAt
                  ? new Date(order.user.createdAt).toLocaleDateString("az-AZ")
                  : "—"
              }
            />
          </div>
        </div>

        {/* Sağ sütun */}
        <div className={styles.rightCol}>
          {/* Status idarəetməsi */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>⚙️ Status & Qeyd</h2>

            <label className={styles.fieldLabel}>Sifariş statusu</label>
            <select
              className={styles.select}
              value={statusValue}
              onChange={(e) => setStatusValue(e.target.value)}
            >
              {ALL_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>

            <label className={styles.fieldLabel} style={{ marginTop: 16 }}>
              Admin qeydi (istifadəçiyə görünür)
            </label>
            <textarea
              className={styles.textarea}
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="Məs: Qurbanınız yarın kəsiləcək, nəticəni burada görəcəksiniz..."
              rows={4}
              maxLength={500}
            />
            <p className={styles.charCount}>{adminNote.length}/500</p>

            <button
              type="button"
              className={styles.saveBtn}
              onClick={handleUpdateStatus}
              disabled={saving}
            >
              {saving ? "Saxlanılır..." : "💾 Yadda saxla"}
            </button>
          </div>

          {/* Media yükleme */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>📸 Media (şəkil / video)</h2>

            <button
              type="button"
              className={styles.uploadBtn}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? "⏳ Yüklənir..." : "📁 Fayl yüklə"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              style={{ display: "none" }}
              onChange={handleUploadMedia}
            />
            <p className={styles.uploadHint}>JPG, PNG, MP4, MOV (max 100MB)</p>

            {order.media && order.media.length > 0 ? (
              <div className={styles.mediaGrid}>
                {order.media.map((item, idx) => (
                  <div key={idx} className={styles.mediaItem}>
                    {item.type === "photo" ? (
                      <a href={item.url} target="_blank" rel="noreferrer">
                        <img
                          src={item.url}
                          alt="Media"
                          className={styles.mediaImg}
                        />
                      </a>
                    ) : (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className={styles.videoItem}
                      >
                        <span>▶️</span>
                        <span>Video</span>
                      </a>
                    )}
                    <button
                      type="button"
                      className={styles.deleteMediaBtn}
                      onClick={() => handleDeleteMedia(item.filename)}
                      title="Sil"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.noMedia}>Hələ media yüklənməyib</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, bold }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        marginBottom: 10,
        alignItems: "flex-start",
        gap: 12,
      }}
    >
      <span style={{ fontSize: 13, color: "#757575", flexShrink: 0 }}>
        {label}
      </span>
      <span
        style={{
          fontSize: bold ? 16 : 13,
          fontWeight: bold ? 800 : 500,
          color: bold ? "#1B5E20" : "#212121",
          textAlign: "right",
        }}
      >
        {value}
      </span>
    </div>
  );
}
