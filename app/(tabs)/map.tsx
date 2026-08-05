import React, { useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  Pressable,
} from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";
import { useDeviceLocation } from "@/useDeviceLocation";
import { useStore } from "@/store";
import { distanceMeters, shortAddress } from "@/geo";
import { MOVE_THRESHOLD_M } from "@/config";
import PropertyDetailSheet from "@/components/PropertyDetailSheet";
import DataStatus from "@/components/DataStatus";

export default function MapScreen() {
  const { coords } = useDeviceLocation();
  const properties = useStore((s) => s.properties);
  const loading = useStore((s) => s.loading);
  const select = useStore((s) => s.select);
  const refresh = useStore((s) => s.refresh);
  const lastCenter = useStore((s) => s.lastFetchCenter);
  const refetching = useRef(false);
  const mapRef = useRef<MapView | null>(null);

  useEffect(() => {
    if (!coords || refetching.current) return;
    if (!lastCenter || distanceMeters(coords, lastCenter) > MOVE_THRESHOLD_M) {
      refetching.current = true;
      refresh(coords).finally(() => (refetching.current = false));
    }
  }, [coords, lastCenter, refresh]);

  if (!coords) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color="#0a84ff" />
        <Text style={styles.msg}>Getting your location…</Text>
      </View>
    );
  }

  // initialRegion only applies on mount, so recentring is explicit.
  const recenter = () =>
    mapRef.current?.animateToRegion({
      latitude: coords.latitude,
      longitude: coords.longitude,
      latitudeDelta: 0.006,
      longitudeDelta: 0.006,
    });

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={StyleSheet.absoluteFill}
        showsUserLocation
        initialRegion={{
          latitude: coords.latitude,
          longitude: coords.longitude,
          latitudeDelta: 0.006,
          longitudeDelta: 0.006,
        }}
      >
        {properties.map((p) => (
          <Marker
            key={p.id}
            coordinate={{ latitude: p.latitude, longitude: p.longitude }}
            title={`${p.priceLabel} · ${shortAddress(p.address)}`}
            description={`${p.bedrooms ?? "?"} bd · ${p.bathrooms ?? "?"} ba`}
            onPress={() => select(p)}
          />
        ))}
      </MapView>

      <View style={styles.hud}>
        <Text style={styles.hudText}>
          {loading ? "Finding houses…" : `${properties.length} pinned`}
        </Text>
        <View style={styles.hudButtons}>
          <Pressable style={styles.hudBtn} onPress={recenter}>
            <Text style={styles.hudBtnText}>Recenter</Text>
          </Pressable>
          <Pressable
            style={styles.hudBtn}
            disabled={loading}
            onPress={() => refresh(coords)}
          >
            <Text style={styles.hudBtnText}>
              {loading ? "Refreshing…" : "Refresh"}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Why the map has no pins, when it doesn't */}
      <View style={styles.statusWrap} pointerEvents="box-none">
        <DataStatus />
      </View>

      <PropertyDetailSheet />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  center: { justifyContent: "center", alignItems: "center", gap: 12 },
  msg: { color: "#aeaeb2", fontSize: 15 },
  hud: {
    position: "absolute",
    top: 60,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    alignItems: "center",
  },
  hudText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  hudButtons: { flexDirection: "row", gap: 8, marginTop: 8 },
  hudBtn: {
    backgroundColor: "#0a84ff",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 11,
  },
  hudBtnText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  statusWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
});
