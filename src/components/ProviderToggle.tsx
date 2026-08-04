import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useStore } from "../store";
import { PROVIDERS } from "../services";

/** Segmented control to switch the live data source: Demo / RentCast / Zillow. */
export default function ProviderToggle() {
  const provider = useStore((s) => s.provider);
  const setProvider = useStore((s) => s.setProvider);

  return (
    <View style={styles.row}>
      {PROVIDERS.map((p) => {
        const active = provider === p.id;
        const disabled = !p.hasKey();
        return (
          <Pressable
            key={p.id}
            disabled={disabled}
            onPress={() => setProvider(p.id)}
            style={[styles.chip, active && styles.chipActive]}
          >
            <Text
              style={[
                styles.text,
                active && styles.textActive,
                disabled && styles.textDisabled,
              ]}
            >
              {p.label}
              {disabled ? " ·no key" : ""}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 14,
    padding: 3,
    gap: 3,
  },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 11 },
  chipActive: { backgroundColor: "#0a84ff" },
  text: { color: "#c7c7cc", fontSize: 13, fontWeight: "600" },
  textActive: { color: "#fff" },
  textDisabled: { color: "#5a5a5f" },
});
