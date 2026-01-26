"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import styles from "./NotificationManager.module.css";

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
  const [error, setError] = useState<string>("");
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Vérifier le support des notifications
    const supported = typeof window !== "undefined" && 
                     "Notification" in window && 
                     "serviceWorker" in navigator && 
                     "PushManager" in window;
    setIsSupported(supported);
    
    if (supported) {
      setPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    if (session && isSupported) {
      checkSubscription();
    }
  }, [session, isSupported]);

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
    setError("");
    
    try {
      // Demander la permission
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm !== "granted") {
        setError("Vous devez autoriser les notifications dans votre navigateur.");
        setLoading(false);
        return;
      }

      // Enregistrer le service worker
      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      // Obtenir la clé publique VAPID
      const response = await fetch("/api/notifications/vapid-public-key");
      if (!response.ok) {
        throw new Error("Clés VAPID non configurées sur le serveur");
      }
      
      const { publicKey } = await response.json();
      if (!publicKey) {
        throw new Error("Clé publique VAPID manquante");
      }

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

      if (!subscribeResponse.ok) {
        const errorData = await subscribeResponse.json().catch(() => ({}));
        throw new Error(errorData.error || "Erreur lors de l'enregistrement");
      }

      setIsSubscribed(true);
      setError("");
    } catch (error: any) {
      console.error("Error subscribing to notifications:", error);
      setError(error.message || "Erreur lors de l'activation des notifications");
    } finally {
      setLoading(false);
    }
  };

  const unsubscribeFromNotifications = async () => {
    setLoading(true);
    setError("");
    
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
      }
    } catch (error: any) {
      console.error("Error unsubscribing:", error);
      setError("Erreur lors de la désactivation");
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return null;
  }

  if (!isSupported) {
    return (
      <div className={styles.container}>
        <div className={styles.warning}>
          ⚠️ Les notifications push ne sont pas supportées par votre navigateur.
        </div>
        <p className={styles.helpText}>
          Les notifications push sont disponibles sur Chrome, Firefox, Edge et Safari (iOS 16.4+).
        </p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <p className={styles.description}>
        {isSubscribed
          ? "✅ Vous recevrez des notifications pour les nouveaux événements et les modifications."
          : "Activez les notifications pour être alerté instantanément des nouveaux événements."}
      </p>
      
      {permission === "denied" && (
        <div className={styles.error}>
          ⚠️ Les notifications sont bloquées. Veuillez les autoriser dans les paramètres de votre navigateur.
        </div>
      )}

      {error && (
        <div className={styles.error}>
          ❌ {error}
        </div>
      )}

      {!isSubscribed ? (
        <button
          onClick={subscribeToNotifications}
          disabled={loading || permission === "denied"}
          className={`${styles.button} ${styles.buttonPrimary} ${(loading || permission === "denied") ? styles.buttonDisabled : ""}`}
        >
          {loading ? "⏳ Activation en cours..." : "🔔 Activer les notifications"}
        </button>
      ) : (
        <button
          onClick={unsubscribeFromNotifications}
          disabled={loading}
          className={`${styles.button} ${styles.buttonDanger} ${loading ? styles.buttonDisabled : ""}`}
        >
          {loading ? "⏳ Désactivation..." : "🔕 Désactiver les notifications"}
        </button>
      )}
    </div>
  );
}
