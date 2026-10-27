import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import { genCalendarToken } from "@/lib/token";
import bcrypt from "bcrypt";

export const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

/** Base de données locale (npm run dev:db) : jamais vrai en production */
export const usingLocalDb = /@(localhost|127\.0\.0\.1)[:/]/.test(process.env.DATABASE_URL ?? "");

/** Connexion en un clic pour tester : uniquement en développement ET sur la base locale */
export const devLoginEnabled = process.env.NODE_ENV === "development" && usingLocalDb;

const findByEmail = (email: string) =>
  prisma.user.findFirst({ where: { email: { equals: email.trim(), mode: "insensitive" } } });

export const authOptions: NextAuthOptions = {
  // Les potes restent connectés 6 mois : pas besoin de retaper son mot de passe
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 180 },
  pages: { signIn: "/login", error: "/login" },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        // Les téléphones mettent souvent une majuscule au début ou un espace à la fin
        const email = String(credentials?.email ?? "").trim();
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;

        const user = await findByEmail(email);
        // passwordHash vide = compte créé avec Google, sans mot de passe
        if (!user || !user.passwordHash) return null;
        if (!(await bcrypt.compare(password, user.passwordHash))) return null;

        return { id: String(user.id), email: user.email, name: user.pseudo, image: user.avatarUrl };
      },
    }),
    ...(devLoginEnabled
      ? [
          Credentials({
            id: "dev-login",
            name: "Test",
            credentials: { userId: {} },
            async authorize(credentials) {
              const user = await prisma.user.findUnique({ where: { id: Number(credentials?.userId) } });
              return user ? { id: String(user.id), email: user.email, name: user.pseudo, image: user.avatarUrl } : null;
            },
          }),
        ]
      : []),
    ...(googleEnabled
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            authorization: { params: { prompt: "select_account" } },
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider !== "google") return true;
      const p = profile as { email?: string; email_verified?: boolean; given_name?: string; name?: string; picture?: string };
      if (!p?.email || !p.email_verified) return false;

      const email = p.email.trim().toLowerCase();
      const existing = await findByEmail(email);
      if (existing) {
        // Même email = même personne : on se connecte sur le compte existant
        if (!existing.avatarUrl && p.picture) {
          await prisma.user.update({ where: { id: existing.id }, data: { avatarUrl: p.picture } });
        }
      } else {
        await prisma.user.create({
          data: {
            email,
            pseudo: (p.given_name || p.name || email.split("@")[0]).slice(0, 40),
            avatarUrl: p.picture ?? null,
            passwordHash: "",
            calendarToken: genCalendarToken(),
          },
        });
      }
      return true;
    },

    async jwt({ token, user, account, trigger, session: updateSession }) {
      if (account?.provider === "google" && token.email) {
        // L'identifiant Google n'est pas le nôtre : on reprend l'utilisateur de la base
        const dbUser = await findByEmail(token.email);
        if (dbUser) {
          token.id = String(dbUser.id);
          token.name = dbUser.pseudo;
          token.email = dbUser.email;
          token.picture = dbUser.avatarUrl;
        }
      } else if (user) {
        token.id = (user as any).id;
        token.name = user.name ?? null;
        token.email = user.email ?? null;
        token.picture = user.image ?? null;
      }

      // Mise à jour de la session après modification du profil ou de l'avatar
      if (trigger === "update" && updateSession) {
        if (updateSession.avatarUrl) token.picture = updateSession.avatarUrl;
        if (updateSession.name) token.name = updateSession.name;
        if (updateSession.email) token.email = updateSession.email;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        session.user.name = (token.name as string | null) ?? session.user.name ?? null;
        session.user.email = (token.email as string | null) ?? session.user.email ?? null;
        session.user.image = (token.picture as string | null) ?? session.user.image ?? null;
      }
      return session;
    },
  },
};
