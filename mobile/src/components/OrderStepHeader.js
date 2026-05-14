import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors } from "../theme/colors";

const STEPS = ["Qurban Seç", "Çatdırılma Seç", "Ödəniş Seç"];

export default function OrderStepHeader({ currentStep = 1 }) {
  return (
    <View style={styles.wrapper}>
      {STEPS.map((step, index) => {
        const stepNumber = index + 1;
        const active = stepNumber === currentStep;
        const done = stepNumber < currentStep;
        return (
          <React.Fragment key={step}>
            <View style={styles.stepCol}>
              <View
                style={[
                  styles.badge,
                  done && styles.badgeDone,
                  active && styles.badgeActive,
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    (done || active) && styles.badgeTextActive,
                  ]}
                >
                  {stepNumber}
                </Text>
              </View>
              <Text style={[styles.stepText, active && styles.stepTextActive]}>
                {step}
              </Text>
            </View>
            {index < STEPS.length - 1 ? (
              <View
                style={[
                  styles.line,
                  stepNumber < currentStep && styles.lineDone,
                ]}
              />
            ) : null}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  stepCol: {
    alignItems: "center",
    width: 92,
  },
  badge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeDone: {
    backgroundColor: Colors.success,
  },
  badgeActive: {
    backgroundColor: Colors.primary,
  },
  badgeText: {
    color: Colors.textSecondary,
    fontWeight: "700",
    fontSize: 12,
  },
  badgeTextActive: {
    color: Colors.white,
  },
  stepText: {
    marginTop: 6,
    fontSize: 10,
    textAlign: "center",
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  stepTextActive: {
    color: Colors.primary,
  },
  line: {
    width: 22,
    height: 2,
    backgroundColor: Colors.border,
    marginHorizontal: 4,
    marginBottom: 14,
  },
  lineDone: {
    backgroundColor: Colors.success,
  },
});
