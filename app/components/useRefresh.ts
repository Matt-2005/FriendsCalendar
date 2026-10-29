"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

const MIN_SPIN_MS = 600; // le chargement reste visible un instant, sinon on ne voit rien se passer

/** Recharge les données de la page depuis le serveur, sans recharger toute l'app. */
export function useRefresh() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [spinning, setSpinning] = useState(false);
  const startedAt = useRef(0);
  const done = useRef<(() => void) | null>(null);

  const refresh = useCallback(() => {
    if (spinning) return Promise.resolve();
    startedAt.current = Date.now();
    setSpinning(true);
    startTransition(() => router.refresh());
    return new Promise<void>((resolve) => (done.current = resolve));
  }, [router, spinning]);

  // Fin du rechargement : on attend le minimum d'affichage puis on prévient l'appelant
  useEffect(() => {
    if (!spinning || isPending) return;
    const wait = Math.max(0, MIN_SPIN_MS - (Date.now() - startedAt.current));
    const t = setTimeout(() => {
      setSpinning(false);
      done.current?.();
      done.current = null;
    }, wait);
    return () => clearTimeout(t);
  }, [spinning, isPending]);

  return { refresh, refreshing: spinning };
}
