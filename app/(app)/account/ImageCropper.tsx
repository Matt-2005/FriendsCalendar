"use client";

import { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { createPortal } from "react-dom";
import { useLockBody } from "../../components/Sheet";
import styles from "./account.module.css";

export default function ImageCropper({
  imageSrc,
  onCropComplete,
  onCancel,
}: {
  imageSrc: string;
  onCropComplete: (blob: Blob) => void;
  onCancel: () => void;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);
  useLockBody(true);

  const onComplete = useCallback((_: Area, pixels: Area) => setArea(pixels), []);

  async function validate() {
    if (!area) return;
    setBusy(true);
    try {
      onCropComplete(await getCroppedImg(imageSrc, area));
    } catch {
      setBusy(false);
      alert("Impossible de recadrer cette photo, essaie avec une autre.");
    }
  }

  return createPortal(
    <div className={styles.cropper}>
      <div className={styles.cropArea}>
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={1}
          cropShape="round"
          showGrid={false}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onComplete}
        />
      </div>
      <div className={styles.cropControls}>
        <p className="muted small" style={{ textAlign: "center" }}>Déplace et pince pour ajuster</p>
        <input
          type="range"
          min={1}
          max={3}
          step={0.05}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          aria-label="Zoom"
          className={styles.zoom}
        />
        <div className="grid-2">
          <button type="button" className="btn btn-outline" onClick={onCancel} disabled={busy}>
            Annuler
          </button>
          <button type="button" className="btn btn-primary" onClick={validate} disabled={busy || !area}>
            {busy ? <span className="spinner" /> : "Valider"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

async function getCroppedImg(src: string, crop: Area): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, size, size);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("blob"))), "image/jpeg", 0.9)
  );
}
