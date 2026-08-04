import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useStore } from "../store";
import { providerMeta } from "../services";

/**
 * Explains an empty screen — missing API key, failed request, or genuinely no
 * houses at these coordinates. Since nothing is ever backfilled with sample
 * data, an empty result needs a reason attached to it.
 *
 * Renders nothing while loading or once real houses have arrived.
 */
export default function DataStatus() {
  const loading = useStore((s) => s.loading);
  const error = useStore((s) => s.error);
  const count = useStore((s) => s.properties.length);
  const provider = useStore((s) => s.provider);
  const center = useStore((s) => s.lastFetchCenter);
  const refresh = useStore((s) => s.refresh);

  if (loading || count > 0) return null;

  const meta = providerMeta(provider);
  const needsKey = !meta.hasKey();

  return (
    <View style={styles.card}>
      <Text style={styles.title}>
        {needsKey ? `${meta.label} isn't set up yet` : "No houses here"}
      </Text>
      <Text style={styles.body}>
        {error ?? `${meta.label} returned no houses around this spot.`}
      </Text>
      {needsKey ? (
        <Text style={styles.hint}>
          Add it to .env in the project folder, then restart the Expo server.
        </Text>
      ) : (
        center && (
          <Pressable style={styles.btn} onPress={() => refresh(center)}>
            <Text style={styles.btnText}>Retry</Text>
          </Pressable>
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(0,0,0,0.78)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 20,
    paddingVertical: 16,
    maxWidth: 320,
    alignItems: "center",
    gap: 6,
  },
  title: { color: "#fff", fontSize: 16, fontWeight: "700" },
  body: { color: "#d1d1d6", fontSize: 14, textAlign: "center", lineHeight: 20 },
  hint: { color: "#8e8e93", fontSize: 12, textAlign: "center", marginTop: 2 },
  btn: {
    backgroundColor: "#0a84ff",
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 11,
    marginTop: 6,
  },
  btnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});
