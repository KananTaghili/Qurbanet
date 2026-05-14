import React, { useEffect, useMemo, useState, useCallback } from "react";
import { io } from "socket.io-client";
import api from "../config/api";
import styles from "./DeliveryOptionsPage.module.css?module";

const emptyForm = {
  labelAz: "",
  basePrice: "0",
  description: "",
  isActive: true,
};

export default function DeliveryOptionsPage() {
  const [options, setOptions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [query, setQuery] = useState("");
  const fetchOptions = useCallback(async () => {
    try {
      const res = await api.get("/admin/delivery-options");
      setOptions(res.data.data.deliveryOptions || []);
    } catch (err) {
      alert(err.response?.data?.message || "Çatdırma seçimləri yüklənmədi");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await api.get("/admin/categories");
      setCategories(res.data.data.categories || []);
    } catch (err) {
      console.error("Kateqoriyalar yüklənmədi:", err);
    }
  }, []);

  useEffect(() => {
    fetchOptions();
    fetchCategories();
    const socket = io("http://localhost:5000", { transports: ["websocket"] });
    socket.on("delivery_options_updated", () => fetchOptions());
    return () => socket.disconnect();
  }, [fetchOptions]);

  const openModal = (item = null) => {
    if (item) {
      setEditingId(item._id);
      setForm({
        labelAz: item.labelAz || "",
        basePrice: String(item.basePrice ?? 0),
        description: item.description || "",
        isActive: !!item.isActive,
      });
    } else {
      setEditingId("");
      setForm(emptyForm);
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId("");
    setForm(emptyForm);
  };

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.labelAz.trim()) {
      alert("Ad boş ola bilməz");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        labelAz: form.labelAz.trim(),
        basePrice: Number(form.basePrice),
        description: form.description.trim(),
        isActive: form.isActive,
      };

      if (editingId) {
        await api.put(`/admin/delivery-options/${editingId}`, payload);
      } else {
        // Can't create custom options without a key, skip for now
        alert(
          "Xüsusi seçim yaratmaq mümkün deyil. Yalnız mövcud seçimləri dəyişin.",
        );
        return;
      }

      fetchOptions();
      closeModal();
    } catch (err) {
      alert(err.response?.data?.message || "Səhv baş verdi");
    } finally {
      setSaving(false);
    }
  };

  const handleSetCategoryPrice = async (optionId, categoryId, price) => {
    try {
      await api.post(`/admin/delivery-options/${optionId}/category-price`, {
        categoryId,
        price: Number(price),
      });
      fetchOptions();
    } catch (err) {
      alert(err.response?.data?.message || "Qiymət ayarlanmadı");
    }
  };

  const handleRemoveCategoryPrice = async (optionId, categoryId) => {
    if (!window.confirm("Silinsin?")) return;
    try {
      await api.delete(
        `/admin/delivery-options/${optionId}/category-price/${categoryId}`,
      );
      fetchOptions();
    } catch (err) {
      alert(err.response?.data?.message || "Qiymət silinmədi");
    }
  };

  const filteredOptions = useMemo(() => {
    if (!query) return options;
    const q = query.toLowerCase();
    return options.filter((opt) => opt.labelAz.toLowerCase().includes(q));
  }, [options, query]);

  if (loading) {
    return <div style={styles.loading}>Yüklənir...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>Çatdırma Seçimləri</h1>
        <input
          type="text"
          placeholder="Axtarış..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={styles.searchInput}
        />
      </div>

      <div style={styles.listContainer}>
        {filteredOptions.map((option) => (
          <div key={option._id} style={styles.optionCard}>
            <div style={styles.cardHeader}>
              <div style={styles.cardTitle}>
                <span style={styles.icon}>{option.icon}</span>
                <h3>{option.labelAz}</h3>
              </div>
              <div style={styles.cardMeta}>
                <span style={styles.basePrice}>{option.basePrice} ₼</span>
                <button
                  onClick={() => openModal(option)}
                  style={styles.editBtn}
                >
                  Dəyiş
                </button>
              </div>
            </div>

            <p style={styles.description}>{option.description}</p>

            {/* Category-specific prices */}
            <div style={styles.categoryPricesSection}>
              <h4>Kateqoriya Qiymətləri</h4>
              <div style={styles.categoryPricesGrid}>
                {categories.map((cat) => {
                  const catPrice = option.categorySpecificPrices?.find(
                    (p) => p.categoryId?._id === cat._id,
                  );
                  return (
                    <div key={cat._id} style={styles.categoryPriceRow}>
                      <span>{cat.nameAz}</span>
                      <div style={styles.priceInputGroup}>
                        <input
                          type="number"
                          min="0"
                          defaultValue={catPrice?.price ?? option.basePrice}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (e.key === "Enter" || !value) {
                              if (value && !catPrice) {
                                handleSetCategoryPrice(
                                  option._id,
                                  cat._id,
                                  value,
                                );
                              }
                            }
                          }}
                          onBlur={(e) => {
                            if (!catPrice && e.target.value) {
                              handleSetCategoryPrice(
                                option._id,
                                cat._id,
                                e.target.value,
                              );
                            }
                          }}
                          style={styles.priceInput}
                        />
                        {catPrice && (
                          <button
                            onClick={() =>
                              handleRemoveCategoryPrice(option._id, cat._id)
                            }
                            style={styles.removeBtn}
                          >
                            Sil
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {modalOpen && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h2>Çatdırma Seçimi Dəyiş</h2>
            <form onSubmit={handleSubmit} style={styles.form}>
              <label style={styles.formGroup}>
                Ad:
                <input
                  type="text"
                  value={form.labelAz}
                  onChange={(e) => handleChange("labelAz", e.target.value)}
                  style={styles.input}
                />
              </label>

              <label style={styles.formGroup}>
                Bazə Qiymət (₼):
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.basePrice}
                  onChange={(e) => handleChange("basePrice", e.target.value)}
                  style={styles.input}
                />
              </label>

              <label style={styles.formGroup}>
                Açıqlama:
                <textarea
                  value={form.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  style={styles.textarea}
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
