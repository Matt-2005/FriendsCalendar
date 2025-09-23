"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const r = useRouter();
  const sp = useSearchParams();
  const callbackUrl = sp.get("callbackUrl") || "/events";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setLoading(true);
    const res = await signIn("credentials", { email, password, redirect: false, callbackUrl });
    setLoading(false);
    if (res?.error) setErr("Email ou mot de passe invalide");
    else r.push(callbackUrl);
  }

  return (
    <form onSubmit={onSubmit}>
      <h1>Login</h1>
      <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
      <input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
      <button type="submit" disabled={loading}>{loading ? "..." : "Login"}</button>
      {err && <p>{err}</p>}
    </form>
  );
}
