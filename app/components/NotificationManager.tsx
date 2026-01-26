"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function NotificationManager() {
  const { data: session } = useSession();
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    if (session && "serviceWorker" in navigator && "PushManager" in window) {
      checkSubscription();
    }
  }, [session]);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error("Error checking subscription:", error);
    }
  };

  const subscribeToNotifications = async () => {
    if (!session) return;

    setLoading(true);
    try {
      // Demander la permission
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm !== "granted") {
        alert("Vous devez autoriser les notifications pour recevoir des alertes.");
        setLoading(false);
        return;
      }

      // Enregistrer le service worker
      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      // Obtenir la clé publique VAPID
      const response = await fetch("/api/notifications/vapid-public-key");
      const { publicKey } = await response.json();

      // S'abonner aux notifications push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      // Envoyer la subscription au serveur
      const subscribeResponse = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(subscription.toJSON()),
      });

      if (subscribeResponse.ok) {
        setIsSubscribed(true);
        alert("✅ Notifications activées avec succès !");
      } else {
        throw new Error("Failed to subscribe");
      }
    } catch (error) {
      console.error("Error subscribing to notifications:", error);
      alert("❌ Erreur lors de l'activation des notifications");
    } finally {
      setLoading(false);
    }
  };

  const unsubscribeFromNotifications = async () => {
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        const endpoint = subscription.endpoint;

        // Se désabonner localement
        await subscription.unsubscribe();

        // Informer le serveur
        await fetch("/api/notifications/subscribe", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ endpoint }),
        });

        setIsSubscribed(false);
        alert("🔕 Notifications désactivées");
      }
    } catch (error) {
      console.error("Error unsubscribing:", error);
      alert("❌ Erreur lors de la désactivation");
    } finally {
      setLoading(false);
    }
  };

  if (!session || !("Notification" in window)) {
    return null;
  }

  return (
    <div style={{ marginTop: "20px", padding: "15px", background: "#f8f9fa", borderRadius: "12px" }}>
      <h3 style={{ fontSize: "1rem", fontWeight: "600", marginBottom: "10px" }}>
        🔔 Notifications Push
      </h3>
      <p style={{ fontSize: "0.9rem", color: "#666", marginBottom: "15px" }}>
        {isSubscribed
          ? "Vous recevrez des notifications pour les nouveaux événements et les modifications."
          : "Activez les notifications pour être alerté des nouveaux événements."}
      </p>
      
      {permission === "denied" && (
        <p style={{ color: "#e74c3c", fontSize: "0.85rem", marginBottom: "10px" }}>
          ⚠️ Les notifications sont bloquées dans votre navigateur. Veuillez les autoriser dans les paramètres.
        </p>
      )}

      {!isSubscribed ? (
        <button
          onClick={subscribeToNotifications}
          disabled={loading || permission === "denied"}
          style={{
            padding: "10px 20px",
            background: permission === "denied" ? "#ccc" : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontWeight: "600",
            cursor: permission === "denied" ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "⏳ Chargement..." : "🔔 Activer les notifications"}
        </button>
      ) : (
        <button
          onClick={unsubscribeFromNotifications}
          disabled={loading}
          style={{
            padding: "10px 20px",
            background: "#e74c3c",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontWeight: "600",
            cursor: "pointer",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "⏳ Chargement..." : "🔕 Désactiver les notifications"}
        </button>
      )}
    </div>
  );
}
