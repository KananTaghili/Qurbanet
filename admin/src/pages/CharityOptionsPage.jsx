import React, { useEffect, useMemo, useState, useCallback } from "react";
import { io } from "socket.io-client";
import api from "../config/api";
import styles from "./CharityOptionsPage.module.css";

const emptyForm = {
  nameAz: "",
  icon: "🤲",
  description: "",
  content: "",
  minDonationAmount: "0",
  sortOrder: "0",
  isActive: true,
};

export default function CharityOptionsPage() {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [query, setQuery] = useState("");

  const fetchOptions = useCallback(async () => {
    try {
      const res = await api.get("/admin/charity-options");
      setOptions(res.data.data.charityOptions || []);
    } catch (err) {
      alert(err.response?.data?.message || "Xeyriyyə seçimləri yüklənmədi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOptions();
    const socket = io("http://localhost:5000", { transports: ["websocket"] });
    socket.on("charity_options_updated", () => fetchOptions());
    return () => socket.disconnect();
  }, [fetchOptions]);

  const openModal = (item = null) => {
    if (item) {
      setEditingId(item._id);
      setForm({
        nameAz: item.nameAz || "",
        icon: item.icon || "🤲",
        description: item.description || "",
        content: item.content || "",
        minDonationAmount: String(item.minDonationAmount ?? 0),
        sortOrder: String(item.sortOrder ?? 0),
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

    if (!form.nameAz.trim()) {
      alert("Ad boş ola bilməz");
      return;
    }

    setSaving(true);
    try {
      const payload = toFormData();
      if (editingId) {
        await api.put(`/admin/charity-options/${editingId}`, payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await api.post("/admin/charity-options", payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      fetchOptions();
      closeModal();
    } catch (err) {
      alert(err.response?.data?.message || "Səhv baş verdi");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOption = async (id) => {
    if (!window.confirm("Silinsin?")) return;
    try {
      await api.delete(`/admin/charity-options/${id}`);
      fetchOptions();
    } catch (err) {
      alert(err.response?.data?.message || "Silinmədi");
    }
  };

  const filteredOptions = useMemo(() => {
    if (!query) return options;
    const q = query.toLowerCase();
    return options.filter((opt) => opt.nameAz.toLowerCase().includes(q));
  }, [options, query]);

  if (loading) {
    return <div style={styles.loading}>Yüklənir...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>Xeyriyyə Seçimləri</h1>
        <div style={styles.headerActions}>
          <input
            type="text"
            placeholder="Axtarış..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={styles.searchInput}
          />
          <button onClick={() => openModal()} style={styles.addBtn}>
            + Yeni
          </button>
        </div>
      </div>

      <div style={styles.listContainer}>
        {filteredOptions.map((option) => (
          <div key={option._id} style={styles.optionCard}>
            {option.imageUrl && (
              <img
                src={option.imageUrl}
                alt={option.nameAz}
                style={styles.cardImage}
              />
            )}
            <div style={styles.cardContent}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>
                  {option.icon} {option.nameAz}
                </h3>
                <span style={styles.sortOrder}>#{option.sortOrder}</span>
              </div>

              {option.description && (
                <p style={styles.description}>{option.description}</p>
              )}

              {option.content && (
                <div style={styles.contentPreview}>
                  {option.content.substring(0, 100)}
                  {option.content.length > 100 ? "..." : ""}
                </div>
              )}

              <div style={styles.cardMeta}>
                {option.minDonationAmount > 0 && (
                  <span style={styles.metaItem}>
                    Min: {option.minDonationAmount} ₼
                  </span>
                )}
                <span
                  style={{
                    ...styles.metaItem,
                    color: option.isActive ? "#2e7d32" : "#ff5252",
                  }}
                >
                  {option.isActive ? "Aktiv" : "Pasif"}
                </span>
              </div>

              <div style={styles.cardActions}>
                <button
                  onClick={() => openModal(option)}
                  style={styles.editBtn}
                >
                  Dəyiş
                </button>
                <button
                  onClick={() => handleDeleteOption(option._id)}
                  style={styles.deleteBtn}
                >
                  Sil
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {modalOpen && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h2>
              {editingId ? "Xeyriyyə Seçimi Dəyiş" : "Yeni Xeyriyyə Seçimi"}
            </h2>
            <form onSubmit={handleSubmit} style={styles.form}>
              <label style={styles.formGroup}>
                Ad:
                <input
                  type="text"
                  value={form.nameAz}
                  onChange={(e) => handleChange("nameAz", e.target.value)}
                  style={styles.input}
                />
              </label>

              <label style={styles.formGroup}>
                İkon (emoji):
                <input
                  type="text"
                  maxLength="3"
                  value={form.icon}
                  onChange={(e) => handleChange("icon", e.target.value)}
                  style={styles.input}
                />
              </label>

              <label style={styles.formGroup}>
                Qısa Açıqlama:
                <textarea
                  value={form.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  style={styles.textarea}
                  rows="2"
                />
              </label>

              <label style={styles.formGroup}>
                Məzmun (tam mətn):
                <textarea
                  value={form.content}
                  onChange={(e) => handleChange("content", e.target.value)}
                  style={styles.textarea}
                  rows="4"
                />
              </label>

              <label style={styles.formGroup}>
                Minimum Sədəqə Məbləği (₼):
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.minDonationAmount}
                  onChange={(e) =>
                    handleChange("minDonationAmount", e.target.value)
                  }
                  style={styles.input}
                />
              </label>

              <label style={styles.formGroup}>
                Sıra Nömrəsi:
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => handleChange("sortOrder", e.target.value)}
                  style={styles.input}
                />
              </label>

              <label style={styles.formGroup}>
                Şəkil:
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  style={styles.input}
                />
              </label>

              <label style={styles.formGroup}>
                Video:
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                  style={styles.input}
                />
              </label>

              <label style={styles.formGroup}>
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => handleChange("isActive", e.target.checked)}
                />
                Aktiv
              </label>

              <div style={styles.buttonGroup}>
                <button
                  type="submit"
                  disabled={saving}
                  style={styles.submitBtn}
                >
                  {saving ? "Saxlanılır..." : "Saxla"}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  style={styles.cancelBtn}
                >
                  Ləğv et
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
