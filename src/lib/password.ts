import "server-only";

export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128; // bcrypt n'utilise que les 72 premiers octets : on évite les textes géants

/** Message d'erreur si le mot de passe est refusé, sinon null */
export function passwordProblem(password: string) {
  if (password.length < PASSWORD_MIN) return `Le mot de passe doit faire au moins ${PASSWORD_MIN} caractères`;
  if (password.length > PASSWORD_MAX) return "Mot de passe trop long";
  return null;
}
