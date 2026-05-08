import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors } from "../theme/colors";

export default function NeedSupportScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ehdiyaclıları Sevindir</Text>
      <Text style={styles.text}>Bu bölmə hələlik boşdur.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginBottom: 10,
    textAlign: "center",
  },
  text: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: "center",
  },
});
