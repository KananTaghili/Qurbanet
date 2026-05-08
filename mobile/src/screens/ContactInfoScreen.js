import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors } from "../theme/colors";
import OrderStepHeader from "../components/OrderStepHeader";
import useCategoryActiveGuard from "../hooks/useCategoryActiveGuard";

const normalizeMobile = (value) => {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("994")) return `+${digits.slice(0, 12)}`;
  if (digits.startsWith("0")) return `+994${digits.slice(1, 10)}`;
  if (digits.length <= 9) return `+994${digits}`;
  return `+994${digits.slice(-9)}`;
};

export default function ContactInfoScreen({ navigation, route }) {
  const draft = route.params?.draft || {};
  const initial = route.params?.initialContact || {};
  useCategoryActiveGuard({
    animalType: draft?.animal?.type,
    navigation,
    enabled: !!draft?.animal?.type,
  });

  const [firstName, setFirstName] = useState(initial.firstName || "");
  const [lastName, setLastName] = useState(initial.lastName || "");
  const [mobile, setMobile] = useState(initial.mobile || "");

  const onContinue = async () => {
    const fn = firstName.trim();
    const ln = lastName.trim();
    const mb = normalizeMobile(mobile);

    if (fn.length < 2 || ln.length < 2) {
      Alert.alert("Xəta", "Ad və soyad ən az 2 simvol olmalıdır.");
      return;
    }

    if (!/^\+994(50|51|55|60|70|77|99)\d{7}$/.test(mb)) {
      Alert.alert("Xəta", "Mobil nömrə düzgün formatda deyil.");
      return;
    }

    const contactInfo = { firstName: fn, lastName: ln, mobile: mb };
    await AsyncStorage.setItem("contact_info", JSON.stringify(contactInfo));

    navigation.replace("OrderSummary", {
      draft: {
        ...draft,
        contactInfo,
      },
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <OrderStepHeader currentStep={2} />
      <Text style={styles.title}>Əlaqə Məlumatları</Text>
      <Text style={styles.sub}>Ad, soyad və mobil nömrə tələb olunur.</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Ad</Text>
        <TextInput
          style={styles.input}
          value={firstName}
          onChangeText={setFirstName}
        />

        <Text style={styles.label}>Soyad</Text>
        <TextInput
          style={styles.input}
          value={lastName}
          onChangeText={setLastName}
        />

        <Text style={styles.label}>Mobil nömrə</Text>
        <TextInput
          style={styles.input}
          value={mobile}
          onChangeText={setMobile}
          keyboardType="phone-pad"
          placeholder="+994501234567"
        />
      </View>

      <TouchableOpacity style={styles.button} onPress={onContinue}>
        <Text style={styles.buttonText}>Ödəniş mərhələsinə keç</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 24 },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  sub: { color: Colors.textSecondary, marginBottom: 12 },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.textPrimary,
    backgroundColor: Colors.background,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  buttonText: { color: Colors.white, fontWeight: "700", fontSize: 16 },
});
