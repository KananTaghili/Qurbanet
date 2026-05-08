import React, { useEffect, useMemo, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from "react-simple-maps";
import api from "../config/api";
import styles from "./SharedCustomersPage.module.css";

const GEO_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const ANIMAL_LABELS = {
  dana: "Dana",
  deve: "Dəvə",
};

const GROUP_COLORS = ["#1B5E20", "#1565C0", "#EF6C00", "#6A1B9A", "#00838F"];

const getShare = (order) => Number(order.sharedPortion || order.quantity || 0);

const getCoords = (order) => {
  const lat = Number(order?.distribution?.coordinates?.lat);
  const lng = Number(order?.distribution?.coordinates?.lng);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  return { lat, lng };
};

const distanceKm = (a, b) => {
  if (!a || !b) return Number.POSITIVE_INFINITY;
  const toRad = (v) => (v * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
};

const groupCenter = (orders) => {
  const points = orders.map(getCoords).filter(Boolean);
  if (points.length === 0) return null;
  const avgLat = points.reduce((acc, p) => acc + p.lat, 0) / points.length;
  const avgLng = points.reduce((acc, p) => acc + p.lng, 0) / points.length;
  return { lat: avgLat, lng: avgLng };
};

const buildSuggestedGroups = (orders) => {
  const remaining = [...orders].sort((a, b) => getShare(a) - getShare(b));
  const groups = [];

  while (remaining.length > 0) {
    const seed = remaining.shift();
    let groupOrders = [seed];
    let totalShare = getShare(seed);

    while (true) {
      const capacity = Number((1 - totalShare).toFixed(6));
      const candidates = remaining
        .map((order, index) => ({ order, index }))
        .filter((item) => getShare(item.order) <= capacity + 0.0001);

      if (candidates.length === 0) break;

      const center = groupCenter(groupOrders);
      const best = candidates.sort((a, b) => {
        const distanceA = distanceKm(center, getCoords(a.order));
        const distanceB = distanceKm(center, getCoords(b.order));
        if (distanceA !== distanceB) return distanceA - distanceB;
        return getShare(a.order) - getShare(b.order);
      })[0];

      groupOrders.push(best.order);
      totalShare = Number((totalShare + getShare(best.order)).toFixed(1));
      remaining.splice(best.index, 1);
    }

    groups.push({
      id: groups.length + 1,
      totalShare,
      orders: groupOrders,
    });
  }

  return groups;
};

export default function SharedCustomersPage() {
  const [selectedType, setSelectedType] = useState("dana");
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [availableTypes, setAvailableTypes] = useState(["dana", "deve"]);

  const fetchSharedOrders = async (animalType) => {
    setLoading(true);
    try {
      const res = await api.get("/admin/shared-orders", {
        params: { animalType },
      });

      setOrders(res.data.data.orders || []);
      const incomingTypes = res.data.data.animalTypes || [];
      if (incomingTypes.length > 0) {
        const merged = Array.from(new Set(["dana", "deve", ...incomingTypes]));
        setAvailableTypes(merged);
      }
    } catch (err) {
      console.error(err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSharedOrders(selectedType);
  }, [selectedType]);

  const suggestedGroups = useMemo(() => buildSuggestedGroups(orders), [orders]);

  const orderToGroup = useMemo(() => {
    const map = {};
    suggestedGroups.forEach((group) => {
      group.orders.forEach((order) => {
        map[order.id] = group.id;
      });
    });
    return map;
  }, [suggestedGroups]);

  const mappableOrders = useMemo(
    () =>
      orders.filter(
        (o) =>
          o.distribution?.type === "mekan" &&
          o.distribution?.coordinates?.lat &&
          o.distribution?.coordinates?.lng,
      ),
    [orders],
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>🧩 Şərikli müştərilər</h1>
        <p className={styles.subtitle}>
          Ödəniş etmiş şərikli sifarişləri bir heyvanda birləşdirmək üçün panel
        </p>
      </div>

      <div className={styles.tabs}>
        {availableTypes
          .filter((t) => ["dana", "deve"].includes(t))
          .map((type) => (
            <button
              key={type}
              className={`${styles.tabBtn} ${selectedType === type ? styles.tabActive : ""}`}
              onClick={() => setSelectedType(type)}
            >
              {ANIMAL_LABELS[type] || type}
            </button>
          ))}
      </div>

      {loading ? (
        <div className={styles.loading}>Yüklənir...</div>
      ) : (
        <>
          <div className={styles.statsRow}>
            <div className={styles.statCard}>
              <p className={styles.statValue}>{orders.length}</p>
              <p className={styles.statLabel}>Şərikli sifariş</p>
            </div>
            <div className={styles.statCard}>
              <p className={styles.statValue}>{suggestedGroups.length}</p>
              <p className={styles.statLabel}>Təklif olunan heyvan sayı</p>
            </div>
            <div className={styles.statCard}>
              <p className={styles.statValue}>{mappableOrders.length}</p>
              <p className={styles.statLabel}>Çatdırılma konumu olanlar</p>
            </div>
          </div>

          <div className={styles.grid}>
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Təklif olunan qruplama</h2>
              {suggestedGroups.length === 0 ? (
                <p className={styles.empty}>
                  Bu kateqoriyada şərikli sifariş yoxdur.
                </p>
              ) : (
                <div className={styles.groupList}>
                  {suggestedGroups.map((group) => {
                    const color =
                      GROUP_COLORS[(group.id - 1) % GROUP_COLORS.length];
                    return (
                      <div key={group.id} className={styles.groupItem}>
                        <div className={styles.groupHeader}>
                          <span
                            className={styles.groupBadge}
                            style={{ backgroundColor: color }}
                          >
                            Heyvan #{group.id}
                          </span>
                          <span className={styles.groupMeta}>
                            Toplam hissə: {group.totalShare.toFixed(1)}
                          </span>
                        </div>

                        {group.orders.map((order) => (
                          <div key={order.id} className={styles.groupOrderRow}>
                            <span>
                              {order.user?.name ||
                                order.user?.phone ||
                                "Müştəri"}
                            </span>
                            <span>{getShare(order).toFixed(1)} hissə</span>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Çatdırılma xəritəsi (vector)</h2>
              <div className={styles.mapWrap}>
                <ComposableMap
                  projection="geoMercator"
                  projectionConfig={{ scale: 600, center: [48, 40.5] }}
                >
                  <Geographies geography={GEO_URL}>
                    {({ geographies }) =>
                      geographies.map((geo) => (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          fill="#eef3f8"
                          stroke="#d7dde3"
                          strokeWidth={0.4}
                        />
                      ))
                    }
                  </Geographies>

                  {mappableOrders.map((order) => {
                    const groupId = orderToGroup[order.id] || 1;
                    const color =
                      GROUP_COLORS[(groupId - 1) % GROUP_COLORS.length];
                    return (
                      <Marker
                        key={order.id}
                        coordinates={[
                          order.distribution.coordinates.lng,
                          order.distribution.coordinates.lat,
                        ]}
                      >
                        <circle
                          r={5}
                          fill={color}
                          stroke="#fff"
                          strokeWidth={1.2}
                        />
                      </Marker>
                    );
                  })}
                </ComposableMap>
              </div>
              <p className={styles.mapHint}>
                Eyni rəngli markerlər eyni heyvan qrupuna aid təklif olunur.
              </p>
            </section>
          </div>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Sifariş siyahısı</h2>
            {orders.length === 0 ? (
              <p className={styles.empty}>Sifariş tapılmadı.</p>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Qrup</th>
                      <th>Sifariş №</th>
                      <th>Müştəri</th>
                      <th>Hissə</th>
                      <th>Telefon</th>
                      <th>Ünvan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id}>
                        <td>#{orderToGroup[order.id] || 1}</td>
                        <td>{order.orderNumber}</td>
                        <td>{order.user?.name || "-"}</td>
                        <td>{getShare(order).toFixed(1)}</td>
                        <td>{order.user?.phone || "-"}</td>
                        <td>{order.distribution?.location || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
