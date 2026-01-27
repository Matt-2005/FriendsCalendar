"use client";

import { useState, useCallback, useEffect } from "react";
import Cropper from "react-easy-crop";
import { Area } from "react-easy-crop";
import styles from "./account.module.css";

interface ImageCropperProps {
  imageSrc: string;
  onCropComplete: (croppedBlob: Blob) => void;
  onCancel: () => void;
}

export default function ImageCropper({
  imageSrc,
  onCropComplete,
  onCancel,
}: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  // Bloquer le scroll du body quand le modal est ouvert
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const onCropChange = useCallback((location: { x: number; y: number }) => {
    setCrop(location);
  }, []);

  const onZoomChange = useCallback((zoom: number) => {
    setZoom(zoom);
  }, []);

  const onCropCompleteInternal = useCallback(
    (croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleValidate = async () => {
    if (!croppedAreaPixels) return;

    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      onCropComplete(croppedBlob);
    } catch (error) {
      console.error("Erreur lors du recadrage:", error);
    }
  };

  return (
    <div className={styles.cropperOverlay} onClick={onCancel}>
      <div className={styles.cropperModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.cropperHeader}>
          <h3 className={styles.cropperTitle}>Recadrer votre photo</h3>
          <p className={styles.cropperSubtitle}>
            Déplacez et zoomez pour ajuster la zone de recadrage
          </p>
        </div>

        <div className={styles.cropperContainer}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropCompleteInternal}
            cropShape="rect"
            showGrid={true}
          />
        </div>

        <div className={styles.cropperControls}>
          <div className={styles.zoomControl}>
            <label className={styles.zoomLabel}>Zoom</label>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className={styles.zoomSlider}
            />
          </div>

          <div className={styles.cropperButtons}>
            <button
              type="button"
              onClick={onCancel}
              className={styles.cancelButton}
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleValidate}
              className={styles.validateButton}
            >
              Valider
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Fonction pour rogner l'image
async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Impossible de créer le context 2d");
  }

  // Définir la taille du canvas (carré de 500x500px)
  const size = 500;
  canvas.width = size;
  canvas.height = size;

  // Dessiner l'image recadrée
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    size,
    size
  );

  // Convertir le canvas en Blob
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Erreur lors de la création du blob"));
        return;
      }
      resolve(blob);
    }, "image/jpeg", 0.95);
  });
}

// Fonction helper pour charger l'image
function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });
}
