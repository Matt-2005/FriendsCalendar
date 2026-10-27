import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

const config = [
  { ignores: [".next/**", "node_modules/**", "public/sw.js", "next-env.d.ts"] },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Avatars Cloudinary/Google déjà optimisés : <img> suffit
      "@next/next/no-img-element": "off",
      // Texte en français plein d'apostrophes : React les échappe déjà
      "react/no-unescaped-entities": "off",
    },
  },
];

export default config;
