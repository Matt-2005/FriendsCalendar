// Affiché instantanément au toucher, le temps que la page arrive
export default function Loading() {
  return (
    <main className="page" aria-busy="true" aria-label="Chargement">
      <div className="skeleton" style={{ width: "60%", height: 32, marginBottom: 10 }} />
      <div className="skeleton" style={{ width: "40%", height: 16, marginBottom: 24 }} />
      <div className="stack">
        {[0, 1, 2].map((i) => (
          <div key={i} className="card" style={{ display: "flex", gap: 14 }}>
            <div className="skeleton" style={{ width: 54, height: 62, borderRadius: 14, flex: "none" }} />
            <div className="grow">
              <div className="skeleton" style={{ width: "70%", height: 18, marginBottom: 10 }} />
              <div className="skeleton" style={{ width: "45%", height: 14, marginBottom: 14 }} />
              <div className="skeleton" style={{ width: "100%", height: 40, borderRadius: 12 }} />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
