import React from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useStore } from "../store";
import { formatPrice } from "../geo";

/** Bottom card shown when a house is selected on the map or in AR. */
export default function PropertyDetailSheet() {
  const selected = useStore((s) => s.selected);
  const select = useStore((s) => s.select);
  const toggleSave = useStore((s) => s.toggleSave);
  const isSaved = useStore((s) => s.isSaved);

  if (!selected) return null;
  const saved = isSaved(selected.id);

  const rows: [string, string][] = [
    ["Beds", selected.bedrooms?.toString() ?? "—"],
    ["Baths", selected.bathrooms?.toString() ?? "—"],
    [
      "Size",
      selected.squareFootage ? `${selected.squareFootage.toLocaleString()} sqft` : "—",
    ],
    ["Built", selected.yearBuilt?.toString() ?? "—"],
    ["Type", selected.propertyType ?? "—"],
    [
      "Last sale",
      selected.lastSalePrice
        ? `${formatPrice(selected.lastSalePrice)}${
            selected.lastSaleDate ? ` · ${selected.lastSaleDate.slice(0, 4)}` : ""
          }`
        : "—",
    ],
  ];

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      onRequestClose={() => select(null)}
    >
      <Pressable style={styles.backdrop} onPress={() => select(null)} />
      <View style={styles.sheet}>
        <View style={styles.grabber} />
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.price}>{selected.priceLabel}</Text>
            <Text style={styles.address}>{selected.address}</Text>
          </View>
          <Pressable onPress={() => toggleSave(selected)} hitSlop={12}>
            <Ionicons
              name={saved ? "heart" : "heart-outline"}
              size={30}
              color={saved ? "#ff375f" : "#8e8e93"}
            />
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.stats}
          contentContainerStyle={{ gap: 10, paddingRight: 20 }}
        >
          {rows.map(([label, value]) => (
            <View key={label} style={styles.stat}>
              <Text style={styles.statValue}>{value}</Text>
              <Text style={styles.statLabel}>{label}</Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.ownerBox}>
          <Text style={styles.ownerLabel}>Owner (public record)</Text>
          <Text style={styles.ownerValue}>
            {selected.ownerNames.length
              ? selected.ownerNames.join(", ")
              : "Not available"}
          </Text>
        </View>

        <Pressable style={styles.closeBtn} onPress={() => select(null)}>
          <Text style={styles.closeText}>Close</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)" },
  sheet: {
    backgroundColor: "#1c1c1e",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 20,
    paddingBottom: 34,
    paddingTop: 10,
  },
  grabber: {
    alignSelf: "center",
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#48484a",
    marginBottom: 14,
  },
  headerRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  price: { color: "#fff", fontSize: 26, fontWeight: "700" },
  address: { color: "#aeaeb2", fontSize: 15, marginTop: 2 },
  stats: { marginTop: 18 },
  stat: {
    backgroundColor: "#2c2c2e",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    minWidth: 74,
  },
  statValue: { color: "#fff", fontSize: 16, fontWeight: "600" },
  statLabel: { color: "#8e8e93", fontSize: 12, marginTop: 3 },
  ownerBox: {
    marginTop: 18,
    backgroundColor: "#2c2c2e",
    borderRadius: 12,
    padding: 14,
  },
  ownerLabel: { color: "#8e8e93", fontSize: 12 },
  ownerValue: { color: "#fff", fontSize: 16, fontWeight: "500", marginTop: 4 },
  closeBtn: { marginTop: 20, alignItems: "center", paddingVertical: 12 },
  closeText: { color: "#0a84ff", fontSize: 17, fontWeight: "600" },
});
