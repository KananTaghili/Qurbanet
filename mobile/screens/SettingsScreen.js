import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
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
} from "lucide-react-native";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";
import useNavBarStyle from "../hooks/useNavBarStyle";

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
    <View style={{ marginBottom: 11 }}>
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
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
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
    if (name.trim().length < 2) return setError("Ad ən az 2 simvol olmalıdır.");
    if (!LETTERS_RE.test(name.trim())) return setError("Ad yalnız hərflərdən ibarət olmalıdır.");
    if (lastName.trim() && !LETTERS_RE.test(lastName.trim())) return setError("Soyad yalnız hərflərdən ibarət olmalıdır.");
    setLoading(true);
    try {
      await api.put("/auth/profile", { name: name.trim(), lastName: lastName.trim() });
      onUpdated({ name: name.trim(), lastName: lastName.trim() });
      setSuccess("Məlumatlar yeniləndi!");
      setEditing(false);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Xəta baş verdi.");
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
        title="Hesab məlumatları"
        sub="Ad, soyad, əlaqə"
        action={
          !editing && (
            <Pressable style={styles.editBtn} onPress={() => setEditing(true)}>
              <Pencil size={11} color={RED} />
              <Text style={styles.editBtnText}>Redaktə</Text>
            </Pressable>
          )
        }
      />

      {editing ? (
        <View style={{ padding: 16 }}>
          <Field label="AD *">
            <TextInput
              style={styles.plainInput}
              value={name}
              onChangeText={(v) => { if (v === "" || LETTERS_RE.test(v)) { setName(v); setError(""); } }}
              placeholder="Adınızı daxil edin"
              placeholderTextColor="#9ca3af"
              autoFocus
            />
          </Field>
          <Field label="SOYAD">
            <TextInput
              style={styles.plainInput}
              value={lastName}
              onChangeText={(v) => { if (v === "" || LETTERS_RE.test(v)) { setLastName(v); setError(""); } }}
              placeholder="Soyadınızı daxil edin"
              placeholderTextColor="#9ca3af"
            />
          </Field>
          {error ? <Alert msg={error} /> : null}
          <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
            <Pressable style={styles.cancelBtn} onPress={cancel}>
              <X size={12} color="#6b7280" />
              <Text style={styles.cancelBtnText}>Ləğv et</Text>
            </Pressable>
            <Pressable
              style={[styles.saveBtn, (loading || !hasChanges) && { backgroundColor: "#9ca3af" }]}
              onPress={save}
              disabled={loading || !hasChanges}
            >
              {loading ? <ActivityIndicator color="#fff" size="small" /> : (
                <>
                  <CheckCircle size={12} color="#fff" />
                  <Text style={styles.saveBtnText}>Yadda saxla</Text>
                </>
              )}
            </Pressable>
          </View>
          {(user.phone || user.email) && (
            <View style={{ marginTop: 12, marginHorizontal: -16, borderTopWidth: 1, borderTopColor: "#f3f4f6" }}>
              {user.phone ? <InfoRow Icon={Phone} label="Telefon" value={user.phone} /> : null}
              {user.email ? <InfoRow Icon={Mail} label="Email" value={user.email} /> : null}
            </View>
          )}
        </View>
      ) : (
        <>
          <InfoRow Icon={User} label="Ad" value={user.name} />
          <InfoRow Icon={User} label="Soyad" value={user.lastName} />
          {user.phone ? <InfoRow Icon={Phone} label="Telefon" value={user.phone} /> : null}
          {user.email ? <InfoRow Icon={Mail} label="Email" value={user.email} /> : null}
          {success ? <View style={{ padding: 16 }}><Alert ok msg={success} /></View> : null}
        </>
      )}
    </View>
  );
}

function PasswordCard() {
  const [vals, setVals] = useState({ current: "", next: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const set = (key) => (v) => { setVals((s) => ({ ...s, [key]: v })); setError(""); };

  const submit = async () => {
    setError(""); setSuccess("");
    if (!vals.current) return setError("Cari şifrənizi daxil edin.");
    if (vals.next.length < 6) return setError("Yeni şifrə ən az 6 simvol olmalıdır.");
    if (vals.next !== vals.confirm) return setError("Şifrələr uyğun gəlmir.");
    if (vals.current === vals.next) return setError("Yeni şifrə cari ilə eyni ola bilməz.");
    setLoading(true);
    try {
      await api.put("/auth/profile", { currentPassword: vals.current, password: vals.next });
      setSuccess("Şifrə uğurla yeniləndi!");
      setVals({ current: "", next: "", confirm: "" });
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Şifrə dəyişdirilə bilmədi.");
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { key: "current", label: "CARİ ŞİFRƏ *", ph: "Cari şifrənizi daxil edin" },
    { key: "next", label: "YENİ ŞİFRƏ *", ph: "Ən az 6 simvol" },
    { key: "confirm", label: "TƏSDİQLƏ *", ph: "Yeni şifrəni təkrarlayın" },
  ];

  return (
    <View style={styles.card}>
      <CardHead Icon={Shield} title="Şifrəni dəyiş" sub="Güclü şifrə istifadə edin" />
      <View style={{ padding: 16 }}>
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
              <Text style={styles.submitBtnText}>Şifrəni yenilə</Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user, logout, updateUser } = useAuth();
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
        <Text style={styles.headerTitle}>Parametrlər</Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}>
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
          {[["account", "Hesab", User], ["password", "Şifrə", Shield]].map(([key, label, Icon]) => (
            <Pressable key={key} style={[styles.tabBtn, tab === key && { backgroundColor: RED }]} onPress={() => setTab(key)}>
              <Icon size={13} color={tab === key ? "#fff" : "#6b7280"} />
              <Text style={[styles.tabLabel, tab === key && { color: "#fff" }]}>{label}</Text>
            </Pressable>
          ))}
        </View>

        {tab === "account" ? (
          <>
            <AccountCard user={user} onUpdated={updateUser} />
            <Pressable style={styles.logoutBtn} onPress={handleLogout}>
              <View style={styles.logoutIcon}>
                <LogOut size={15} color={RED} />
              </View>
              <View>
                <Text style={styles.logoutTitle}>Çıxış et</Text>
                <Text style={styles.logoutSub}>Hesabdan çıx</Text>
              </View>
            </Pressable>
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
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  backBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: "#f5f5f7", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 15, fontWeight: "800", color: "#111827" },

  profileHero: { borderRadius: 16, padding: 16, flexDirection: "row", alignItems: "center", gap: 14 },
  profileAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(255,255,255,0.18)", borderWidth: 2, borderColor: "rgba(255,255,255,0.35)", alignItems: "center", justifyContent: "center" },
  profileAvatarText: { color: "#fff", fontWeight: "900", fontSize: 15 },
  profileName: { fontSize: 16, fontWeight: "800", color: "#fff" },
  profileContact: { fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 2 },

  tabRow: { flexDirection: "row", gap: 4, backgroundColor: "#fff", borderRadius: 12, padding: 4, borderWidth: 1, borderColor: "#ebebeb", marginTop: 14 },
  tabBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 9, borderRadius: 8 },
  tabLabel: { fontSize: 13, fontWeight: "700", color: "#6b7280" },

  card: { backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: "#ebebeb", overflow: "hidden", marginTop: 12 },
  cardHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "#fafafa", borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  cardHeadIcon: { width: 32, height: 32, borderRadius: 9, backgroundColor: RED_BG, alignItems: "center", justifyContent: "center" },
  cardHeadTitle: { fontSize: 13, fontWeight: "800", color: "#111827" },
  cardHeadSub: { fontSize: 11, color: "#9ca3af", marginTop: 1 },
  editBtn: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: RED_BG, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  editBtnText: { fontSize: 12, fontWeight: "700", color: RED },

  infoRow: { flexDirection: "row", alignItems: "center", gap: 11, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#f5f5f7" },
  infoIcon: { width: 30, height: 30, borderRadius: 8, backgroundColor: RED_BG, alignItems: "center", justifyContent: "center" },
  infoLabel: { fontSize: 10, color: "#9ca3af", fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  infoValue: { fontSize: 13, fontWeight: "700", color: "#111827", marginTop: 1 },

  fieldLabel: { fontSize: 11, fontWeight: "700", color: "#9ca3af", letterSpacing: 0.5, marginBottom: 5 },
  plainInput: { height: 42, borderWidth: 1.5, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 13, fontSize: 13, backgroundColor: "#f9fafb", color: "#111827" },
  inputWrap: { flexDirection: "row", alignItems: "center", height: 42, borderWidth: 1.5, borderColor: "#e5e7eb", borderRadius: 10, backgroundColor: "#f9fafb" },
  input: { flex: 1, height: "100%", paddingHorizontal: 13, fontSize: 13, color: "#111827" },
  eyeBtn: { paddingHorizontal: 12 },

  alert: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 13, paddingVertical: 9, borderRadius: 10, borderWidth: 1, marginTop: 4, marginBottom: 4 },
  alertText: { fontSize: 12, fontWeight: "600", flex: 1 },

  cancelBtn: { flex: 1, height: 40, borderRadius: 10, borderWidth: 1, borderColor: "#e5e7eb", backgroundColor: "#fff", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5 },
  cancelBtnText: { fontSize: 12, fontWeight: "700", color: "#6b7280" },
  saveBtn: { flex: 1, height: 40, borderRadius: 10, backgroundColor: RED, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5 },
  saveBtnText: { fontSize: 12, fontWeight: "800", color: "#fff" },

  submitBtn: { marginTop: 4, height: 44, borderRadius: 10, backgroundColor: RED, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  submitBtnText: { fontSize: 13, fontWeight: "800", color: "#fff" },

  logoutBtn: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: "#fee2e2", paddingHorizontal: 20, paddingVertical: 13, marginTop: 12 },
  logoutIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: RED_BG, alignItems: "center", justifyContent: "center" },
  logoutTitle: { fontSize: 13, fontWeight: "700", color: RED },
  logoutSub: { fontSize: 11, color: "#9ca3af", marginTop: 1 },
});
