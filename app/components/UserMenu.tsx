"use client";

import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import styles from "./UserMenu.module.css";

export default function UserMenu() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        buttonRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  if (!session?.user) {
    return null;
  }

  const user = session.user;
  const initial = user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "?";

  return (
    <div className={styles.userMenuContainer}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={styles.userButton}
        aria-label="Menu utilisateur"
        aria-expanded={isOpen}
      >
        {user.image ? (
          <img src={user.image} alt="Avatar" className={styles.avatar} />
        ) : (
          <div className={styles.avatarPlaceholder}>{initial}</div>
        )}
        <span className={styles.userName}>{user.name || user.email}</span>
        <svg
          className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ""}`}
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
        >
          <path
            d="M5 7.5L10 12.5L15 7.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <div ref={menuRef} className={styles.dropdown}>
          <div className={styles.dropdownHeader}>
            <div className={styles.dropdownAvatar}>
              {user.image ? (
                <img src={user.image} alt="Avatar" />
              ) : (
                <div className={styles.dropdownAvatarPlaceholder}>{initial}</div>
              )}
            </div>
            <div className={styles.dropdownInfo}>
              <div className={styles.dropdownName}>{user.name || "Utilisateur"}</div>
              <div className={styles.dropdownEmail}>{user.email}</div>
            </div>
          </div>

          <div className={styles.dropdownDivider} />

          <Link
            href="/account"
            className={styles.dropdownItem}
            onClick={() => setIsOpen(false)}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M10 10C12.7614 10 15 7.76142 15 5C15 2.23858 12.7614 0 10 0C7.23858 0 5 2.23858 5 5C5 7.76142 7.23858 10 10 10Z"
                fill="currentColor"
              />
              <path
                d="M10 12C4.477 12 0 14.477 0 17.5V20H20V17.5C20 14.477 15.523 12 10 12Z"
                fill="currentColor"
              />
            </svg>
            Mon compte
          </Link>

          <Link
            href="/events"
            className={styles.dropdownItem}
            onClick={() => setIsOpen(false)}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M17 2H15V0H13V2H7V0H5V2H3C1.89543 2 1 2.89543 1 4V18C1 19.1046 1.89543 20 3 20H17C18.1046 20 19 19.1046 19 18V4C19 2.89543 18.1046 2 17 2ZM17 18H3V8H17V18Z"
                fill="currentColor"
              />
            </svg>
            Tous les événements
          </Link>

          <Link
            href="/my-events"
            className={styles.dropdownItem}
            onClick={() => setIsOpen(false)}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M10 0C6.13401 0 3 3.13401 3 7V10L1.29289 11.7071C0.902369 12.0976 0.902369 12.7308 1.29289 13.1213C1.68342 13.5118 2.31658 13.5118 2.70711 13.1213L4 11.8284V7C4 3.68629 6.68629 1 10 1C13.3137 1 16 3.68629 16 7V11.8284L17.2929 13.1213C17.6834 13.5118 18.3166 13.5118 18.7071 13.1213C19.0976 12.7308 19.0976 12.0976 18.7071 11.7071L17 10V7C17 3.13401 13.866 0 10 0Z"
                fill="currentColor"
              />
              <path
                d="M8 16C8 17.1046 8.89543 18 10 18C11.1046 18 12 17.1046 12 16H8Z"
                fill="currentColor"
              />
            </svg>
            Mes événements créés
          </Link>

          <Link
            href="/events/new"
            className={styles.dropdownItem}
            onClick={() => setIsOpen(false)}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M10 0C9.44772 0 9 0.447715 9 1V9H1C0.447715 9 0 9.44772 0 10C0 10.5523 0.447715 11 1 11H9V19C9 19.5523 9.44772 20 10 20C10.5523 20 11 19.5523 11 19V11H19C19.5523 11 20 10.5523 20 10C20 9.44772 19.5523 9 19 9H11V1C11 0.447715 10.5523 0 10 0Z"
                fill="currentColor"
              />
            </svg>
            Créer un événement
          </Link>

          <div className={styles.dropdownDivider} />

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className={styles.dropdownItem}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M13 0H2C0.89543 0 0 0.895431 0 2V18C0 19.1046 0.89543 20 2 20H13C14.1046 20 15 19.1046 15 18V15H13V18H2V2H13V5H15V2C15 0.895431 14.1046 0 13 0Z"
                fill="currentColor"
              />
              <path
                d="M18.293 9.293L15.293 6.293L13.879 7.707L15.172 9H7V11H15.172L13.879 12.293L15.293 13.707L18.293 10.707C18.683 10.317 18.683 9.683 18.293 9.293Z"
                fill="currentColor"
              />
            </svg>
            Se déconnecter
          </button>
        </div>
      )}
    </div>
  );
}
