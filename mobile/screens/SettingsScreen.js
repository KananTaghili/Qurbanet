import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Modal,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import {
  ArrowLeft,
  User,
  Shield,
  Phone,
  Mail,
  Pencil,
  X,
  CheckCircle,
  AlertCircle,
  LogOut,
  Eye,
  EyeOff,
  Lock,
  Trash2,
  AlertTriangle,
} from "lucide-react-native";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";
import useNavBarStyle from "../hooks/useNavBarStyle";
import { scale, scaleFont } from "../lib/scale";
import { useLanguage } from "../context/LanguageContext";
import { t } from "../i18n/i18n";

const RED = "#f20b32";
const RED_BG = "#fff1f3";
const LETTERS_RE = /^[a-zA-ZüöğışçəÜÖĞIŞÇƏ\s'-]+$/;

function Alert({ ok, msg }) {
  const Icon = ok ? CheckCircle : AlertCircle;
  return (
    <View style={[styles.alert, { backgroundColor: ok ? "#f0fdf4" : "#fff1f3", borderColor: ok ? "#bbf7d0" : "#ffd0d8" }]}>
      <Icon size={13} color={ok ? "#15803d" : "#b91c1c"} />
      <Text style={[styles.alertText, { color: ok ? "#15803d" : "#b91c1c" }]}>{msg}</Text>
    </View>
  );
}

function Field({ label, children }) {
  return (
    <View style={{ marginBottom: scale(11) }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function PasswordInput({ value, onChangeText, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <View style={styles.inputWrap}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        secureTextEntry={!show}
      />
      <Pressable style={styles.eyeBtn} onPress={() => setShow((v) => !v)}>
        {show ? <EyeOff size={15} color="#9ca3af" /> : <Eye size={15} color="#9ca3af" />}
      </Pressable>
    </View>
  );
}

function InfoRow({ Icon, label, value }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Icon size={13} color={RED} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue} numberOfLines={1}>{value || "—"}</Text>
      </View>
    </View>
  );
}

function CardHead({ Icon, title, sub, action }) {
  return (
    <View style={styles.cardHead}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: scale(10) }}>
        <View style={styles.cardHeadIcon}>
          <Icon size={14} color={RED} />
        </View>
        <View>
          <Text style={styles.cardHeadTitle}>{title}</Text>
          {sub ? <Text style={styles.cardHeadSub}>{sub}</Text> : null}
        </View>
      </View>
      {action}
    </View>
  );
}

function AccountCard({ user, onUpdated }) {
  const { lang } = useLanguage();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.name || "");
  const [lastName, setLastName] = useState(user.lastName || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const hasChanges = name.trim() !== (user.name || "").trim() || lastName.trim() !== (user.lastName || "").trim();

  const save = async () => {
    setError("");
    if (!hasChanges) return;
    if (name.trim().length < 2) return setError(t(lang, "settings_errorNameShort"));
    if (!LETTERS_RE.test(name.trim())) return setError(t(lang, "settings_errorNameLetters"));
    if (lastName.trim() && !LETTERS_RE.test(lastName.trim())) return setError(t(lang, "settings_errorLastNameLetters"));
    setLoading(true);
    try {
      await api.put("/auth/profile", { name: name.trim(), lastName: lastName.trim() });
      onUpdated({ name: name.trim(), lastName: lastName.trim() });
      setSuccess(t(lang, "settings_profileUpdated"));
      setEditing(false);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || t(lang, "donateModal_genericError"));
    } finally {
      setLoading(false);
    }
  };

  const cancel = () => {
    setName(user.name || "");
    setLastName(user.lastName || "");
    setError("");
    setEditing(false);
  };

  return (
    <View style={styles.card}>
      <CardHead
        Icon={User}
        title={t(lang, "settings_accountInfoTitle")}
        sub={t(lang, "settings_accountInfoSub")}
        action={
          !editing && (
            <Pressable style={styles.editBtn} onPress={() => setEditing(true)}>
              <Pencil size={11} color={RED} />
              <Text style={styles.editBtnText}>{t(lang, "settings_editBtn")}</Text>
            </Pressable>
          )
        }
      />

      {editing ? (
        <View style={{ padding: scale(16) }}>
          <Field label={t(lang, "settings_firstNameLabel")}>
            <TextInput
              style={styles.plainInput}
              value={name}
              onChangeText={(v) => { if (v === "" || LETTERS_RE.test(v)) { setName(v); setError(""); } }}
              placeholder={t(lang, "settings_firstNamePlaceholder")}
              placeholderTextColor="#9ca3af"
              autoFocus
            />
          </Field>
          <Field label={t(lang, "settings_lastNameLabel")}>
            <TextInput
              style={styles.plainInput}
              value={lastName}
              onChangeText={(v) => { if (v === "" || LETTERS_RE.test(v)) { setLastName(v); setError(""); } }}
              placeholder={t(lang, "settings_lastNamePlaceholder")}
              placeholderTextColor="#9ca3af"
            />
          </Field>
          {error ? <Alert msg={error} /> : null}
          <View style={{ flexDirection: "row", gap: scale(8), marginTop: scale(4) }}>
            <Pressable style={styles.cancelBtn} onPress={cancel}>
              <X size={12} color="#6b7280" />
              <Text style={styles.cancelBtnText}>{t(lang, "settings_cancelBtn")}</Text>
            </Pressable>
            <Pressable
              style={[styles.saveBtn, (loading || !hasChanges) && { backgroundColor: "#9ca3af" }]}
              onPress={save}
              disabled={loading || !hasChanges}
            >
              {loading ? <ActivityIndicator color="#fff" size="small" /> : (
                <>
                  <CheckCircle size={12} color="#fff" />
                  <Text style={styles.saveBtnText}>{t(lang, "settings_saveBtn")}</Text>
                </>
              )}
            </Pressable>
          </View>
          {(user.phone || user.email) && (
            <View style={{ marginTop: scale(12), marginHorizontal: scale(-16), borderTopWidth: 1, borderTopColor: "#f3f4f6" }}>
              {user.phone ? <InfoRow Icon={Phone} label={t(lang, "authForm_phoneTab")} value={user.phone} /> : null}
              {user.email ? <InfoRow Icon={Mail} label={t(lang, "authForm_emailLabel")} value={user.email} /> : null}
            </View>
          )}
        </View>
      ) : (
        <>
          <InfoRow Icon={User} label={t(lang, "settings_firstNameShortLabel")} value={user.name} />
          <InfoRow Icon={User} label={t(lang, "settings_lastNameFieldLabel")} value={user.lastName} />
          {user.phone ? <InfoRow Icon={Phone} label={t(lang, "authForm_phoneTab")} value={user.phone} /> : null}
          {user.email ? <InfoRow Icon={Mail} label={t(lang, "authForm_emailLabel")} value={user.email} /> : null}
          {success ? <View style={{ padding: scale(16) }}><Alert ok msg={success} /></View> : null}
        </>
      )}
    </View>
  );
}

function PasswordCard() {
  const { lang } = useLanguage();
  const [vals, setVals] = useState({ current: "", next: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const set = (key) => (v) => { setVals((s) => ({ ...s, [key]: v })); setError(""); };

  const submit = async () => {
    setError(""); setSuccess("");
    if (!vals.current) return setError(t(lang, "settings_errorCurrentPasswordRequired"));
    if (vals.next.length < 6) return setError(t(lang, "settings_errorNewPasswordShort"));
    if (vals.next !== vals.confirm) return setError(t(lang, "forgotPw_errorPasswordsMismatch"));
    if (vals.current === vals.next) return setError(t(lang, "settings_errorSamePassword"));
    setLoading(true);
    try {
      await api.put("/auth/profile", { currentPassword: vals.current, password: vals.next });
      setSuccess(t(lang, "settings_passwordUpdated"));
      setVals({ current: "", next: "", confirm: "" });
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || t(lang, "settings_errorPasswordChangeFailed"));
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { key: "current", label: t(lang, "settings_currentPasswordLabel"), ph: t(lang, "settings_currentPasswordPlaceholder") },
    { key: "next", label: t(lang, "settings_newPasswordLabel"), ph: t(lang, "authForm_passwordMinPlaceholder") },
    { key: "confirm", label: t(lang, "settings_confirmPasswordLabel"), ph: t(lang, "settings_confirmPasswordPlaceholder") },
  ];

  return (
    <View style={styles.card}>
      <CardHead Icon={Shield} title={t(lang, "settings_passwordCardTitle")} sub={t(lang, "settings_passwordCardSub")} />
      <View style={{ padding: scale(16) }}>
        {fields.map(({ key, label, ph }) => (
          <Field key={key} label={label}>
            <PasswordInput value={vals[key]} onChangeText={set(key)} placeholder={ph} />
          </Field>
        ))}
        {error ? <Alert msg={error} /> : null}
        {success ? <Alert ok msg={success} /> : null}
        <Pressable
          style={[styles.submitBtn, loading && { backgroundColor: "#9ca3af" }]}
          onPress={submit}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" size="small" /> : (
            <>
              <Lock size={14} color="#fff" />
              <Text style={styles.submitBtnText}>{t(lang, "settings_updatePasswordBtn")}</Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

function DeleteAccountModal({ visible, onClose, onDeleted }) {
  const { lang } = useLanguage();
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const canSubmit = confirmText.trim().toUpperCase() === t(lang, "settings_deleteConfirmWord") && !loading;

  const submit = async () => {
    if (!canSubmit) return;
    setError("");
    setLoading(true);
    try {
      await api.delete("/auth/account", { data: password ? { password } : {} });
      onDeleted();
    } catch (err) {
      setError(err.response?.data?.message || t(lang, "settings_errorDeleteFailed"));
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setPassword("");
    setConfirmText("");
    setError("");
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose} />
      <View style={styles.modalCenterWrap} pointerEvents="box-none">
        <View style={styles.modalCard}>
          <View style={styles.modalHead}>
            <View style={styles.modalHeadIcon}>
              <AlertTriangle size={16} color={RED} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitle}>{t(lang, "settings_deleteAccountTitle")}</Text>
              <Text style={styles.modalSub}>
                {t(lang, "settings_deleteAccountWarning")}
              </Text>
            </View>
            <Pressable onPress={() => { reset(); onClose(); }} hitSlop={8}>
              <X size={16} color="#9ca3af" />
            </Pressable>
          </View>

          <View style={{ padding: scale(16) }}>
            <Field label={t(lang, "settings_deletePasswordLabel")}>
              <PasswordInput value={password} onChangeText={setPassword} placeholder={t(lang, "settings_deletePasswordPlaceholder")} />
            </Field>
            <Field label={t(lang, "settings_deleteConfirmLabel")}>
              <TextInput
                style={styles.plainInput}
                value={confirmText}
                onChangeText={setConfirmText}
                placeholder={t(lang, "settings_deleteConfirmWord")}
                placeholderTextColor="#9ca3af"
                autoCapitalize="characters"
              />
            </Field>
            {error ? <Alert msg={error} /> : null}
            <Pressable
              style={[styles.deleteSubmitBtn, !canSubmit && { backgroundColor: "#e5e7eb" }]}
              onPress={submit}
              disabled={!canSubmit}
            >
              {loading ? <ActivityIndicator color="#fff" size="small" /> : (
                <>
                  <Trash2 size={14} color={canSubmit ? "#fff" : "#9ca3af"} />
                  <Text style={[styles.deleteSubmitBtnText, !canSubmit && { color: "#9ca3af" }]}>{t(lang, "settings_deleteSubmitBtn")}</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function DangerZone({ onLogout }) {
  const { lang } = useLanguage();
  const { logout } = useAuth();
  const navigation = useNavigation();
  const [showDelete, setShowDelete] = useState(false);

  const handleDeleted = async () => {
    setShowDelete(false);
    await logout();
    navigation.reset({ index: 0, routes: [{ name: "Home" }] });
  };

  return (
    <>
      <Pressable style={styles.logoutBtn} onPress={onLogout}>
        <View style={styles.logoutIcon}>
          <LogOut size={15} color={RED} />
        </View>
        <View>
          <Text style={styles.logoutTitle}>{t(lang, "settings_logoutTitle")}</Text>
          <Text style={styles.logoutSub}>{t(lang, "settings_logoutSub")}</Text>
        </View>
      </Pressable>

      <Pressable style={styles.deleteAccountBtn} onPress={() => setShowDelete(true)}>
        <View style={styles.deleteAccountIcon}>
          <Trash2 size={15} color="#6b7280" />
        </View>
        <View>
          <Text style={styles.deleteAccountTitle}>{t(lang, "settings_deleteAccountBtnTitle")}</Text>
          <Text style={styles.deleteAccountSub}>{t(lang, "settings_deleteAccountBtnSub")}</Text>
        </View>
      </Pressable>

      <DeleteAccountModal visible={showDelete} onClose={() => setShowDelete(false)} onDeleted={handleDeleted} />
    </>
  );
}

export default function SettingsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user, logout, updateUser } = useAuth();
  const { lang } = useLanguage();
  const [tab, setTab] = useState("account");
  useNavBarStyle("dark", "#f6f7f9");

  if (!user) return null;

  const initials = [user?.name?.[0], user?.lastName?.[0]].filter(Boolean).join("").toUpperCase() || "?";
  const fullName = [user.name, user.lastName].filter(Boolean).join(" ");

  const handleLogout = async () => {
    await logout();
    navigation.reset({ index: 0, routes: [{ name: "Home" }] });
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={17} color="#374151" strokeWidth={2.5} />
        </Pressable>
        <Text style={styles.headerTitle}>{t(lang, "settings")}</Text>
        <View style={{ width: scale(34) }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: scale(16), paddingBottom: insets.bottom + 24 }}>
        <LinearGradient colors={[RED, "#a8001a"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.profileHero}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>{initials}</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.profileName} numberOfLines={1}>{fullName}</Text>
            <Text style={styles.profileContact} numberOfLines={1}>{user.phone || user.email}</Text>
          </View>
        </LinearGradient>

        <View style={styles.tabRow}>
          {[["account", t(lang, "settings_accountTab"), User], ["password", t(lang, "authForm_passwordLabel"), Shield]].map(([key, label, Icon]) => (
            <Pressable key={key} style={[styles.tabBtn, tab === key && { backgroundColor: RED }]} onPress={() => setTab(key)}>
              <Icon size={13} color={tab === key ? "#fff" : "#6b7280"} />
              <Text style={[styles.tabLabel, tab === key && { color: "#fff" }]}>{label}</Text>
            </Pressable>
          ))}
        </View>

        {tab === "account" ? (
          <>
            <AccountCard user={user} onUpdated={updateUser} />
            <DangerZone onLogout={handleLogout} />
          </>
        ) : (
          <PasswordCard />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f6f7f9" },
  header: {
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(16),
    paddingBottom: scale(12),
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  backBtn: { width: scale(34), height: scale(34), borderRadius: scale(10), backgroundColor: "#f5f5f7", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: scaleFont(15), fontWeight: "800", color: "#111827" },

  profileHero: { borderRadius: scale(16), padding: scale(16), flexDirection: "row", alignItems: "center", gap: scale(14) },
  profileAvatar: { width: scale(48), height: scale(48), borderRadius: scale(24), backgroundColor: "rgba(255,255,255,0.18)", borderWidth: 2, borderColor: "rgba(255,255,255,0.35)", alignItems: "center", justifyContent: "center" },
  profileAvatarText: { color: "#fff", fontWeight: "900", fontSize: scaleFont(15) },
  profileName: { fontSize: scaleFont(16), fontWeight: "800", color: "#fff" },
  profileContact: { fontSize: scaleFont(12), color: "rgba(255,255,255,0.7)", marginTop: scale(2) },

  tabRow: { flexDirection: "row", gap: scale(4), backgroundColor: "#fff", borderRadius: scale(12), padding: scale(4), borderWidth: 1, borderColor: "#ebebeb", marginTop: scale(14) },
  tabBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: scale(6), paddingVertical: scale(9), borderRadius: scale(8) },
  tabLabel: { fontSize: scaleFont(13), fontWeight: "700", color: "#6b7280" },

  card: { backgroundColor: "#fff", borderRadius: scale(16), borderWidth: 1, borderColor: "#ebebeb", overflow: "hidden", marginTop: scale(12) },
  cardHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: scale(16), paddingVertical: scale(12), backgroundColor: "#fafafa", borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  cardHeadIcon: { width: scale(32), height: scale(32), borderRadius: scale(9), backgroundColor: RED_BG, alignItems: "center", justifyContent: "center" },
  cardHeadTitle: { fontSize: scaleFont(13), fontWeight: "800", color: "#111827" },
  cardHeadSub: { fontSize: scaleFont(11), color: "#9ca3af", marginTop: scale(1) },
  editBtn: { flexDirection: "row", alignItems: "center", gap: scale(5), backgroundColor: RED_BG, borderRadius: scale(8), paddingHorizontal: scale(10), paddingVertical: scale(6) },
  editBtnText: { fontSize: scaleFont(12), fontWeight: "700", color: RED },

  infoRow: { flexDirection: "row", alignItems: "center", gap: scale(11), paddingHorizontal: scale(16), paddingVertical: scale(12), borderBottomWidth: 1, borderBottomColor: "#f5f5f7" },
  infoIcon: { width: scale(30), height: scale(30), borderRadius: scale(8), backgroundColor: RED_BG, alignItems: "center", justifyContent: "center" },
  infoLabel: { fontSize: scaleFont(10), color: "#9ca3af", fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  infoValue: { fontSize: scaleFont(13), fontWeight: "700", color: "#111827", marginTop: scale(1) },

  fieldLabel: { fontSize: scaleFont(11), fontWeight: "700", color: "#9ca3af", letterSpacing: 0.5, marginBottom: scale(5) },
  plainInput: { height: scale(42), borderWidth: 1.5, borderColor: "#e5e7eb", borderRadius: scale(10), paddingHorizontal: scale(13), fontSize: scaleFont(13), backgroundColor: "#f9fafb", color: "#111827" },
  inputWrap: { flexDirection: "row", alignItems: "center", height: scale(42), borderWidth: 1.5, borderColor: "#e5e7eb", borderRadius: scale(10), backgroundColor: "#f9fafb" },
  input: { flex: 1, height: "100%", paddingHorizontal: scale(13), fontSize: scaleFont(13), color: "#111827" },
  eyeBtn: { paddingHorizontal: scale(12) },

  alert: { flexDirection: "row", alignItems: "center", gap: scale(8), paddingHorizontal: scale(13), paddingVertical: scale(9), borderRadius: scale(10), borderWidth: 1, marginTop: scale(4), marginBottom: scale(4) },
  alertText: { fontSize: scaleFont(12), fontWeight: "600", flex: 1 },

  cancelBtn: { flex: 1, height: scale(40), borderRadius: scale(10), borderWidth: 1, borderColor: "#e5e7eb", backgroundColor: "#fff", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: scale(5) },
  cancelBtnText: { fontSize: scaleFont(12), fontWeight: "700", color: "#6b7280" },
  saveBtn: { flex: 1, height: scale(40), borderRadius: scale(10), backgroundColor: RED, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: scale(5) },
  saveBtnText: { fontSize: scaleFont(12), fontWeight: "800", color: "#fff" },

  submitBtn: { marginTop: scale(4), height: scale(44), borderRadius: scale(10), backgroundColor: RED, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: scale(8) },
  submitBtnText: { fontSize: scaleFont(13), fontWeight: "800", color: "#fff" },

  logoutBtn: { flexDirection: "row", alignItems: "center", gap: scale(12), backgroundColor: "#fff", borderRadius: scale(16), borderWidth: 1, borderColor: "#fee2e2", paddingHorizontal: scale(20), paddingVertical: scale(13), marginTop: scale(12) },
  logoutIcon: { width: scale(36), height: scale(36), borderRadius: scale(10), backgroundColor: RED_BG, alignItems: "center", justifyContent: "center" },
  logoutTitle: { fontSize: scaleFont(13), fontWeight: "700", color: RED },
  logoutSub: { fontSize: scaleFont(11), color: "#9ca3af", marginTop: scale(1) },

  deleteAccountBtn: { flexDirection: "row", alignItems: "center", gap: scale(12), backgroundColor: "#fff", borderRadius: scale(16), borderWidth: 1, borderColor: "#f0f0f0", paddingHorizontal: scale(20), paddingVertical: scale(13), marginTop: scale(8) },
  deleteAccountIcon: { width: scale(36), height: scale(36), borderRadius: scale(10), backgroundColor: "#f5f5f7", alignItems: "center", justifyContent: "center" },
  deleteAccountTitle: { fontSize: scaleFont(13), fontWeight: "700", color: "#374151" },
  deleteAccountSub: { fontSize: scaleFont(11), color: "#9ca3af", marginTop: scale(1) },

  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(17,24,39,0.5)" },
  modalCenterWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: scale(16) },
  modalCard: { width: "100%", maxWidth: 400, backgroundColor: "#fff", borderRadius: scale(18), overflow: "hidden" },
  modalHead: { flexDirection: "row", alignItems: "flex-start", gap: scale(12), padding: scale(18), borderBottomWidth: 1, borderBottomColor: "#f5f5f7" },
  modalHeadIcon: { width: scale(36), height: scale(36), borderRadius: scale(10), backgroundColor: RED_BG, alignItems: "center", justifyContent: "center" },
  modalTitle: { fontSize: scaleFont(14), fontWeight: "800", color: "#111827" },
  modalSub: { fontSize: scaleFont(12), color: "#6b7280", marginTop: scale(3), lineHeight: scaleFont(17) },
  deleteSubmitBtn: { marginTop: scale(4), height: scale(44), borderRadius: scale(10), backgroundColor: RED, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: scale(7) },
  deleteSubmitBtnText: { fontSize: scaleFont(13), fontWeight: "800", color: "#fff" },
});
