import React, { useEffect, useRef } from "react";
import { View, StyleSheet, ActivityIndicator, Text } from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";
import { useDeviceLocation } from "@/useDeviceLocation";
import { useStore } from "@/store";
import { distanceMeters, shortAddress } from "@/geo";
import PropertyDetailSheet from "@/components/PropertyDetailSheet";
import ProviderToggle from "@/components/ProviderToggle";
import DataStatus from "@/components/DataStatus";

export default function MapScreen() {
  const { coords } = useDeviceLocation();
  const properties = useStore((s) => s.properties);
  const select = useStore((s) => s.select);
  const refresh = useStore((s) => s.refresh);
  const lastCenter = useStore((s) => s.lastFetchCenter);
  const refetching = useRef(false);

  useEffect(() => {
    if (!coords || refetching.current) return;
    if (!lastCenter || distanceMeters(coords, lastCenter) > 40) {
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

  return (
    <View style={styles.container}>
      <MapView
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

      <View style={styles.toggle}>
        <ProviderToggle />
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
  toggle: { position: "absolute", top: 60, alignSelf: "center" },
  statusWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
});
