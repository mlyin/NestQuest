import React from "react";
import { View, Text, StyleSheet, FlatList, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStore } from "@/store";
import PropertyDetailSheet from "@/components/PropertyDetailSheet";

export default function SavedScreen() {
  const saved = useStore((s) => s.saved);
  const select = useStore((s) => s.select);
  const insets = useSafeAreaInsets();

  if (saved.length === 0) {
    return (
      <View style={[styles.container, styles.center]}>
        <Ionicons name="heart-outline" size={48} color="#48484a" />
        <Text style={styles.empty}>No saved houses yet.</Text>
        <Text style={styles.emptySub}>
          Tap the heart on a house to keep it here.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={saved}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ padding: 16, paddingTop: insets.top + 16 }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => select(item)}>
            <Text style={styles.price}>{item.priceLabel}</Text>
            <Text style={styles.address}>{item.address}</Text>
            <Text style={styles.meta}>
              {item.bedrooms ?? "?"} bd · {item.bathrooms ?? "?"} ba
              {item.yearBuilt ? ` · built ${item.yearBuilt}` : ""}
            </Text>
          </Pressable>
        )}
      />
      <PropertyDetailSheet />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  center: { justifyContent: "center", alignItems: "center", gap: 8, padding: 30 },
  empty: { color: "#fff", fontSize: 18, fontWeight: "600", marginTop: 8 },
  emptySub: { color: "#8e8e93", fontSize: 14, textAlign: "center" },
  card: { backgroundColor: "#1c1c1e", borderRadius: 14, padding: 16 },
  price: { color: "#fff", fontSize: 20, fontWeight: "700" },
  address: { color: "#aeaeb2", fontSize: 14, marginTop: 2 },
  meta: { color: "#8e8e93", fontSize: 13, marginTop: 6 },
});
