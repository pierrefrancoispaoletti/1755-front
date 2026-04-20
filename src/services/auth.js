// Lit le payload d'un JWT sans vérifier la signature. La vérification
// est faite côté back à chaque appel protégé ; ici on veut seulement
// ré-hydrater l'identité utilisateur au refresh de la page.
export function decodeJwtPayload(token) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const pad = base64.length % 4 ? "=".repeat(4 - (base64.length % 4)) : "";
    const json = atob(base64 + pad);
    return JSON.parse(decodeURIComponent(escape(json)));
  } catch {
    return null;
  }
}

// Retourne la session courante si le token est présent et non expiré.
// Sinon, purge le token et retourne null.
export function readStoredSession() {
  if (typeof localStorage === "undefined") return null;
  const token = localStorage.getItem("token-1755");
  if (!token) return null;
  const payload = decodeJwtPayload(token);
  if (!payload) {
    localStorage.removeItem("token-1755");
    return null;
  }
  if (typeof payload.exp === "number" && payload.exp * 1000 < Date.now()) {
    localStorage.removeItem("token-1755");
    return null;
  }
  return {
    role: payload.user?.role || "",
    email: payload.user?.email || "",
    _id: payload.user?._id || "",
  };
}
