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

    // User tapped on a notification — navigate based on type
    responseListener.current = addNotificationResponseListener((response) => {
      const data = response.notification.request.content.data;
      console.log("Notification tapped, data:", data);

      const { type, referenceId } = data || {};
      if (type === 'case_assigned') {
        router.push('/admin/assigned-cases');
      } else if (type === 'appointment_created' || type === 'appointment_updated') {
        router.push('/admin/clientformstatus');
      } else if ((type === 'review_pending' || type === 'review_returned' || type === 'review_resubmitted') && referenceId) {
        router.push(`/admin/recommendation?caseId=${referenceId}`);
      } else if (referenceId) {
        router.push(`/admin/recommendation?caseId=${referenceId}`);
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