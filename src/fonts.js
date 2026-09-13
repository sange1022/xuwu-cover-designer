import { get, set } from "idb-keyval";
import { cache } from "fabric";

const localFaces = new Map();
const loaded = new Set();
const fontRequests = new Map();

export async function restoreFonts() {
  const entries = (await get("xuwu-fonts")) || [];
  const restored = [];
  for (const entry of entries) {
    try {
      const face = new FontFace(entry.family, entry.buffer, {
        weight: entry.weight || "100 900",
      });
      await face.load();
      document.fonts.add(face);
      cache.clearFontCache(entry.family);
      fontRequests.clear();
      restored.push({ family: entry.family, name: entry.name });
    } catch {
      /* An unavailable font must not prevent the workspace from opening. */
    }
  }
  return restored;
}

export async function uploadFont(file) {
  const family = `UserFont-${crypto.randomUUID()}`;
  const buffer = await file.arrayBuffer();
  const face = new FontFace(family, buffer, { weight: "100 900" });
  await face.load();
  document.fonts.add(face);
  const name = file.name.replace(/\.(ttf|otf|woff2?)$/i, "");
  const saved = (await get("xuwu-fonts")) || [];
  await set("xuwu-fonts", [...saved, { family, name, buffer }]);
  return { family, name };
}

export async function readLocalFonts() {
  if (!window.queryLocalFonts)
    throw new Error("此浏览器不支持读取系统字体，请使用「导入字体」");
  const entries = await window.queryLocalFonts();
  return entries.map((entry, index) => {
    const family = `LocalFont-${index}-${entry.postscriptName}`;
    localFaces.set(family, entry);
    return { family, name: entry.fullName };
  });
}

export async function ensureFont(layer) {
  if (localFaces.has(layer.fontFamily) && !loaded.has(layer.fontFamily)) {
    const file = await localFaces.get(layer.fontFamily).blob();
    const font = await new FontFace(
      layer.fontFamily,
      await file.arrayBuffer(),
      { weight: "100 900" },
    ).load();
    document.fonts.add(font);
    cache.clearFontCache(layer.fontFamily);
    fontRequests.clear();
    loaded.add(layer.fontFamily);
  }
  const key = `${layer.fontWeight} 32px "${layer.fontFamily.replace(/["\\]/g, "")}"`;
  const requestKey = `${key}:${layer.text}`;
  if (!fontRequests.has(requestKey)) {
    const request = document.fonts
      .load(key, layer.text || "封面")
      .then(() => cache.clearFontCache(layer.fontFamily))
      .catch((error) => {
        fontRequests.delete(requestKey);
        throw error;
      });
    fontRequests.set(requestKey, request);
    if (fontRequests.size > 200)
      fontRequests.delete(fontRequests.keys().next().value);
  }
  await fontRequests.get(requestKey);
}
