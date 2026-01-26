"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";

export default function ConditionalNavbar() {
  const pathname = usePathname();
  
  // Ne pas afficher la navbar sur les pages publiques
  const hideNavbar = pathname === "/" || pathname === "/login" || pathname === "/register";
  
  if (hideNavbar) {
    return null;
  }
  
  return <Navbar />;
}
