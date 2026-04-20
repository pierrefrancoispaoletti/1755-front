// Construit une data URL à partir d'un champ `image` du back.
// Gère les deux shapes renvoyés par /api/products :
//   - fr : { contentType, data: { type: "Buffer", data: [bytes...] } }
//   - autres : { contentType, data: "<base64 string>" }
export function buildImageSrc(image) {
  if (!image || !image.data) return null;
  const contentType = image.contentType || "image/*";
  const d = image.data;

  if (typeof d === "string") {
    return `data:${contentType};base64,${d}`;
  }

  const bytes = Array.isArray(d) ? d : Array.isArray(d.data) ? d.data : null;
  if (!bytes) return null;

  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `data:${contentType};base64,${window.btoa(binary)}`;
}
