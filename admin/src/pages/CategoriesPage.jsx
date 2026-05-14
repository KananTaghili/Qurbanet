import React, { useEffect, useMemo, useState, useCallback } from "react";
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
  // Yeni sahələr
  weightOptions: [],
  hasHeadOption: true,
  headFee: "0",
  headProcessingFee: "0",
  hasFeetOption: true,
  feetFee: "0",
  feetProcessingFee: "0",
  cutStyleOptions: [{ key: "tam_cemdek", labelAz: "Tam cəmdək", fee: "0" }],
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
  const [togglingId, setTogglingId] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all | active | passive
  const [openDetailsId, setOpenDetailsId] = useState("");

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
    const socket = io("http://localhost:5000", { transports: ["websocket"] });
    socket.on("category_updated", () => fetchCategories());
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
        weightOptions: item.weightOptions || [],
        hasHeadOption: item.hasHeadOption ?? true,
        headFee: String(item.headFee ?? 0),
        headProcessingFee: String(item.headProcessingFee ?? 0),
        hasFeetOption: item.hasFeetOption ?? true,
        feetFee: String(item.feetFee ?? 0),
        feetProcessingFee: String(item.feetProcessingFee ?? 0),
        cutStyleOptions: item.cutStyleOptions || [],
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
        if (["weightOptions", "cutStyleOptions"].includes(key)) {
          body.append(key, JSON.stringify(value));
        } else {
          // All other fields are stringified
          body.append(key, String(value ?? ""));
        }
      }
    });
    if (imageFile) body.append("image", imageFile);
    if (videoFile) body.append("video", videoFile);
    return body;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.cutStyleOptions.length === 0) {
      alert("Ən azı 1 doğrama forması daxil edilməlidir (məs: Tam cəmdək)");
      return;
    }
    for (const option of form.cutStyleOptions) {
      if (!option.key || option.key.trim() === "") {
        alert("Doğrama forması üçün 'Açar (key)' boş ola bilməz.");
        return;
      }
      if (!option.labelAz || option.labelAz.trim() === "") {
        alert("Doğrama forması üçün 'Etiket (AZ)' boş ola bilməz.");
        return;
      }
      // Qiymət (fee) üçün də validasiya əlavə etmək olar, lakin hazırda string kimi qəbul edilir.
      // if (isNaN(Number(option.fee)) || Number(option.fee) < 0) { alert("Doğrama forması üçün 'Qiymət' düzgün deyil."); return; }
    }

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

  const handleWeightOptionChange = (index, key, value) => {
    const newOptions = [...form.weightOptions];
    newOptions[index] = { ...newOptions[index], [key]: value };
    handleChange("weightOptions", newOptions);
  };

  const addWeightOption = () => {
    handleChange("weightOptions", [
      ...form.weightOptions,
      { key: "", labelAz: "", price: "" },
    ]);
  };

  const removeWeightOption = (index) => {
    const newOptions = [...form.weightOptions];
    newOptions.splice(index, 1);
    handleChange("weightOptions", newOptions);
  };

  const handleCutStyleOptionChange = (index, key, value) => {
    const newOptions = [...form.cutStyleOptions];
    newOptions[index] = { ...newOptions[index], [key]: value };
    handleChange("cutStyleOptions", newOptions);
  };

  const addCutStyleOption = () => {
    handleChange("cutStyleOptions", [
      ...form.cutStyleOptions,
      { key: "", labelAz: "", fee: "" },
    ]);
  };

  const removeCutStyleOption = (index) => {
    const newOptions = [...form.cutStyleOptions];
    newOptions.splice(index, 1);
    handleChange("cutStyleOptions", newOptions);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (categories || [])
      .filter((c) => {
        if (statusFilter === "active") return !!c.isActive;
        if (statusFilter === "passive") return !c.isActive;
        return true;
      })
      .filter((c) => {
        if (!q) return true;
        const hay = `${c.nameAz || ""} ${c.type || ""} ${c.weightRange || ""}`
          .toLowerCase()
          .trim();
        return hay.includes(q);
      })
      .sort((a, b) => (a?.createdAt || "").localeCompare(b?.createdAt || ""));
  }, [categories, query, statusFilter]);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* ── Page Header / Toolbar ── */}
        <div className={styles.pageHeader}>
          <div className={styles.titleWrap}>
            <h1 className={styles.pageTitle}>Kateqoriyalar</h1>
            <p className={styles.pageSubtitle}>
              Məhsul kartları, qiymətlər və aktivlik statusu
            </p>
          </div>

          <div className={styles.toolbarRight}>
            <div className={styles.searchWrap}>
              <input
                className={styles.searchInput}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Axtar: ad, tip, çəki..."
                aria-label="Kateqoriya axtarışı"
              />
              {query ? (
                <button
                  type="button"
                  className={styles.clearBtn}
                  onClick={() => setQuery("")}
                  aria-label="Axtarışı təmizlə"
                >
                  ✕
                </button>
              ) : null}
            </div>

            <div
              className={styles.filterPills}
              role="tablist"
              aria-label="Status filtri"
            >
              <button
                type="button"
                className={`${styles.pill} ${statusFilter === "all" ? styles.pillActive : ""}`}
                onClick={() => setStatusFilter("all")}
              >
                Hamısı
              </button>
              <button
                type="button"
                className={`${styles.pill} ${statusFilter === "active" ? styles.pillActive : ""}`}
                onClick={() => setStatusFilter("active")}
              >
                Aktiv
              </button>
              <button
                type="button"
                className={`${styles.pill} ${statusFilter === "passive" ? styles.pillActive : ""}`}
                onClick={() => setStatusFilter("passive")}
              >
                Passiv
              </button>
            </div>

            <button className={styles.addBtn} onClick={() => openModal()}>
              Yeni kateqoriya
            </button>
          </div>
        </div>

        {/* ── Modal ── */}
        {modalOpen && (
          <div
            className={styles.modalOverlay}
            onClick={closeModal}
            role="presentation"
          >
            <div
              className={styles.modal}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label={editingId ? "Kateqoriya yeniləmə" : "Yeni kateqoriya"}
            >
              <div className={styles.modalHeader}>
                <div>
                  <h2 className={styles.modalTitle}>
                    {editingId
                      ? "Kateqoriyanı yenilə"
                      : "Yeni kateqoriya yarat"}
                  </h2>
                  <p className={styles.modalSubtitle}>
                    Dəyişikliklər mobil tətbiqdə dərhal görünəcək.
                  </p>
                </div>
                <button
                  className={styles.closeBtn}
                  onClick={closeModal}
                  aria-label="Bağla"
                  type="button"
                >
                  ✕
                </button>
              </div>

              <form className={styles.form} onSubmit={handleSubmit}>
                <div className={styles.formSection}>
                  <h3 className={styles.sectionHeading}>Əsas məlumatlar</h3>
                  <div className={styles.grid2}>
                    <label className={styles.field}>
                      Ad *
                      <input
                        value={form.nameAz}
                        onChange={(e) => handleChange("nameAz", e.target.value)}
                        required
                        placeholder="Məsələn: Qoyun"
                        autoFocus
                      />
                    </label>
                    <label className={styles.field}>
                      Aktivlik
                      <div className={styles.switchRow}>
                        <input
                          id="isActive"
                          type="checkbox"
                          checked={form.isActive}
                          onChange={(e) =>
                            handleChange("isActive", e.target.checked)
                          }
                        />
                        <span className={styles.switchText}>
                          {form.isActive ? "Aktiv" : "Passiv"}
                        </span>
                      </div>
                    </label>
                  </div>

                  <div className={styles.grid3}>
                    <label className={styles.field}>
                      Qiymət (₼) *
                      <input
                        type="number"
                        min="1"
                        value={form.pricePerShare}
                        onChange={(e) =>
                          handleChange("pricePerShare", e.target.value)
                        }
                        required
                        placeholder="0"
                      />
                    </label>
                    <label className={styles.field}>
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
                    <label className={styles.field}>
                      Çəki aralığı (kq)
                      <input
                        value={form.weightRange}
                        onChange={(e) =>
                          handleChange("weightRange", e.target.value)
                        }
                        placeholder="40 – 45"
                      />
                    </label>
                  </div>

                  <label className={styles.field}>
                    Açıqlama
                    <textarea
                      value={form.description}
                      onChange={(e) =>
                        handleChange("description", e.target.value)
                      }
                      rows={3}
                      placeholder="İstəyə bağlı qeyd..."
                    />
                  </label>
                </div>

                <div className={styles.formSection}>
                  <h3 className={styles.sectionHeading}>Media</h3>
                  <div className={styles.grid2}>
                    <label className={styles.field}>
                      Şəkil URL (opsional)
                      <input
                        value={form.imageUrl}
                        onChange={(e) =>
                          handleChange("imageUrl", e.target.value)
                        }
                        placeholder="https://..."
                      />
                    </label>
                    <label className={styles.field}>
                      Video URL (opsional)
                      <input
                        value={form.videoUrl}
                        onChange={(e) =>
                          handleChange("videoUrl", e.target.value)
                        }
                        placeholder="https://..."
                      />
                    </label>
                  </div>

                  <div className={styles.grid2}>
                    <label className={styles.field}>
                      Şəkil faylı
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          setImageFile(e.target.files?.[0] || null)
                        }
                      />
                    </label>
                    <label className={styles.field}>
                      Video faylı
                      <input
                        type="file"
                        accept="video/*"
                        onChange={(e) =>
                          setVideoFile(e.target.files?.[0] || null)
                        }
                      />
                    </label>
                  </div>
                </div>

                <div className={styles.formSection}>
                  <h3 className={styles.sectionHeading}>
                    Əlavə Hissələr (Baş, Ayaq)
                  </h3>
                  <div className={styles.grid2}>
                    <label className={styles.field}>
                      Baş seçimi aktivdir?
                      <div className={styles.switchRow}>
                        <input
                          id="hasHeadOption"
                          type="checkbox"
                          checked={form.hasHeadOption}
                          onChange={(e) =>
                            handleChange("hasHeadOption", e.target.checked)
                          }
                        />
                        <span className={styles.switchText}>
                          {form.hasHeadOption ? "Aktiv" : "Passiv"}
                        </span>
                      </div>
                    </label>
                    <label className={styles.field}>
                      Ayaq seçimi aktivdir?
                      <div className={styles.switchRow}>
                        <input
                          id="hasFeetOption"
                          type="checkbox"
                          checked={form.hasFeetOption}
                          onChange={(e) =>
                            handleChange("hasFeetOption", e.target.checked)
                          }
                        />
                        <span className={styles.switchText}>
                          {form.hasFeetOption ? "Aktiv" : "Passiv"}
                        </span>
                      </div>
                    </label>
                  </div>

                  {form.hasHeadOption && (
                    <div className={styles.grid2}>
                      <label className={styles.field}>
                        Baş ütülmə qiyməti (₼)
                        <input
                          type="number"
                          min="0"
                          value={form.headFee}
                          onChange={(e) =>
                            handleChange("headFee", e.target.value)
                          }
                          placeholder="0"
                        />
                      </label>
                      <label className={styles.field}>
                        Baş doğranma qiyməti (₼)
                        <input
                          type="number"
                          min="0"
                          value={form.headProcessingFee}
                          onChange={(e) =>
                            handleChange("headProcessingFee", e.target.value)
                          }
                          placeholder="0"
                        />
                      </label>
                    </div>
                  )}

                  {form.hasFeetOption && (
                    <div className={styles.grid2}>
                      <label className={styles.field}>
                        Ayaq ütülmə qiyməti (₼)
                        <input
                          type="number"
                          min="0"
                          value={form.feetFee}
                          onChange={(e) =>
                            handleChange("feetFee", e.target.value)
                          }
                          placeholder="0"
                        />
                      </label>
                      <label className={styles.field}>
                        Ayaq doğranma qiyməti (₼)
                        <input
                          type="number"
                          min="0"
                          value={form.feetProcessingFee}
                          onChange={(e) =>
                            handleChange("feetProcessingFee", e.target.value)
                          }
                          placeholder="0"
                        />
                      </label>
                    </div>
                  )}
                </div>

                <div className={styles.formSection}>
                  <h3 className={styles.sectionHeading}>Çəki Seçimləri</h3>
                  {form.weightOptions.map((option, index) => (
                    <div key={index} className={styles.dynamicRow}>
                      <label className={styles.field}>
                        Açar (key)
                        <input
                          value={option.key}
                          onChange={(e) =>
                            handleWeightOptionChange(
                              index,
                              "key",
                              e.target.value,
                            )
                          }
                          placeholder="məs: 20_25"
                        />
                      </label>
                      <label className={styles.field}>
                        Etiket (AZ)
                        <input
                          value={option.labelAz}
                          onChange={(e) =>
                            handleWeightOptionChange(
                              index,
                              "labelAz",
                              e.target.value,
                            )
                          }
                          placeholder="məs: 20-25 kq"
                        />
                      </label>
                      <label className={styles.field}>
                        Qiymət (₼)
                        <input
                          type="number"
                          min="0"
                          value={option.price}
                          onChange={(e) =>
                            handleWeightOptionChange(
                              index,
                              "price",
                              e.target.value,
                            )
                          }
                          placeholder="0"
                        />
                      </label>
                      <button
                        type="button"
                        className={styles.removeBtn}
                        onClick={() => removeWeightOption(index)}
                      >
                        −
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className={styles.addBtnSmall}
                    onClick={addWeightOption}
                  >
                    + Çəki seçimi əlavə et
                  </button>
                </div>

                <div className={styles.formSection}>
                  <h3 className={styles.sectionHeading}>Doğrama Qiymətləri</h3>
                  {form.cutStyleOptions.map((option, index) => (
                    <div key={index} className={styles.dynamicRow}>
                      <label className={styles.field}>
                        Açar (key)
                        <input
                          value={option.key}
                          onChange={(e) =>
                            handleCutStyleOptionChange(
                              index,
                              "key",
                              e.target.value,
                            )
                          }
                          placeholder="məs: kababliq"
                        />
                      </label>
                      <label className={styles.field}>
                        Etiket (AZ)
                        <input
                          value={option.labelAz}
                          onChange={(e) =>
                            handleCutStyleOptionChange(
                              index,
                              "labelAz",
                              e.target.value,
                            )
                          }
                          placeholder="məs: Kabablıq"
                        />
                      </label>
                      <label className={styles.field}>
                        Qiymət (₼)
                        <input
                          type="number"
                          min="0"
                          value={option.fee}
                          onChange={(e) =>
                            handleCutStyleOptionChange(
                              index,
                              "fee",
                              e.target.value,
                            )
                          }
                          placeholder="0"
                        />
                      </label>
                      <button
                        type="button"
                        className={styles.removeBtn}
                        onClick={() => removeCutStyleOption(index)}
                      >
                        −
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className={styles.addBtnSmall}
                    onClick={addCutStyleOption}
                  >
                    + Doğrama forması əlavə et
                  </button>
                </div>

                <div className={styles.actions}>
                  <button
                    disabled={saving}
                    type="submit"
                    className={styles.saveBtn}
                  >
                    {saving ? "Saxlanır..." : editingId ? "Yenilə" : "Yarat"}
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

        {/* ── Categories Grid ── */}
        <section className={styles.card}>
          <div className={styles.sectionTop}>
            <h2 className={styles.sectionTitle}>
              {loading ? "Yüklənir..." : `${filtered.length} kateqoriya`}
            </h2>
            {!loading ? (
              <div className={styles.sectionMeta}>
                <span className={styles.metaDot} />
                <span>Real-time yenilənir</span>
              </div>
            ) : null}
          </div>

          {!loading && filtered.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyTitle}>Nəticə tapılmadı</div>
              <div className={styles.emptyText}>
                Axtarışı dəyişin və ya filtri “Hamısı” edin.
              </div>
              <button
                className={styles.secondaryBtn}
                onClick={() => openModal()}
              >
                Yeni kateqoriya yarat
              </button>
            </div>
          ) : null}

          {!loading && filtered.length > 0 ? (
            <div className={styles.grid}>
              {filtered.map((item) => {
                const detailsOpen = openDetailsId === item._id;
                return (
                  <article key={item._id} className={styles.gridItem}>
                    <div className={styles.gridItemTop}>
                      <div className={styles.gridTitleRow}>
                        <div className={styles.gridTitleLeft}>
                          <h3 className={styles.itemName}>{item.nameAz}</h3>
                          <div className={styles.kpis}>
                            <span className={styles.kpi}>
                              <span className={styles.kpiLabel}>Qiymət</span>
                              <span className={styles.kpiValue}>
                                {item.pricePerShare} ₼
                              </span>
                            </span>
                            <span className={styles.kpi}>
                              <span className={styles.kpiLabel}>Hissə</span>
                              <span className={styles.kpiValue}>
                                {item.totalShares || 1}
                              </span>
                            </span>
                            <span className={styles.kpi}>
                              <span className={styles.kpiLabel}>Çəki</span>
                              <span className={styles.kpiValue}>
                                {item.weightRange
                                  ? `${item.weightRange} kq`
                                  : "—"}
                              </span>
                            </span>
                          </div>
                        </div>

                        <div className={styles.gridTitleRight}>
                          <span
                            className={
                              item.isActive
                                ? styles.tagActive
                                : styles.tagPassive
                            }
                          >
                            {item.isActive ? "Aktiv" : "Passiv"}
                          </span>
                          <button
                            type="button"
                            className={styles.iconBtn}
                            onClick={() =>
                              setOpenDetailsId(detailsOpen ? "" : item._id)
                            }
                            aria-expanded={detailsOpen}
                            aria-label="Detalları aç"
                          >
                            {detailsOpen ? "−" : "+"}
                          </button>
                        </div>
                      </div>

                      <div className={styles.actionsRow}>
                        <button
                          type="button"
                          className={
                            item.isActive
                              ? styles.togglePassiveBtn
                              : styles.toggleActiveBtn
                          }
                          disabled={togglingId === item._id}
                          onClick={() => handleToggleActive(item)}
                        >
                          {togglingId === item._id
                            ? "Gözləyin..."
                            : item.isActive
                              ? "Deaktiv et"
                              : "Aktiv et"}
                        </button>
                        <div className={styles.actionsRight}>
                          <button
                            type="button"
                            className={styles.editBtn}
                            onClick={() => openModal(item)}
                          >
                            Düzəliş
                          </button>
                          <button
                            type="button"
                            className={styles.deleteBtn}
                            onClick={() => handleDelete(item._id)}
                          >
                            Sil
                          </button>
                        </div>
                      </div>
                    </div>

                    {detailsOpen ? (
                      <div className={styles.details}>
                        {item.description ? (
                          <div className={styles.detailBlock}>
                            <div className={styles.detailLabel}>Açıqlama</div>
                            <div className={styles.detailText}>
                              {item.description}
                            </div>
                          </div>
                        ) : null}

                        {item.imageUrl || item.videoUrl ? (
                          <div className={styles.mediaRow}>
                            {item.imageUrl ? (
                              <a
                                href={item.imageUrl}
                                target="_blank"
                                rel="noreferrer"
                                className={styles.mediaThumb}
                              >
                                <img src={item.imageUrl} alt={item.nameAz} />
                              </a>
                            ) : null}
                            {item.videoUrl ? (
                              <a
                                href={item.videoUrl}
                                target="_blank"
                                rel="noreferrer"
                                className={styles.mediaThumb}
                              >
                                <div className={styles.videoBadge}>Video</div>
                              </a>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
