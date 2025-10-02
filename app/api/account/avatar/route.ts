// app/api/account/avatar/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
export const runtime = "nodejs";


export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userIdStr = session?.user?.id;
  if (!userIdStr) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("avatar");
  if (!(file instanceof File)) return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });

  // Limite simple (≈ 2MB)
  if (file.size > 2_000_000) return NextResponse.json({ error: "Fichier trop volumineux (max 2MB)" }, { status: 400 });

  const bytes = Buffer.from(await file.arrayBuffer());
  const ext = path.extname(file.name || "").toLowerCase() || ".png";
  const safeExt = [".png", ".jpg", ".jpeg", ".webp"].includes(ext) ? ext : ".png";
  const fileName = `u${userIdStr}_${Date.now()}${safeExt}`;
  const destDir = path.join(process.cwd(), "public", "avatars");
  const destPath = path.join(destDir, fileName);

  await mkdir(destDir, { recursive: true });
  await writeFile(destPath, bytes);

  const publicUrl = `/avatars/${fileName}`;
  await prisma.user.update({
    where: { id: Number(userIdStr) },
    data: { avatarUrl: publicUrl },
  });

  return NextResponse.json({ ok: true, avatarUrl: publicUrl }, { status: 201 });
}
