import { FabricImage, IText, Shadow, StaticCanvas } from "fabric";
import { ensureFont } from "./fonts";

export function textOptions(layer, size) {
  return {
    left: layer.x * size[0],
    top: layer.y * size[1],
    originX: "left",
    originY: "top",
    text: layer.text,
    fontFamily: layer.fontFamily,
    fontSize: layer.fontSize,
    fontWeight: layer.fontWeight,
    fontStyle: layer.italic ? "italic" : "normal",
    fill: layer.color,
    textBackgroundColor: layer.textBackground || "",
    opacity: layer.opacity,
    angle: layer.rotation,
    textAlign: layer.align,
    lineHeight: 1.2,
    charSpacing: layer.charSpacing,
    stroke: layer.stroke ? layer.strokeColor : null,
    strokeWidth: layer.stroke,
    paintFirst: "stroke",
    visible: layer.visible,
    shadow: layer.shadow
      ? new Shadow({
          color: "rgba(0,0,0,0.45)",
          offsetX: layer.shadowX,
          offsetY: layer.shadowY,
          blur: layer.shadowBlur,
          affectStroke: true,
        })
      : null,
    borderColor: "#007aff",
    cornerColor: "#fff",
    cornerStrokeColor: "#007aff",
    transparentCorners: false,
    cornerSize: 9,
    padding: 4,
    lockScalingFlip: true,
  };
}

export async function background(src, size, fit) {
  if (!src) return null;
  const img = await FabricImage.fromURL(src);
  const scale = Math[fit === "contain" ? "min" : "max"](
    size[0] / img.width,
    size[1] / img.height,
  );
  img.set({
    originX: "center",
    originY: "center",
    left: size[0] / 2,
    top: size[1] / 2,
    scaleX: scale,
    scaleY: scale,
    selectable: false,
    evented: false,
  });
  return img;
}

export async function renderCover({
  src,
  layers,
  size,
  fit = "cover",
  format = "png",
  quality = 0.95,
  thumbnail = false,
}) {
  await Promise.all(layers.filter((l) => l.visible).map(ensureFont));
  const canvas = new StaticCanvas(document.createElement("canvas"), {
    width: size[0],
    height: size[1],
    backgroundColor: "#ffffff",
    enableRetinaScaling: false,
    renderOnAddRemove: false,
  });
  try {
    canvas.backgroundImage = await background(src, size, fit);
    layers.forEach((layer) =>
      canvas.add(new IText(layer.text, textOptions(layer, size))),
    );
    const output = canvas.toCanvasElement(thumbnail ? 180 / size[0] : 1);
    return await new Promise((resolve, reject) =>
      output.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("图片导出失败"));
          if (!thumbnail && blob.type !== `image/${format}`)
            return reject(new Error("当前浏览器不支持此导出格式"));
          resolve(blob);
        },
        `image/${format}`,
        quality,
      ),
    );
  } finally {
    await canvas.dispose();
  }
}

export function download(blob, name) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.hidden = true;
  (document.querySelector("dialog[open]") || document.body).append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

export const readDataURL = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("文件读取失败"));
    reader.readAsDataURL(file);
  });

export async function readPhoto(file) {
  if (file.size > 60 * 1024 * 1024) throw new Error(`${file.name} 超过 60 MB`);
  const src = await readDataURL(file);
  const img = new Image();
  img.src = src;
  await img.decode();
  if (img.naturalWidth * img.naturalHeight > 80_000_000)
    throw new Error(`${file.name} 像素过大，请先缩小图片`);
  return { src, width: img.naturalWidth, height: img.naturalHeight };
}
