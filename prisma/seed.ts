// Données de démo pour la base de TEST locale (npm run dev:db / dev:reset).
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { randomBytes } from "crypto";
import { addDaysToKey, parisDateTime, parisDayEnd, parisDayStart, todayKey } from "../src/lib/dates";

const url = process.env.DATABASE_URL ?? "";
if (!/localhost|127\.0\.0\.1/.test(url)) {
  console.error("❌ Refusé : le remplissage de démo ne tourne que sur une base locale, jamais sur la production.");
  process.exit(1);
}

const prisma = new PrismaClient();
const day = (n: number) => addDaysToKey(todayKey(), n);
const at = (n: number, h: number, m = 0) => parisDateTime(day(n), h, m);

async function main() {
  // On repart de zéro
  await prisma.pushSubscription.deleteMany();
  await prisma.rsvp.deleteMany();
  await prisma.availability.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("demo1234", 10);
  const mk = (pseudo: string, role: "USER" | "ADMIN" = "USER") =>
    prisma.user.create({
      data: {
        pseudo,
        role,
        email: `${pseudo.toLowerCase().normalize("NFD").replace(/[^a-z]/g, "")}@demo.fr`,
        passwordHash,
        calendarToken: randomBytes(24).toString("base64url"),
      },
    });
  const matthew = await mk("Matthew", "ADMIN");
  const lea = await mk("Léa");
  const tom = await mk("Tom");
  const nina = await mk("Nina");
  const hugo = await mk("Hugo");

  const ev = (creatorId: number, title: string, date: Date, endDate: Date | null, location = "", description = "") =>
    prisma.event.create({ data: { creatorId, title, date, endDate, location, description } });
  const rsvp = (eventID: number, userID: number, status: "YES" | "NO" | "MAYBE") =>
    prisma.rsvp.create({ data: { eventID, userID, status } });

  const apero = await ev(lea.id, "Apéro chez Léa", at(1, 19, 30), at(1, 23), "Chez Léa", "Je m'occupe des boissons, ramenez de quoi grignoter !");
  await rsvp(apero.id, lea.id, "YES");
  await rsvp(apero.id, tom.id, "YES");
  await rsvp(apero.id, nina.id, "MAYBE");

  const cine = await ev(tom.id, "Ciné", at(3, 20, 15), at(3, 22, 45), "UGC Les Halles");
  await rsvp(cine.id, tom.id, "YES");
  await rsvp(cine.id, hugo.id, "NO");

  const halloween = await ev(nina.id, "Soirée Halloween déguisée", at(5, 21), at(6, 2), "Chez Nina", "Déguisement obligatoire 🎃");
  await rsvp(halloween.id, nina.id, "YES");
  await rsvp(halloween.id, matthew.id, "YES");
  await rsvp(halloween.id, lea.id, "YES");

  const resto = await ev(matthew.id, "Resto italien", at(9, 20), null, "Da Mario");
  await rsvp(resto.id, matthew.id, "YES");
  await rsvp(resto.id, hugo.id, "MAYBE");

  const passe = await ev(hugo.id, "Foot", at(-4, 18), at(-4, 20), "City stade");
  await rsvp(passe.id, hugo.id, "YES");
  await rsvp(passe.id, matthew.id, "YES");

  // Quelques dispos pour remplir le calendrier
  const dispo = (userId: number, from: number, to: number, type: "AVAILABLE" | "BUSY" | "VACATION", note?: string) =>
    prisma.availability.create({
      data: { userId, type, note, startDate: parisDayStart(day(from)), endDate: parisDayEnd(day(to)) },
    });
  for (const u of [lea, tom, nina, hugo]) await dispo(u.id, 4, 4, "AVAILABLE");
  await dispo(lea.id, 11, 11, "AVAILABLE");
  await dispo(tom.id, 11, 11, "AVAILABLE");
  await dispo(hugo.id, 7, 8, "BUSY");
  await dispo(nina.id, 14, 20, "VACATION", "Ski");

  console.log("✅ 5 potes de démo (mot de passe : demo1234), 5 sorties, des dispos.");
}

main().finally(() => prisma.$disconnect());
