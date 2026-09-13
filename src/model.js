import { xhsLayouts } from "./xhsTemplates.js";

export const uid = () => crypto.randomUUID();
export const SANS = "Noto Sans SC Variable";
export const SERIF = "Noto Serif SC Variable";
export const fonts = [
  { family: SANS, name: "思源风格黑体 · Noto Sans SC" },
  { family: SERIF, name: "思源风格宋体 · Noto Serif SC" },
  { family: "Arial", name: "Arial" },
  { family: "Georgia", name: "Georgia" },
  { family: "Microsoft YaHei", name: "微软雅黑（系统）" },
  { family: "PingFang SC", name: "苹方（系统）" },
];
export const palette = [
  ["经典蓝", "#0F4C81"],
  ["活力珊瑚", "#FF6F61"],
  ["草木绿", "#88B04B"],
  ["紫外光", "#5F4B8B"],
  ["玫瑰石英", "#F7CAC9"],
  ["静谧蓝", "#92A8D1"],
  ["辣椒红", "#9B1B30"],
  ["藏红花", "#FFA500"],
  ["祖母绿", "#009B77"],
  ["蜂蜜黄", "#F5DF4D"],
  ["极致灰", "#939597"],
  ["桃粉", "#EFC050"],
  ["奶油白", "#FFF4E0"],
  ["墨黑", "#101820"],
  ["陶土橙", "#C4622D"],
  ["孔雀蓝", "#005F6A"],
  ["雾霾蓝", "#6B7F99"],
  ["松石绿", "#45B8AC"],
  ["酒红", "#7A263A"],
  ["暖沙色", "#D8CAB8"],
  ["纯黑", "#000000"],
  ["深灰", "#404040"],
  ["中灰", "#808080"],
  ["浅灰", "#C0C0C0"],
  ["纯白", "#FFFFFF"],
];
export const sizes = [
  [900, 1200],
  [1200, 1600],
  [1080, 1440],
  [1080, 1920],
  [1080, 1080],
  [1920, 1080],
];

export function newLayer(overrides = {}) {
  return {
    id: uid(),
    text: "添加标题",
    fontFamily: SANS,
    fontSize: 110,
    fontWeight: 500,
    italic: false,
    color: "#FFFFFF",
    textBackground: "",
    opacity: 1,
    x: 0.1,
    y: 0.1,
    rotation: 0,
    align: "left",
    stroke: 0,
    strokeColor: "#202124",
    shadow: false,
    shadowX: 4,
    shadowY: 4,
    shadowBlur: 8,
    charSpacing: 0,
    visible: true,
    ...overrides,
  };
}

const preset = (id, name, category, family, layers) => ({
  id,
  name,
  category,
  builtin: true,
  kind: "text",
  size: [1200, 1600],
  layers: layers.map((l) => newLayer({ fontFamily: family, ...l })),
});

export const presets = [
  preset("architecture", "建筑作品", "建筑", SANS, [
    { text: "空间之间", fontSize: 168, fontWeight: 300, x: 0.1, y: 0.08 },
    {
      text: "ARCHITECTURE / 2026",
      fontSize: 28,
      fontWeight: 400,
      x: 0.11,
      y: 0.215,
      charSpacing: 140,
    },
    { text: "戌無营造", fontSize: 24, x: 0.1, y: 0.91 },
  ]),
  preset("editorial", "杂志封面", "杂志", SERIF, [
    { text: "建筑\n与生活", fontSize: 134, fontWeight: 600, x: 0.1, y: 0.07 },
    {
      text: "EVERYDAY\nARCHITECTURE",
      fontSize: 24,
      fontFamily: SANS,
      fontWeight: 400,
      x: 0.11,
      y: 0.3,
      charSpacing: 140,
    },
    { text: "VOL. 01", fontSize: 26, x: 0.1, y: 0.91 },
  ]),
  preset("bold", "醒目标题", "醒目", SANS, [
    {
      text: "理想的家",
      fontSize: 176,
      fontWeight: 900,
      x: 0.085,
      y: 0.08,
      stroke: 5,
      shadow: true,
    },
    {
      text: "从空间，到生活",
      fontSize: 52,
      fontWeight: 600,
      x: 0.095,
      y: 0.245,
      color: "#F5DF4D",
      stroke: 2,
    },
  ]),
  preset("minimal", "极简留白", "简约", SANS, [
    { text: "光，落在这里", fontSize: 66, fontWeight: 300, x: 0.1, y: 0.78 },
    {
      text: "LIGHT & SPACE",
      fontSize: 22,
      fontWeight: 400,
      x: 0.105,
      y: 0.86,
      charSpacing: 160,
    },
  ]),
  preset("before-after", "改造前后", "醒目", SANS, [
    {
      text: "改造前 / 改造后",
      fontSize: 100,
      fontWeight: 800,
      x: 0.08,
      y: 0.08,
      stroke: 3,
    },
    {
      text: "一次空间的新生",
      fontSize: 40,
      fontWeight: 500,
      x: 0.085,
      y: 0.18,
    },
    {
      text: "BEFORE / AFTER",
      fontSize: 26,
      x: 0.085,
      y: 0.91,
      charSpacing: 100,
    },
  ]),
  preset("journal", "生活记录", "简约", SERIF, [
    {
      text: "把日子\n过成喜欢的样子",
      fontSize: 76,
      fontWeight: 400,
      x: 0.1,
      y: 0.1,
    },
    {
      text: "日常片段  /  2026.09",
      fontSize: 24,
      fontFamily: SANS,
      x: 0.105,
      y: 0.28,
    },
  ]),
];

presets.push(
  ...xhsLayouts.map(({ id, name, fontFamily = SANS, layers }) =>
    preset(id, name, "小红书", fontFamily, layers),
  ),
);

export const cloneLayers = (layers, scale = 1) =>
  layers.map((l) => ({
    ...l,
    id: uid(),
    fontSize: l.fontSize * scale,
    stroke: l.stroke * scale,
    shadowX: l.shadowX * scale,
    shadowY: l.shadowY * scale,
    shadowBlur: l.shadowBlur * scale,
  }));

export function initialDocument() {
  const id = uid();
  return {
    version: 1,
    size: [1200, 1600],
    fit: "cover",
    selectedPhotoId: id,
    photos: [
      {
        id,
        name: "建筑示例",
        src: `${import.meta.env?.BASE_URL ?? "./"}demo.jpg`,
        width: 1200,
        height: 1600,
        layers: cloneLayers(presets[0].layers),
      },
    ],
    templates: [],
    favorites: [],
  };
}

export function normalizeColor(value) {
  if (/^#[\da-f]{6}$/i.test(value)) return value.toUpperCase();
  // Desktop templates use ARGB; CSS canvas uses RGBA.
  if (/^#[\da-f]{8}$/i.test(value))
    return `#${value.slice(3)}${value.slice(1, 3)}`.toUpperCase();
  throw new Error("颜色格式应为 #RRGGBB 或 #AARRGGBB");
}

const number = (value, fallback, min, max) =>
  Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;

export function importTemplate(raw) {
  if (raw?.Version === 1 && raw.Template) {
    const t = raw.Template;
    if (!Array.isArray(t.TextLayers)) throw new Error("模板缺少文字层");
    raw = {
      name: t.Name,
      kind: "text",
      size: [t.ExportSize?.Width || 1200, t.ExportSize?.Height || 1600],
      desktopBackground: t.BackgroundImagePath || null,
      layers: t.TextLayers.map((l) => ({
        text: l.Text,
        fontFamily: l.FontFamily || SANS,
        fontSize: l.FontSize,
        fontWeight:
          l.FontWeight === 400 && l.Bold
            ? 700
            : l.FontWeight || (l.Bold ? 700 : 400),
        italic: l.Italic,
        color: normalizeColor(l.Color || "#FFFFFF"),
        opacity: l.Opacity,
        rotation: l.RotationDegrees,
        x: l.X,
        y: l.Y,
        align: ["left", "center", "right"][l.Alignment] || "left",
        stroke: l.Stroke ? l.StrokeWidth : 0,
        shadow: l.Shadow,
        shadowX: l.ShadowOffsetX,
        shadowY: l.ShadowOffsetY,
      })),
    };
  } else if (raw?.app !== "xuwu-cover-designer" || raw.version !== 1) {
    throw new Error("不支持此模板文件");
  }
  if (!Array.isArray(raw.layers) || raw.layers.length > 100)
    throw new Error("文字层数量无效");
  const size = Array.isArray(raw.size) ? raw.size : [1200, 1600];
  const layers = raw.layers.map((l) => {
    if (!l || typeof l.text !== "string" || l.text.length > 10000)
      throw new Error("文字内容无效");
    if (!/^#[\da-f]{6}([\da-f]{2})?$/i.test(l.color || ""))
      throw new Error("文字颜色无效");
    return newLayer({
      text: l.text,
      fontFamily:
        typeof l.fontFamily === "string" ? l.fontFamily.slice(0, 200) : SANS,
      fontSize: number(l.fontSize, 110, 1, 2000),
      fontWeight: number(l.fontWeight, 400, 100, 900),
      x: number(l.x, 0.1, -10, 10),
      y: number(l.y, 0.1, -10, 10),
      color: l.color,
      textBackground: /^#[\da-f]{6}([\da-f]{2})?$/i.test(l.textBackground)
        ? l.textBackground
        : "",
      opacity: number(l.opacity, 1, 0, 1),
      italic: !!l.italic,
      rotation: number(l.rotation, 0, -360, 360),
      align: ["left", "center", "right"].includes(l.align) ? l.align : "left",
      stroke: number(l.stroke, 0, 0, 100),
      strokeColor: /^#[\da-f]{6}$/i.test(l.strokeColor)
        ? l.strokeColor
        : "#202124",
      shadow: !!l.shadow,
      shadowX: number(l.shadowX, 4, -1000, 1000),
      shadowY: number(l.shadowY, 4, -1000, 1000),
      shadowBlur: number(l.shadowBlur, 8, 0, 100),
      charSpacing: number(l.charSpacing, 0, -100, 1000),
      visible: l.visible !== false,
    });
  });
  const background =
    typeof raw.background === "string" &&
    /^data:image\/(png|jpeg|webp);base64,/.test(raw.background)
      ? raw.background
      : null;
  return {
    id: uid(),
    name: String(raw.name || "导入模板").slice(0, 80),
    layers,
    size: [number(size[0], 1200, 120, 4096), number(size[1], 1600, 120, 4096)],
    kind: background ? "full" : "text",
    background,
    desktopBackground: raw.desktopBackground,
    category: "我的",
    fit: raw.fit === "contain" ? "contain" : "cover",
  };
}

export const safeFileName = (name) =>
  (name || "封面").replace(/[<>:"/\\|?*\x00-\x1f]/g, "_").slice(0, 100);
