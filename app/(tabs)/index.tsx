import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useDeviceLocation } from "@/useDeviceLocation";
import { useStore } from "@/store";
import { distanceMeters, bearingDegrees, relativeAngle } from "@/geo";
import { MOVE_THRESHOLD_M } from "@/config";
import PropertyLabel from "@/components/PropertyLabel";
import PropertyDetailSheet from "@/components/PropertyDetailSheet";
import DataStatus from "@/components/DataStatus";

const { width, height } = Dimensions.get("window");
const HFOV = 55; // approx horizontal camera field of view in portrait
const MAX_DISTANCE = 150; // meters — beyond this we don't draw labels
const TAG_WIDTH = 180; // keep in sync with styles.floating

export default function ExploreScreen() {
  const [camPerm, requestCam] = useCameraPermissions();
  const { coords, heading, permission, error: locationError } =
    useDeviceLocation();
  const properties = useStore((s) => s.properties);
  const loading = useStore((s) => s.loading);
  const select = useStore((s) => s.select);
  const refresh = useStore((s) => s.refresh);
  const lastCenter = useStore((s) => s.lastFetchCenter);
  const refetching = useRef(false);

  // Fetch houses when we first get a location, or after moving far enough
  // to be worth another API request (MOVE_THRESHOLD_M — see src/config.ts).
  useEffect(() => {
    if (!coords || refetching.current) return;
    const moved =
      !lastCenter || distanceMeters(coords, lastCenter) > MOVE_THRESHOLD_M;
    if (moved) {
      refetching.current = true;
      refresh(coords).finally(() => {
        refetching.current = false;
      });
    }
  }, [coords, lastCenter, refresh]);

  if (!camPerm) {
    return <Centered><ActivityIndicator color="#fff" /></Centered>;
  }
  if (!camPerm.granted) {
    return (
      <Centered>
        <Text style={styles.msg}>NestQuest needs your camera to show houses.</Text>
        <Pressable style={styles.btn} onPress={requestCam}>
          <Text style={styles.btnText}>Enable camera</Text>
        </Pressable>
      </Centered>
    );
  }
  if (permission === "denied") {
    return (
      <Centered>
        <Text style={styles.msg}>
          Location is off. Enable it in Settings so NestQuest can find nearby houses.
        </Text>
      </Centered>
    );
  }

  const h = heading ?? 0;

  return (
    <View style={styles.container}>
      <CameraView style={StyleSheet.absoluteFill} facing="back" />

      {/* Floating price tags */}
      {coords &&
        properties.map((p) => {
          const dist = distanceMeters(coords, p);
          if (dist > MAX_DISTANCE) return null;
          const bearing = bearingDegrees(coords, p);
          const rel = relativeAngle(h, bearing);
          if (Math.abs(rel) > HFOV / 2) return null; // out of view

          const x = width / 2 + (rel / (HFOV / 2)) * (width / 2);
          const y = height * 0.38 + (dist / MAX_DISTANCE) * height * 0.18;
          const scale = 1.1 - (dist / MAX_DISTANCE) * 0.5;

          return (
            <View
              key={p.id}
              style={[styles.floating, { left: x - TAG_WIDTH / 2, top: y }]}
            >
              <PropertyLabel
                property={p}
                distance={dist}
                scale={scale}
                onPress={() => select(p)}
              />
            </View>
          );
        })}

      {/* HUD */}
      <View style={styles.hud}>
        <Text style={styles.hudText}>
          {loading
            ? "Finding houses…"
            : `${properties.length} nearby · heading ${Math.round(h)}°`}
        </Text>
      </View>

      {/* Why the camera view is empty, when it is */}
      <View style={styles.statusWrap} pointerEvents="box-none">
        <DataStatus />
      </View>

      {locationError && (
        <View style={styles.errBox} pointerEvents="none">
          <Text style={styles.hudSub}>{locationError}</Text>
        </View>
      )}

      <PropertyDetailSheet />
    </View>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <View style={[styles.container, styles.center]}>{children}</View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  center: { justifyContent: "center", alignItems: "center", padding: 30, gap: 16 },
  floating: { position: "absolute", width: TAG_WIDTH, alignItems: "center" },
  hud: {
    position: "absolute",
    top: 60,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    alignItems: "center",
  },
  hudText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  hudSub: { color: "#ffd60a", fontSize: 12, marginTop: 2 },
  statusWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errBox: { position: "absolute", bottom: 40, alignSelf: "center" },
  msg: { color: "#fff", fontSize: 17, textAlign: "center", lineHeight: 24 },
  btn: {
    backgroundColor: "#0a84ff",
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
  },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
