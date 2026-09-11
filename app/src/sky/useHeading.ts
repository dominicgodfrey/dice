// Compass heading for layer 3 of the Sky tile (PLAN.md D17). Only starts
// when asked, from a tap, because iOS Safari only grants orientation from a
// user gesture. Web uses DeviceOrientationEvent; native uses the
// magnetometer through expo-sensors.

import { Magnetometer } from "expo-sensors";
import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

export type HeadingState =
  | { status: "idle" }
  | { status: "asking" }
  | { status: "denied"; reason: string }
  | { status: "on"; heading: number };

type OrientationEventWithCompass = DeviceOrientationEvent & {
  webkitCompassHeading?: number;
};

type PermissionRequester = {
  requestPermission?: () => Promise<"granted" | "denied">;
};

export function useHeading(): {
  state: HeadingState;
  start: () => void;
  stop: () => void;
} {
  const [state, setState] = useState<HeadingState>({ status: "idle" });
  const cleanup = useRef<(() => void) | null>(null);

  const stop = useCallback(() => {
    cleanup.current?.();
    cleanup.current = null;
    setState({ status: "idle" });
  }, []);

  const start = useCallback(async () => {
    setState({ status: "asking" });
    if (Platform.OS === "web") {
      if (
        typeof window === "undefined" ||
        !("DeviceOrientationEvent" in window)
      ) {
        return setState({
          status: "denied",
          reason: "This browser has no compass.",
        });
      }
      const ctor = DeviceOrientationEvent as unknown as PermissionRequester;
      if (typeof ctor.requestPermission === "function") {
        try {
          const r = await ctor.requestPermission();
          if (r !== "granted")
            return setState({
              status: "denied",
              reason: "Permission was not granted.",
            });
        } catch {
          return setState({
            status: "denied",
            reason: "Permission was not granted.",
          });
        }
      }
      const onEvent = (e: OrientationEventWithCompass) => {
        let heading: number | null = null;
        if (typeof e.webkitCompassHeading === "number")
          heading = e.webkitCompassHeading;
        else if (e.absolute && e.alpha !== null)
          heading = (360 - e.alpha) % 360;
        else if (e.alpha !== null) heading = (360 - e.alpha) % 360;
        if (heading !== null) setState({ status: "on", heading });
      };
      const type =
        "ondeviceorientationabsolute" in window
          ? "deviceorientationabsolute"
          : "deviceorientation";
      window.addEventListener(type, onEvent as EventListener);
      cleanup.current = () =>
        window.removeEventListener(type, onEvent as EventListener);
      return;
    }
    try {
      const perm = await Magnetometer.requestPermissionsAsync();
      if (!perm.granted)
        return setState({
          status: "denied",
          reason: "Permission was not granted.",
        });
      Magnetometer.setUpdateInterval(200);
      const sub = Magnetometer.addListener(({ x, y }) => {
        let deg = Math.atan2(y, x) * (180 / Math.PI);
        deg = (deg + 360) % 360;
        setState({ status: "on", heading: deg });
      });
      cleanup.current = () => sub.remove();
    } catch {
      setState({ status: "denied", reason: "No magnetometer available." });
    }
  }, []);

  useEffect(() => () => cleanup.current?.(), []);

  return { state, start, stop };
}
