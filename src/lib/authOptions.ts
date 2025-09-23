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

        // On met bien le pseudo dans `name`
        return {
          id: String(user.id),
          email: user.email,
          name: user.pseudo ?? null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // ⬇️ lors du login, propage id + name + email dans le token
      if (user) {
        token.id = (user as any).id;
        token.name = user.name ?? null;    // 🔑 sans ça, `session.user.name` restera vide
        token.email = user.email ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      // ⬇️ recopie depuis le token vers la session
      if (session.user) {
        (session.user as any).id = token.id as string;
        session.user.name = (token.name as string | null) ?? session.user.name ?? null;
        session.user.email = (token.email as string | null) ?? session.user.email ?? null;
      }
      return session;
    },
  },
};
