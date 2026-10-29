"use client";

import { useEffect, useRef, useState } from "react";
import { isStandalone } from "./pushClient";
import { useRefresh } from "./useRefresh";

const TRIGGER = 70; // distance à tirer (en px) pour déclencher
const MAX = 110;

/**
 * "Tirer pour rafraîchir" : on tire l'écran vers le bas quand on est tout en haut.
 * Actif seulement dans l'app installée : dans Safari/Chrome, le navigateur le fait déjà.
 */
export default function PullToRefresh() {
  const { refresh, refreshing } = useRefresh();
  const [pull, setPull] = useState(0);
  const [enabled, setEnabled] = useState(false);
  const startY = useRef<number | null>(null);
  const pullRef = useRef(0);
  const refreshingRef = useRef(false);

  useEffect(() => {
    refreshingRef.current = refreshing;
    if (!refreshing) {
      pullRef.current = 0;
      setPull(0);
    }
  }, [refreshing]);

  useEffect(() => setEnabled(isStandalone()), []);

  useEffect(() => {
    if (!enabled) return;

    const onStart = (e: TouchEvent) => {
      // Pas pendant un rechargement, ni quand une fenêtre (sheet, dialogue) est ouverte
      if (refreshingRef.current || window.scrollY > 0 || e.touches.length > 1 || document.body.style.overflow === "hidden") {
        startY.current = null;
        return;
      }
      startY.current = e.touches[0].clientY;
    };

    const onMove = (e: TouchEvent) => {
      if (startY.current === null) return;
      const delta = e.touches[0].clientY - startY.current;
      if (delta <= 0 || window.scrollY > 0) {
        if (pullRef.current) {
          pullRef.current = 0;
          setPull(0);
        }
        return;
      }
      e.preventDefault(); // évite le rebond de la page pendant qu'on tire
      const dist = Math.min(delta * 0.5, MAX); // résistance, comme sur iPhone
      pullRef.current = dist;
      setPull(dist);
    };

    const onEnd = () => {
      if (startY.current === null) return;
      startY.current = null;
      if (pullRef.current >= TRIGGER) {
        pullRef.current = TRIGGER;
        setPull(TRIGGER);
        navigator.vibrate?.(10);
        refresh();
      } else {
        pullRef.current = 0;
        setPull(0);
      }
    };

    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onEnd);
    window.addEventListener("touchcancel", onEnd);
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", onEnd);
    };
  }, [enabled, refresh]);

  if (!enabled || (pull === 0 && !refreshing)) return null;

  const progress = Math.min(pull / TRIGGER, 1);
  return (
    <div
      className="ptr"
      style={{ transform: `translate(-50%, ${pull - 44}px)`, opacity: refreshing ? 1 : progress }}
      role="status"
      aria-label={refreshing ? "Mise à jour…" : "Relâche pour rafraîchir"}
    >
      {refreshing ? (
        <span className="spinner" style={{ width: 20, height: 20 }} />
      ) : (
        <span className="ptr-arrow" style={{ transform: `rotate(${progress >= 1 ? 180 : progress * 160}deg)` }}>
          ↓
        </span>
      )}
    </div>
  );
}
