import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt"; // ou "bcryptjs"

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "");
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.passwordHash) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        // On met bien le pseudo dans `name` et l'avatarUrl dans `image`
        return {
          id: String(user.id),
          email: user.email,
          name: user.pseudo ?? null,
          image: user.avatarUrl ?? null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session: updateSession }) {
      // ⬇️ lors du login, propage id + name + email + image dans le token
      if (user) {
        token.id = (user as any).id;
        token.name = user.name ?? null;
        token.email = user.email ?? null;
        token.picture = user.image ?? null; // NextAuth utilise 'picture' dans le token
      }
      
      // ⬇️ lors d'une mise à jour de session (après upload avatar)
      if (trigger === "update" && updateSession) {
        if (updateSession.avatarUrl) {
          token.picture = updateSession.avatarUrl;
        }
        if (updateSession.name) {
          token.name = updateSession.name;
        }
        if (updateSession.email) {
          token.email = updateSession.email;
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      // ⬇️ recopie depuis le token vers la session
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
