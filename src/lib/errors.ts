/** Message lisible d'une erreur inconnue (catch) */
export function errorMessage(e: unknown, fallback: string) {
  if (e instanceof Error && e.message) return e.message === "Failed to fetch" ? "Pas de connexion internet" : e.message;
  return fallback;
}
