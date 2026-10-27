"use client";

import { signOut } from "next-auth/react";
import { disablePush } from "../../components/pushClient";

export default function LogoutButton() {
  async function logout() {
    // On coupe les notifications de cet appareil pour ne pas notifier le compte suivant
    await disablePush().catch(() => {});
    await fetch("/api/admin/simulate", { method: "DELETE" }).catch(() => {});
    await signOut({ callbackUrl: "/login" });
  }
  return (
    <button type="button" className="btn btn-danger btn-block" onClick={logout}>
      Se déconnecter
    </button>
  );
}
