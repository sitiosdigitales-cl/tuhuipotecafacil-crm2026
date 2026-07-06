"use client";

import { useState, useEffect } from "react";

export function usePWANotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    if ("Notification" in window) {
      setIsSupported(true); // eslint-disable-line react-hooks/set-state-in-effect -- Deteccion de API del navegador
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported) return false;

    const result = await Notification.requestPermission();
    setPermission(result);
    return result === "granted";
  };

  const subscribeToPush = async () => {
    if (!isSupported || permission !== "granted") return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: "YOUR_VAPID_KEY_HERE" // En producción, usar VAPID key real
      });

      setIsSubscribed(true);
      console.log("Push subscription:", subscription);
      return subscription;
    } catch (error) {
      console.error("Error subscribing to push:", error);
      return null;
    }
  };

  const unsubscribeFromPush = async () => {
    if (!isSupported) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
        setIsSubscribed(false);
      }
    } catch (error) {
      console.error("Error unsubscribing from push:", error);
    }
  };

  const sendLocalNotification = (title: string, options?: NotificationOptions) => {
    if (permission === "granted") {
      new Notification(title, {
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        ...options,
      });
    }
  };

  return {
    isSupported,
    isSubscribed,
    permission,
    requestPermission,
    subscribeToPush,
    unsubscribeFromPush,
    sendLocalNotification,
  };
}
