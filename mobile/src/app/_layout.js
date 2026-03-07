import { useEffect, useRef } from "react";
import { Stack, useRouter } from "expo-router";
import { AuthProvider } from "context/authContext";
import {
  addNotificationReceivedListener,
  addNotificationResponseListener,
} from "../utils/pushNotifications";

function NotificationHandler() {
  const router = useRouter();
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    // Foreground notification received — no action needed (alert shown by handler)
    notificationListener.current = addNotificationReceivedListener(
      (notification) => {
        console.log("Notification received in foreground:", notification);
      }
    );

    // User tapped on a notification
    responseListener.current = addNotificationResponseListener((response) => {
      const data = response.notification.request.content.data;
      console.log("Notification tapped, data:", data);

      // Navigate based on notification type if needed
      if (data?.type === "appointment_created" || data?.type === "appointment_updated") {
        router.push("/admin/calendar");
      }
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  return null;
}

export default function Layout() {
  return (
    <AuthProvider>
      <NotificationHandler />
      <Stack screenOptions={{ headerShown: false, footerShown: false }} />
    </AuthProvider>
  );
}