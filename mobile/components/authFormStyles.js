import { StyleSheet } from "react-native";
import { scale, scaleFont } from "../lib/scale";

export default StyleSheet.create({
  tabRow: {
    flexDirection: "row",
    marginBottom: scale(22),
    borderBottomWidth: 2,
    borderBottomColor: "#ececec",
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scale(7),
    paddingVertical: scale(10),
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
    marginBottom: scale(-2),
  },
  tabBtnActive: { borderBottomColor: "#111827" },
  tabLabel: { fontSize: scaleFont(14), fontWeight: "700", color: "#9ca3af" },
  tabLabelActive: { color: "#111827" },

  field: { marginBottom: scale(16) },
  label: { marginBottom: scale(7), fontSize: scaleFont(13), fontWeight: "700", color: "#1f2937" },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    height: scale(52),
    borderRadius: scale(14),
    backgroundColor: "#f4f4f6",
    overflow: "hidden",
  },
  phonePrefix: { fontSize: scaleFont(14), fontWeight: "800", color: "#e10d0d", paddingHorizontal: scale(14) },
  input: { flex: 1, height: "100%", paddingHorizontal: scale(8), fontSize: scaleFont(15), color: "#374151" },
  plainInput: {
    height: scale(52),
    borderRadius: scale(14),
    backgroundColor: "#f4f4f6",
    paddingHorizontal: scale(18),
    fontSize: scaleFont(15),
    color: "#374151",
  },
  eyeBtn: { paddingHorizontal: scale(14), height: "100%", justifyContent: "center" },

  forgotRow: { alignItems: "flex-end", marginBottom: scale(4) },
  forgotText: { fontSize: scaleFont(13), fontWeight: "700", color: "#e10d0d" },

  errorBox: {
    backgroundColor: "#FEF2F2",
    borderRadius: scale(12),
    paddingVertical: scale(11),
    paddingHorizontal: scale(14),
    marginBottom: scale(12),
  },
  errorText: { color: "#B91C1C", fontSize: scaleFont(13), fontWeight: "600" },

  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scale(10),
    height: scale(54),
    borderRadius: scale(999),
    backgroundColor: "#f20b32",
  },
  primaryBtnDisabled: { backgroundColor: "#9ca3af" },
  primaryBtnText: { color: "#fff", fontSize: scaleFont(16), fontWeight: "800" },

  outlineBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scale(10),
    height: scale(54),
    borderRadius: scale(999),
    borderWidth: 2,
    borderColor: "#e10d0d",
    backgroundColor: "#fff",
    marginTop: scale(12),
  },
  outlineBtnText: { color: "#e10d0d", fontSize: scaleFont(16), fontWeight: "800" },

  helperRow: { alignItems: "center", marginTop: scale(14) },
  helperText: { fontSize: scaleFont(13), color: "#9ca3af" },

  linkBtn: { alignItems: "center", marginTop: scale(16) },
  linkBtnText: { fontSize: scaleFont(13), fontWeight: "700", color: "#6b7280" },
});
