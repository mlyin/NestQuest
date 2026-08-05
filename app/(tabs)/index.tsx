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
import { MOVE_THRESHOLD_M, MAX_DISTANCE_M, HFOV_DEG } from "@/config";
import PropertyLabel from "@/components/PropertyLabel";
import PropertyDetailSheet from "@/components/PropertyDetailSheet";
import DataStatus from "@/components/DataStatus";

const { width, height } = Dimensions.get("window");
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

  // Work out where every house sits relative to you, then split into the two
  // filters that decide whether it gets drawn. Keeping the counts lets the HUD
  // explain an empty screen instead of leaving you guessing.
  const placed = coords
    ? properties.map((p) => ({
        p,
        dist: distanceMeters(coords, p),
        rel: relativeAngle(h, bearingDegrees(coords, p)),
      }))
    : [];
  const inRange = placed.filter((t) => t.dist <= MAX_DISTANCE_M);
  const visible = inRange.filter((t) => Math.abs(t.rel) <= HFOV_DEG / 2);
  const tooFar = placed.length - inRange.length;
  const outOfFrame = inRange.length - visible.length;

  return (
    <View style={styles.container}>
      <CameraView style={StyleSheet.absoluteFill} facing="back" />

      {/* Floating price tags */}
      {visible.map(({ p, dist, rel }) => {
        const x = width / 2 + (rel / (HFOV_DEG / 2)) * (width / 2);
        const y = height * 0.38 + (dist / MAX_DISTANCE_M) * height * 0.18;
        const scale = 1.1 - (dist / MAX_DISTANCE_M) * 0.5;

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
            : `${visible.length} in view · ${properties.length} nearby · ${Math.round(h)}°`}
        </Text>

        {heading == null && (
          <Text style={styles.hudWarn}>
            No compass reading — tags assume you face north
          </Text>
        )}
        {!loading && visible.length === 0 && outOfFrame > 0 && (
          <Text style={styles.hudWarn}>
            Turn around — {outOfFrame} house{outOfFrame === 1 ? "" : "s"} out of frame
          </Text>
        )}
        {!loading && tooFar > 0 && (
          <Text style={styles.hudSub}>
            {tooFar} beyond {MAX_DISTANCE_M}m
          </Text>
        )}

        <Pressable
          style={styles.refreshBtn}
          disabled={!coords || loading}
          onPress={() => coords && refresh(coords)}
        >
          <Text style={styles.refreshText}>
            {loading ? "Refreshing…" : "Refresh"}
          </Text>
        </Pressable>
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
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    alignItems: "center",
    maxWidth: width - 40,
  },
  hudText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  hudWarn: { color: "#ffd60a", fontSize: 12, marginTop: 3, textAlign: "center" },
  hudSub: { color: "#aeaeb2", fontSize: 12, marginTop: 3, textAlign: "center" },
  refreshBtn: {
    marginTop: 8,
    backgroundColor: "#0a84ff",
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderRadius: 11,
  },
  refreshText: { color: "#fff", fontSize: 13, fontWeight: "600" },
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
