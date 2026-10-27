type U = { pseudo: string; avatarUrl?: string | null };

function hue(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
  return h;
}

export default function Avatar({ user, size = 36 }: { user: U; size?: number }) {
  const style = { "--size": `${size}px` } as React.CSSProperties;
  if (user.avatarUrl) {
    return <img src={user.avatarUrl} alt={user.pseudo} title={user.pseudo} className="avatar" style={style} loading="lazy" />;
  }
  const initials = user.pseudo.trim().slice(0, 1).toUpperCase() || "?";
  return (
    <span
      className="avatar"
      title={user.pseudo}
      aria-label={user.pseudo}
      style={{ ...style, background: `hsl(${hue(user.pseudo)} 52% 52%)` }}
    >
      {initials}
    </span>
  );
}

export function AvatarStack({ users, max = 5, size = 30 }: { users: U[]; max?: number; size?: number }) {
  if (users.length === 0) return null;
  const shown = users.slice(0, max);
  const rest = users.length - shown.length;
  return (
    <div className="avatar-stack">
      {shown.map((u, i) => (
        <Avatar key={u.pseudo + i} user={u} size={size} />
      ))}
      {rest > 0 && (
        <span className="avatar avatar-more" style={{ "--size": `${size}px` } as React.CSSProperties}>
          +{rest}
        </span>
      )}
    </div>
  );
}
