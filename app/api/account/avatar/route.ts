import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMeId } from "@/lib/session";
import { v2 as cloudinary } from "cloudinary";
import { rateLimit, tooMany } from "@/lib/rateLimit";

export const runtime = "nodejs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
  const meId = await getMeId();
  if (!meId) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  const limit = rateLimit(`avatar:${meId}`, 10, 60 * 60 * 1000);
  if (!limit.ok) return tooMany(limit.retryAfterSec);

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Aucune image reçue" }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Ce fichier n'est pas une image" }, { status: 400 });
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "Image trop lourde (10 Mo maximum)" }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const uploaded = await new Promise<{ secure_url: string }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: "lesindecis/avatars",
            public_id: `user-${meId}`,
            overwrite: true,
            invalidate: true,
            resource_type: "image",
            transformation: [{ width: 400, height: 400, crop: "fill" }, { quality: "auto:good" }, { fetch_format: "auto" }],
          },
          (err, res) => (err || !res ? reject(err) : resolve(res))
        )
        .end(buffer);
    });

    await prisma.user.update({ where: { id: meId }, data: { avatarUrl: uploaded.secure_url } });
    return NextResponse.json({ ok: true, url: uploaded.secure_url });
  } catch (error) {
    console.error("Avatar upload error:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "L'envoi de la photo a échoué, réessaie" }, { status: 500 });
  }
}
