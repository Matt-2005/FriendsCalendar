// src/lib/cleanupEvents.ts
import { prisma } from "./prisma";

/**
 * Supprime automatiquement les événements passés
 * Un événement est considéré comme passé si sa date de fin (ou date de début si pas de date de fin)
 * est antérieure à maintenant
 */
export async function cleanupPastEvents() {
  try {
    const now = new Date();
    
    // Récupérer tous les événements
    const events = await prisma.event.findMany({
      select: { id: true, date: true, endDate: true },
    });

    // Identifier les événements passés
    const pastEventIds = events
      .filter((event) => {
        // Utiliser endDate si disponible, sinon date
        const effectiveEndDate = event.endDate || event.date;
        return effectiveEndDate < now;
      })
      .map((event) => event.id);

    // Supprimer les événements passés
    if (pastEventIds.length > 0) {
      console.log(`🗑️ Suppression de ${pastEventIds.length} événement(s) passé(s)`);
      
      // Supprimer d'abord les RSVPs associés
      await prisma.rsvp.deleteMany({
        where: { eventID: { in: pastEventIds } },
      });

      // Puis supprimer les événements
      await prisma.event.deleteMany({
        where: { id: { in: pastEventIds } },
      });
    }
  } catch (error) {
    console.error("❌ Erreur lors du nettoyage des événements passés:", error);
  }
}
