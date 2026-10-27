// Événement Chrome/Android "Installer l'application" (non standardisé, absent de lib.dom)
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// Safari iOS : vrai quand l'app est lancée depuis l'écran d'accueil
interface Navigator {
  standalone?: boolean;
}
