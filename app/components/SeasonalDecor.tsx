import type { SeasonKey } from "@/lib/season";

// Positions fixes (pas d'aléatoire) : rendu identique côté serveur et navigateur
const BATS = [
  { top: 9, delay: 0, dur: 19, size: 26 },
  { top: 22, delay: 7, dur: 24, size: 20 },
  { top: 15, delay: 13, dur: 21, size: 16 },
  { top: 34, delay: 4, dur: 27, size: 18 },
];
const GHOSTS = [
  { left: 12, delay: 0, dur: 22 },
  { left: 72, delay: 9, dur: 26 },
  { left: 42, delay: 16, dur: 24 },
];
const FLAKES = Array.from({ length: 18 }, (_, i) => ({
  left: (i * 37) % 100,
  delay: (i * 1.7) % 12,
  dur: 9 + ((i * 5) % 8),
  size: 10 + ((i * 7) % 12),
  drift: i % 2 ? 30 : -30,
}));
const CONFETTI_COLORS = ["#f2c14e", "#ff6b6b", "#4dabf7", "#69db7c", "#da77f2"];
const CONFETTI = Array.from({ length: 22 }, (_, i) => ({
  left: (i * 29) % 100,
  delay: (i * 0.9) % 10,
  dur: 7 + ((i * 3) % 6),
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  rot: (i * 47) % 360,
}));

/** Décorations de saison, derrière le contenu, sans bloquer les clics */
export default function SeasonalDecor({ season }: { season: SeasonKey }) {
  return (
    <div className={`decor decor-${season}`} aria-hidden>
      {season === "halloween" && (
        <>
          <svg className="decor-web" viewBox="0 0 120 120" fill="none" stroke="currentColor" strokeWidth="1.2">
            {[0, 18, 36, 54, 72, 90].map((a) => (
              <line key={a} x1="120" y1="0" x2={120 - 120 * Math.cos((a * Math.PI) / 180)} y2={120 * Math.sin((a * Math.PI) / 180)} />
            ))}
            {[28, 52, 76, 100].map((r) => (
              <path
                key={r}
                d={[0, 18, 36, 54, 72, 90]
                  .map((a, i) => `${i ? "Q" : "M"}${i ? `${120 - (r - 6) * Math.cos(((a - 9) * Math.PI) / 180)} ${(r - 6) * Math.sin(((a - 9) * Math.PI) / 180)} ` : ""}${120 - r * Math.cos((a * Math.PI) / 180)} ${r * Math.sin((a * Math.PI) / 180)}`)
                  .join(" ")}
              />
            ))}
          </svg>
          <div className="decor-spider">
            <span className="decor-thread" />
            🕷️
          </div>
          {BATS.map((b, i) => (
            <span
              key={i}
              className="decor-bat"
              style={{ top: `${b.top}%`, fontSize: b.size, animationDelay: `${b.delay}s`, animationDuration: `${b.dur}s` }}
            >
              <span className="decor-flap">🦇</span>
            </span>
          ))}
          {GHOSTS.map((g, i) => (
            <span key={i} className="decor-ghost" style={{ left: `${g.left}%`, animationDelay: `${g.delay}s`, animationDuration: `${g.dur}s` }}>
              👻
            </span>
          ))}
        </>
      )}

      {season === "noel" &&
        FLAKES.map((f, i) => (
          <span
            key={i}
            className="decor-flake"
            style={{
              left: `${f.left}%`,
              fontSize: f.size,
              animationDelay: `${f.delay}s`,
              animationDuration: `${f.dur}s`,
              ["--drift" as string]: `${f.drift}px`,
            }}
          >
            ❄
          </span>
        ))}

      {season === "nouvel-an" &&
        CONFETTI.map((c, i) => (
          <span
            key={i}
            className="decor-confetti"
            style={{
              left: `${c.left}%`,
              background: c.color,
              animationDelay: `${c.delay}s`,
              animationDuration: `${c.dur}s`,
              ["--rot" as string]: `${c.rot}deg`,
            }}
          />
        ))}

      {season === "ete" && <span className="decor-sun">☀️</span>}
    </div>
  );
}
