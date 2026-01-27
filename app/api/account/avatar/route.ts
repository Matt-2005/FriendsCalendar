// app/api/account/avatar/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id ? Number(session.user.id) : null;
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const form = await req.formData().catch((err) => {
      console.error("Erreur lors de la lecture du FormData:", err);
      return null;
    });
    
    if (!form) {
      return NextResponse.json({ error: "Impossible de lire les données du formulaire" }, { status: 400 });
    }

    const file = form.get("file") as File | null;
    
    if (!file) {
      return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
    }

    console.log("Fichier reçu:", { name: file.name, type: file.type, size: file.size });

    // Vérifier la taille du fichier (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Fichier trop volumineux (max 10MB)" }, { status: 400 });
    }

    // Vérifier que c'est bien une image
    if (file.size === 0) {
      return NextResponse.json({ error: "Le fichier est vide" }, { status: 400 });
    }

    // Convertit le File (Web API) en Buffer puis upload
    const arrayBuf = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);

    console.log("Buffer créé, taille:", buffer.length);

    const uploaded = await new Promise<{ secure_url: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { 
          folder: "lesindecis/avatars", 
          resource_type: "image", 
          overwrite: true,
          // L'image est déjà recadrée côté client, on optimise juste
          transformation: [
            { quality: "auto:good" }, // Qualité optimisée
            { fetch_format: "auto" } // Format optimal (webp si supporté)
          ]
        },
        (err, res) => {
          if (err) {
            console.error("Erreur Cloudinary:", err);
            reject(err);
          } else {
            console.log("Upload Cloudinary réussi:", res?.secure_url);
            resolve(res as any);
          }
        }
      );
      stream.end(buffer);
    });

    await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: uploaded.secure_url },
    });

    return NextResponse.json({ ok: true, url: uploaded.secure_url });
  } catch (error) {
    console.error("Erreur dans l'API avatar:", error);
    return NextResponse.json({ 
      error: "Erreur lors de l'upload", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
