import React, { useEffect, useState, useCallback } from "react";
import { io } from "socket.io-client";
import api from "../config/api";
import styles from "./CategoriesPage.module.css";

const emptyForm = {
  nameAz: "",
  description: "",
  weightRange: "",
  imageUrl: "",
  videoUrl: "",
  pricePerShare: "",
  totalShares: "1",
  isActive: true,
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [togglingId, setTogglingId] = useState("");

  const fetchCategories = useCallback(async () => {
    try {
      const res = await api.get("/admin/categories");
      setCategories(res.data.data.categories || []);
    } catch (err) {
      alert(err.response?.data?.message || "Kateqoriyalar yüklənmədi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();

    // Real-time socket — connect directly to backend (Vite proxy doesn't forward WS)
    const socketUrl = "http://localhost:5000";
    const socket = io(socketUrl, { transports: ["websocket"] });
    socket.on("category_updated", () => fetchCategories());
    socket.on("new_order", () => {
      /* orders page handles this */
    });
    return () => socket.disconnect();
  }, [fetchCategories]);

  const openModal = (item = null) => {
    if (item) {
      setEditingId(item._id);
      setForm({
        nameAz: item.nameAz || "",
        description: item.description || "",
        weightRange: item.weightRange || "",
        imageUrl: item.imageUrl || "",
        videoUrl: item.videoUrl || "",
        pricePerShare: String(item.pricePerShare ?? ""),
        totalShares: String(item.totalShares ?? 1),
        isActive: !!item.isActive,
      });
    } else {
      setEditingId("");
      setForm(emptyForm);
    }
    setImageFile(null);
    setVideoFile(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId("");
    setForm(emptyForm);
    setImageFile(null);
    setVideoFile(null);
  };

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toFormData = () => {
    const body = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (key === "isActive") {
        body.append(key, value ? "true" : "false");
      } else {
        body.append(key, String(value ?? ""));
      }
    });
    if (imageFile) body.append("image", imageFile);
    if (videoFile) body.append("video", videoFile);
    return body;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = toFormData();
      if (editingId) {
        await api.put(`/admin/categories/${editingId}`, payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await api.post("/admin/categories", payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      closeModal();
      await fetchCategories();
    } catch (err) {
      alert(err.response?.data?.message || "Yadda saxlanmadı");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (categoryId) => {
    const ok = window.confirm("Bu kateqoriya silinsin?");
    if (!ok) return;
    try {
      await api.delete(`/admin/categories/${categoryId}`);
      await fetchCategories();
    } catch (err) {
      alert(err.response?.data?.message || "Silinmədi");
    }
  };

  const handleToggleActive = async (item) => {
    setTogglingId(item._id);
    try {
      await api.put(`/admin/categories/${item._id}`, {
        isActive: !item.isActive,
      });
      await fetchCategories();
    } catch (err) {
      alert(err.response?.data?.message || "Status yenilənmədi");
    } finally {
      setTogglingId("");
    }
  };

  const toggleExpand = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Kateqoriya İdarəsi</h1>
        <button className={styles.addBtn} onClick={() => openModal()}>
          + Yeni kateqoriya əlavə et
        </button>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {editingId ? "Kateqoriyanı yenilə" : "Yeni kateqoriya yarat"}
              </h2>
              <button className={styles.closeBtn} onClick={closeModal}>
                ✕
              </button>
            </div>

            <form className={styles.form} onSubmit={handleSubmit}>
              <label>
                Kateqoriya adı *
                <input
                  value={form.nameAz}
                  onChange={(e) => handleChange("nameAz", e.target.value)}
                  required
                  placeholder="Məsələn: Qoyun"
                />
              </label>

              <div className={styles.double}>
                <label>
                  Çəki aralığı (kq)
                  <input
                    value={form.weightRange}
                    onChange={(e) =>
                      handleChange("weightRange", e.target.value)
                    }
                    placeholder="Məsələn: 40 - 45"
                  />
                </label>
              </div>

              <label>
                Açıqlama
                <textarea
                  value={form.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  rows={2}
                />
              </label>

              <div className={styles.double}>
                <label>
                  Qiymət (₼) *
                  <input
                    type="number"
                    min="1"
                    value={form.pricePerShare}
                    onChange={(e) =>
                      handleChange("pricePerShare", e.target.value)
                    }
                    required
                  />
                </label>
              </div>

              <div className={styles.double}>
                <label>
                  Hissə sayı
                  <input
                    type="number"
                    min="1"
                    value={form.totalShares}
                    onChange={(e) =>
                      handleChange("totalShares", e.target.value)
                    }
                    required
                  />
                </label>

                <label className={styles.checkboxLabel}>
                  Aktiv
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => handleChange("isActive", e.target.checked)}
                  />
                </label>
              </div>

              <label>
                Şəkil URL (opsional)
                <input
                  value={form.imageUrl}
                  onChange={(e) => handleChange("imageUrl", e.target.value)}
                  placeholder="https://..."
                />
              </label>

              <div className={styles.double}>
                <label>
                  Şəkil faylı
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  />
                </label>

                <label>
                  Video faylı
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                  />
                </label>
              </div>

              <div className={styles.actions}>
                <button
                  disabled={saving}
                  type="submit"
                  className={styles.saveBtn}
                >
                  {saving
                    ? "Yadda saxlanır..."
                    : editingId
                      ? "Yenilə"
                      : "Yarat"}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className={styles.cancelBtn}
                >
                  Ləğv et
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Categories list */}
      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>Mövcud kateqoriyalar</h2>

        {loading ? (
          <p>Yüklənir...</p>
        ) : categories.length === 0 ? (
          <p>Kateqoriya yoxdur.</p>
        ) : (
          <div className={styles.list}>
            {categories.map((item) => (
              <article key={item._id} className={styles.item}>
                <div
                  className={styles.itemHeader}
                  onClick={() => toggleExpand(item._id)}
                >
                  <div className={styles.itemTitleWrap}>
                    <div>
                      <h3 className={styles.itemName}>{item.nameAz}</h3>
                      <p className={styles.itemMeta}>
                        {item.pricePerShare} ₼
                        {item.weightRange ? ` · ⚖️ ${item.weightRange} kq` : ""}
                      </p>
                    </div>
                  </div>
                  <div className={styles.itemHeaderRight}>
                    <span
                      className={
                        item.isActive ? styles.tagActive : styles.tagPassive
                      }
                    >
                      {item.isActive ? "Aktiv" : "Passiv"}
                    </span>
                    <button
                      type="button"
                      className={
                        item.isActive
                          ? styles.togglePassiveBtn
                          : styles.toggleActiveBtn
                      }
                      disabled={togglingId === item._id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleActive(item);
                      }}
                    >
                      {togglingId === item._id
                        ? "Gözləyin..."
                        : item.isActive
                          ? "Deaktiv et"
                          : "Aktiv et"}
                    </button>
                    <span className={styles.chevron}>
                      {expanded[item._id] ? "▲" : "▼"}
                    </span>
                  </div>
                </div>

                {expanded[item._id] && (
                  <div className={styles.itemBody}>
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        className={styles.previewImage}
                        alt={item.nameAz}
                      />
                    )}

                    {item.description && (
                      <p className={styles.itemDesc}>{item.description}</p>
                    )}

                    {item.videoUrl && (
                      <video
                        className={styles.previewVideo}
                        src={item.videoUrl}
                        controls
                        preload="metadata"
                      />
                    )}

                    <div className={styles.itemActions}>
                      <button
                        className={styles.editBtn}
                        onClick={() => openModal(item)}
                      >
                        Düzəliş
                      </button>
                      <button
                        className={styles.deleteBtn}
                        onClick={() => handleDelete(item._id)}
                      >
                        Sil
                      </button>
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
