import { useEffect, useRef, useState } from "react";
import * as Location from "expo-location";
import { Coords } from "./types";

interface DeviceLocation {
  coords: Coords | null;
  heading: number | null; // degrees, 0 = true north
  permission: "granted" | "denied" | "pending";
  error: string | null;
}

/**
 * Streams the device's GPS position and compass heading. Heading powers the
 * AR overlay: we compare it to each house's bearing to know where to draw it.
 */
export function useDeviceLocation(): DeviceLocation {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [permission, setPermission] =
    useState<DeviceLocation["permission"]>("pending");
  const [error, setError] = useState<string | null>(null);
  const subs = useRef<Location.LocationSubscription[]>([]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (!mounted) return;
      if (status !== "granted") {
        setPermission("denied");
        setError("Location permission denied.");
        return;
      }
      setPermission("granted");

      const posSub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 5,
          timeInterval: 2000,
        },
        (loc) =>
          setCoords({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          })
      );

      const headSub = await Location.watchHeadingAsync((h) => {
        // trueHeading is -1 until calibrated; fall back to magnetic.
        const value = h.trueHeading >= 0 ? h.trueHeading : h.magHeading;
        setHeading(value);
      });

      subs.current = [posSub, headSub];
    })().catch((e) => setError(String(e)));

    return () => {
      mounted = false;
      subs.current.forEach((s) => s.remove());
      subs.current = [];
    };
  }, []);

  return { coords, heading, permission, error };
}
