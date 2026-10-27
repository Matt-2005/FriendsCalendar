// Validation commune création / modification d'un événement
export type EventInput = {
  title: string;
  description: string;
  location: string;
  date: Date;
  endDate: Date | null;
};

export function parseEventInput(body: any): { data?: EventInput; error?: string } {
  const title = String(body?.title ?? "").trim().slice(0, 120);
  const description = String(body?.description ?? "").trim().slice(0, 2000);
  const location = String(body?.location ?? "").trim().slice(0, 200);
  const date = new Date(String(body?.date ?? ""));
  const endDate = body?.endDate ? new Date(String(body.endDate)) : null;

  if (!title) return { error: "Donne un nom à ta sortie" };
  if (isNaN(date.getTime())) return { error: "Choisis une date et une heure" };
  if (endDate && isNaN(endDate.getTime())) return { error: "Heure de fin invalide" };
  if (endDate && endDate <= date) return { error: "La fin doit être après le début" };

  return { data: { title, description, location, date, endDate } };
}
