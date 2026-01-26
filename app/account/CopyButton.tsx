"use client";

import { useState } from "react";
import styles from "./account.module.css";

export default function CopyButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      alert("Erreur lors de la copie");
    }
  };

  return (
    <button type="button" onClick={handleCopy} className={styles.copyButton}>
      {copied ? "✓ Copié !" : "📋 Copier"}
    </button>
  );
}
