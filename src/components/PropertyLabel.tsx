import React from "react";
import { Pressable, Text, StyleSheet, View } from "react-native";
import { Property } from "../types";
import { shortAddress } from "../geo";

interface Props {
  property: Property;
  distance: number; // meters
  scale: number; // 0.6 (far) .. 1.1 (near)
  onPress: () => void;
}

/**
 * A tappable floating tag drawn over the camera feed in AR: the price, the
 * street address of the house it's pinned to, then beds/baths/distance.
 */
export default function PropertyLabel({
  property,
  distance,
  scale,
  onPress,
}: Props) {
  return (
    <Pressable onPress={onPress} style={{ transform: [{ scale }] }}>
      <View style={styles.pill}>
        <Text style={styles.price}>{property.priceLabel}</Text>
        <Text style={styles.name} numberOfLines={1}>
          {shortAddress(property.address)}
        </Text>
        <Text style={styles.meta}>
          {property.bedrooms ?? "?"} bd · {property.bathrooms ?? "?"} ba ·{" "}
          {Math.round(distance)}m
        </Text>
      </View>
      <View style={styles.pointer} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    backgroundColor: "rgba(10,132,255,0.92)",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    alignItems: "center",
    maxWidth: 180,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
  },
  price: { color: "#fff", fontSize: 16, fontWeight: "700" },
  name: { color: "#fff", fontSize: 12, fontWeight: "600", marginTop: 1 },
  meta: { color: "#e6f0ff", fontSize: 11, marginTop: 1 },
  pointer: {
    alignSelf: "center",
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "rgba(10,132,255,0.92)",
  },
});
