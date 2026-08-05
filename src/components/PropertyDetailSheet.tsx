import React, { useEffect } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useStore } from "../store";
import { formatPrice } from "../geo";
import { configuredEstimateSources, Estimate } from "../services";
import { Property } from "../types";

/** Bottom card shown when a house is selected on the map or in AR. */
export default function PropertyDetailSheet() {
  const selected = useStore((s) => s.selected);
  if (!selected) return null;
  // Split so the hooks below always run while a house is open — they can't
  // live above an early return.
  return <Sheet property={selected} />;
}

function Sheet({ property }: { property: Property }) {
  const select = useStore((s) => s.select);
  const toggleSave = useStore((s) => s.toggleSave);
  const isSaved = useStore((s) => s.isSaved);
  const estimates = useStore((s) => s.estimates);
  const estimatesLoading = useStore((s) => s.estimatesLoading);
  const loadEstimates = useStore((s) => s.loadEstimates);

  // Value estimates are billed per house, so they're fetched on open only.
  useEffect(() => {
    loadEstimates(property);
  }, [property.id, loadEstimates]);

  const saved = isSaved(property.id);
  const sources = configuredEstimateSources();

  const details: [string, string][] = [
    ["Beds", property.bedrooms?.toString() ?? "—"],
    ["Baths", property.bathrooms?.toString() ?? "—"],
    [
      "Size",
      property.squareFootage
        ? `${property.squareFootage.toLocaleString()} sqft`
        : "—",
    ],
    ["Built", property.yearBuilt?.toString() ?? "—"],
    ["Type", property.propertyType ?? "—"],
    [
      "Last sale",
      property.lastSalePrice
        ? `${formatPrice(property.lastSalePrice)}${
            property.lastSaleDate ? ` · ${property.lastSaleDate.slice(0, 4)}` : ""
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
            <Text style={styles.price}>{property.priceLabel}</Text>
            <Text style={styles.address}>{property.address}</Text>
          </View>
          <Pressable onPress={() => toggleSave(property)} hitSlop={12}>
            <Ionicons
              name={saved ? "heart" : "heart-outline"}
              size={30}
              color={saved ? "#ff375f" : "#8e8e93"}
            />
          </Pressable>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: 8 }}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionLabel}>Current market value</Text>
          <View style={styles.group}>
            {sources.length === 0 ? (
              <Text style={styles.empty}>
                No estimate source configured. Add a key to .env.
              </Text>
            ) : estimatesLoading && estimates.length === 0 ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color="#8e8e93" />
                <Text style={styles.empty}>
                  Asking {sources.join(" and ")}…
                </Text>
              </View>
            ) : (
              estimates.map((e, i) => (
                <EstimateRow key={e.source} estimate={e} first={i === 0} />
              ))
            )}
          </View>

          <Text style={styles.sectionLabel}>Details</Text>
          <View style={styles.group}>
            {details.map(([label, value], i) => (
              <View key={label} style={[styles.row, i > 0 && styles.divider]}>
                <Text style={styles.rowLabel}>{label}</Text>
                <Text style={styles.rowValue}>{value}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.sectionLabel}>Owner (public record)</Text>
          <View style={styles.group}>
            <View style={styles.row}>
              <Text style={styles.rowValue}>
                {property.ownerNames.length
                  ? property.ownerNames.join(", ")
                  : "Not available"}
              </Text>
            </View>
          </View>
        </ScrollView>

        <Pressable style={styles.closeBtn} onPress={() => select(null)}>
          <Text style={styles.closeText}>Close</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

function EstimateRow({
  estimate,
  first,
}: {
  estimate: Estimate;
  first: boolean;
}) {
  const range =
    estimate.low != null && estimate.high != null
      ? `${formatPrice(estimate.low)} – ${formatPrice(estimate.high)}`
      : null;

  return (
    <View style={[styles.row, !first && styles.divider]}>
      <Text style={styles.rowLabel}>{estimate.source}</Text>
      <View style={{ flex: 1, alignItems: "flex-end" }}>
        {estimate.error ? (
          <Text style={styles.rowError} numberOfLines={2}>
            {estimate.error}
          </Text>
        ) : estimate.value != null ? (
          <>
            <Text style={styles.rowEstimate}>{formatPrice(estimate.value)}</Text>
            {range && <Text style={styles.rowRange}>{range}</Text>}
          </>
        ) : (
          <Text style={styles.rowValue}>No estimate</Text>
        )}
      </View>
    </View>
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
    maxHeight: "82%",
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
  scroll: { marginTop: 18 },
  sectionLabel: {
    color: "#8e8e93",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 7,
    marginTop: 4,
  },
  group: {
    backgroundColor: "#2c2c2e",
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 18,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    gap: 16,
  },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#48484a" },
  rowLabel: { color: "#8e8e93", fontSize: 15 },
  rowValue: { color: "#fff", fontSize: 16, fontWeight: "500", flexShrink: 1 },
  rowEstimate: { color: "#30d158", fontSize: 18, fontWeight: "700" },
  rowRange: { color: "#8e8e93", fontSize: 12, marginTop: 1 },
  rowError: { color: "#ff9f0a", fontSize: 13, textAlign: "right" },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 14,
  },
  empty: { color: "#8e8e93", fontSize: 14, flexShrink: 1 },
  closeBtn: { marginTop: 8, alignItems: "center", paddingVertical: 12 },
  closeText: { color: "#0a84ff", fontSize: 17, fontWeight: "600" },
});
