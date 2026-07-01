/**
 * Təhlükəsiz pagination parametrləri.
 * page  ≥ 1
 * limit 1–MAX (default 20) — böyük `limit` ilə DoS/ağır sorğuların qarşısını alır.
 */
const parsePagination = (query = {}, { defaultLimit = 20, maxLimit = 50 } = {}) => {
  const page  = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit, 10) || defaultLimit));
  return { page, limit };
};

module.exports = { parsePagination };
