// Petit emoji automatique selon le titre, pour repérer les sorties d'un coup d'œil.
const RULES: [RegExp, string][] = [
  [/halloween|citrouille|horreur|zombie|sorci[èe]re|d[ée]guis/i, "🎃"],
  [/anniv|birthday/i, "🎂"],
  [/resto|restaurant|d[îi]ner|d[ée]j|brunch|pizza|burger|sushi|repas|bouffe|manger/i, "🍽️"],
  [/ap[ée]ro|bar\b|bi[èe]re|verre|pinte|cocktail|vin\b/i, "🍻"],
  [/cin[ée]|film|movie/i, "🎬"],
  [/concert|festival|musique|live/i, "🎵"],
  [/foot|match|sport|basket|tennis|padel|running|course|v[ée]lo|rando|escalade|piscine|ski/i, "⚽"],
  [/plage|mer\b|vacances|voyage|week-?end|wkd|road ?trip/i, "🏖️"],
  [/jeu|jeux|board|poker|soir[ée]e jeux|escape/i, "🎲"],
  [/gaming|lan\b|console|switch|ps5|xbox/i, "🎮"],
  [/barbec|bbq|grillade|pique-?nique/i, "🍖"],
  [/soir[ée]e|f[êe]te|party|teuf|club|bo[îi]te/i, "🎉"],
  [/karaok/i, "🎤"],
  [/mus[ée]e|expo|th[ée][âa]tre|spectacle/i, "🎭"],
  [/caf[ée]|go[ûu]ter|th[ée]\b/i, "☕"],
  [/no[ëe]l|christmas/i, "🎄"],
  [/nouvel an|r[ée]veillon/i, "🥂"],
];

export function eventEmoji(title: string) {
  for (const [re, emoji] of RULES) if (re.test(title)) return emoji;
  return "📅";
}
