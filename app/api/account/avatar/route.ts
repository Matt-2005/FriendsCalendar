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
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ? Number(session.user.id) : null;
  if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });

  // Convertit le File (Web API) en Buffer puis upload
  const arrayBuf = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuf);

  const uploaded = await new Promise<{ secure_url: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "lesindecis/avatars", resource_type: "image", overwrite: true },
      (err, res) => (err ? reject(err) : resolve(res as any))
    );
    stream.end(buffer);
  });

  await prisma.user.update({
    where: { id: userId },
    data: { avatarUrl: uploaded.secure_url },
  });

  return NextResponse.json({ ok: true, url: uploaded.secure_url });
}
