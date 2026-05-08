import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { Colors } from "../theme/colors";
import { useAuth } from "../context/AuthContext";
import api from "../config/api";

export default function NameScreen({ route }) {
  const { token, user } = route.params;
  const { login } = useAuth();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      Alert.alert("Xəta", "Ad ən az 2 simvol olmalıdır.");
      return;
    }

    setLoading(true);
    try {
      // Set token temporarily to make the profile update call
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      const res = await api.put("/auth/profile", { name: trimmed });
      const updatedUser = res.data.data?.user || { ...user, name: trimmed };
      await login(token, updatedUser);
    } catch (err) {
      // Even if profile update fails, allow login with the name client-side
      await login(token, { ...user, name: trimmed });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.logo}>👤</Text>
          <Text style={styles.appName}>Qurban.az</Text>
          <Text style={styles.tagline}>Zəhmət olmasa adınızı daxil edin</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Adınız</Text>
          <Text style={styles.subtitle}>
            Sifarişlər üçün adınız istifadə ediləcək.
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Məsələn: Əli Hüseynov"
            placeholderTextColor={Colors.textDisabled}
            value={name}
            onChangeText={setName}
            autoFocus
            autoCapitalize="words"
            maxLength={60}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>
              {loading ? "Yadda saxlanır..." : "Davam et"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  scroll: { flexGrow: 1, justifyContent: "center", padding: 24 },
  header: { alignItems: "center", marginBottom: 32 },
  logo: { fontSize: 64 },
  appName: {
    fontSize: 32,
    fontWeight: "800",
    color: Colors.white,
    marginTop: 8,
  },
  tagline: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
    textAlign: "center",
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 24,
    lineHeight: 20,
  },
  input: {
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    color: Colors.textPrimary,
    backgroundColor: Colors.background,
    marginBottom: 20,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: Colors.white, fontSize: 17, fontWeight: "700" },
});
