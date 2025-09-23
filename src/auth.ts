// app/lib/authOptions.ts (ou src/lib/…)
import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        const email = String(credentials?.email ?? "");
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.passwordHash) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        // ⬇⬇ IMPORTANT: NextAuth.User => id STRING, name/email OPTIONNELS
        return {
          id: String(user.id),      // ✅ string
          email: user.email ?? null,
          name: user.pseudo ?? null // ✅ mappe pseudo -> name
          // image: null // (optionnel)
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // persiste l'id string dans le JWT
      if (user) token.id = (user as any).id;
      return token;
    },
    async session({ session, token }) {
      // expose l'id côté client si besoin
      if (session.user && token?.id) (session.user as any).id = token.id as string;
      return session;
    },
  },
};
