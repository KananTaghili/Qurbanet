import { StyleSheet } from "react-native";

export default StyleSheet.create({
  tabRow: {
    flexDirection: "row",
    marginBottom: 22,
    borderBottomWidth: 2,
    borderBottomColor: "#ececec",
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
    marginBottom: -2,
  },
  tabBtnActive: { borderBottomColor: "#111827" },
  tabLabel: { fontSize: 14, fontWeight: "700", color: "#9ca3af" },
  tabLabelActive: { color: "#111827" },

  field: { marginBottom: 16 },
  label: { marginBottom: 7, fontSize: 13, fontWeight: "700", color: "#1f2937" },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    borderRadius: 14,
    backgroundColor: "#f4f4f6",
    overflow: "hidden",
  },
  phonePrefix: { fontSize: 14, fontWeight: "800", color: "#e10d0d", paddingHorizontal: 14 },
  input: { flex: 1, height: "100%", paddingHorizontal: 8, fontSize: 15, color: "#374151" },
  plainInput: {
    height: 52,
    borderRadius: 14,
    backgroundColor: "#f4f4f6",
    paddingHorizontal: 18,
    fontSize: 15,
    color: "#374151",
  },
  eyeBtn: { paddingHorizontal: 14, height: "100%", justifyContent: "center" },

  forgotRow: { alignItems: "flex-end", marginBottom: 4 },
  forgotText: { fontSize: 13, fontWeight: "700", color: "#e10d0d" },

  errorBox: {
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  errorText: { color: "#B91C1C", fontSize: 13, fontWeight: "600" },

  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 54,
    borderRadius: 999,
    backgroundColor: "#f20b32",
  },
  primaryBtnDisabled: { backgroundColor: "#9ca3af" },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },

  outlineBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 54,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "#e10d0d",
    backgroundColor: "#fff",
    marginTop: 12,
  },
  outlineBtnText: { color: "#e10d0d", fontSize: 16, fontWeight: "800" },

  helperRow: { alignItems: "center", marginTop: 14 },
  helperText: { fontSize: 13, color: "#9ca3af" },

  linkBtn: { alignItems: "center", marginTop: 16 },
  linkBtnText: { fontSize: 13, fontWeight: "700", color: "#6b7280" },
});
