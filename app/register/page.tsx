"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const r = useRouter();
  const [pseudo, setPseudo] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pseudo, email, password }),
      });

      if (res.ok) {
        r.push("/login");
        return;
      }

      // On tente de récupérer un message JSON
      const data = await res.json().catch(() => ({} as any));

      if (res.status === 409) setErr(data.error ?? "Email déjà utilisé");
      else if (res.status === 400) setErr(data.error ?? "Entrées invalides");
      else setErr(data.error ?? "Erreur serveur");
    } catch {
      setErr("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <h1>Inscription</h1>
      <input placeholder="Pseudo" value={pseudo} onChange={e=>setPseudo(e.target.value)} />
      <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
      <input placeholder="Mot de passe" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
      <button type="submit" disabled={loading}>{loading ? "..." : "S'inscrire"}</button>
      {err && <p>{err}</p>}
    </form>
  );
}
