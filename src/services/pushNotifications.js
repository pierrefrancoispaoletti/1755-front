import { useEffect, useState } from "react";

export function useNativePushRegistration() {
  const [token, setToken] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { Capacitor } = await import("@capacitor/core");
      if (!Capacitor.isNativePlatform()) return;

      const { PushNotifications } = await import("@capacitor/push-notifications");

      const permission = await PushNotifications.requestPermissions();
      if (permission.receive !== "granted") return;

      await PushNotifications.register();

      PushNotifications.addListener("registration", (t) => {
        if (!cancelled) setToken(t.value);
      });
      PushNotifications.addListener("registrationError", () => {});
      PushNotifications.addListener("pushNotificationReceived", () => {});
      PushNotifications.addListener("pushNotificationActionPerformed", () => {});
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return token;
}
