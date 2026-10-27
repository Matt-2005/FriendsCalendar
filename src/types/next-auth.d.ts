// types/next-auth.d.ts
import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;                 // 👈 on ajoute id
      pseudo?: string | null;     // 👈 si tu veux aussi pseudo
    } & DefaultSession["user"];   // conserve name/email/image
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    pseudo?: string | null;
  }
}
