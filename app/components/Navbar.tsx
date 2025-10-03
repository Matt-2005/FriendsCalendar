"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import styles from "./page.module.css";

export default function Navbar() {
    const { data: session } = useSession();
    const pathname = usePathname();

    const [open, setOpen] = useState(false);
    const btnRef = useRef<HTMLButtonElement | null>(null);
    const menuRef = useRef<HTMLDivElement | null>(null);

    // Fermer le menu sur clic extérieur
    useEffect(() => {
        function onDocClick(e: MouseEvent) {
        const t = e.target as Node;
        if (!menuRef.current || !btnRef.current) return;
        if (menuRef.current.contains(t) || btnRef.current.contains(t)) return;
        setOpen(false);
        }
        document.addEventListener("mousedown", onDocClick);
        return () => document.removeEventListener("mousedown", onDocClick);
    }, []);

    // Fermer le menu sur Échap
    useEffect(() => {
        function onKey(e: KeyboardEvent) {
        if (e.key === "Escape") setOpen(false);
        }
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, []);

    // Fermer le menu quand on change de page
    useEffect(() => {
        setOpen(false);
    }, [pathname]);

    return (
        <nav className={styles.navbar}>
        
            <div className={styles.navbarLeft}>
                <Link href="/events" className={styles.h1navPc}>Les Indécis Agenda</Link>
                <img src="/logoCalendrier.png" alt="logo calendrier"/>
            </div>

            {/* Droite : zone compte */}
            {session?.user ? (
            <div className={styles.navbarRight}>
                <Link href="/events/new" className={styles.addBtn}>
                    Ajouter un évènement
                </Link>

                <button className={styles.userButton} ref={btnRef} type="button" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((v) => !v)} >
                    <span>{session.user.name ?? "Mon compte"}</span>
                    <img src="/arrow_upward.png" alt="arrow_upward" className={styles.icon} />
                </button>

                {open && (
                <div ref={menuRef} role="menu" className={styles.menu}>
                    <Link href="/account" role="menuitem" className={styles.menuItem}>
                    Informations personnelles
                    </Link>

                    <div className={styles.menuDivider} />

                    <button
                    role="menuitem"
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className={styles.menuItem}
                    >
                    Logout
                    </button>
                </div>
                )}
            </div>
            ) : (
                <div>
                    <Link href="/login">Login</Link>
                    <Link href="/register">Inscription</Link>
                </div>
            )}
        </nav>
    );
}
