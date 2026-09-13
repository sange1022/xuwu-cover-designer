import test from "node:test";
import assert from "node:assert/strict";
import {
  cloneLayers,
  importTemplate,
  newLayer,
  normalizeColor,
  palette,
  presets,
  safeFileName,
} from "../src/model.js";

test("desktop ARGB colors retain alpha in browser RGBA order", () => {
  assert.equal(normalizeColor("#80FF0000"), "#FF000080");
  assert.equal(normalizeColor("#ff0000"), "#FF0000");
  assert.throws(() => normalizeColor("red"));
});

test("desktop templates migrate explicit font faces and legacy bold independently", () => {
  const raw = {
    Version: 1,
    Template: {
      Name: "旧模板",
      BackgroundImagePath: "C:\\photo.jpg",
      TextLayers: [
        { Text: "细体", Color: "#FFFFFFFF", FontWeight: 300, Bold: true },
        { Text: "旧粗体", Color: "#80FF0000", FontWeight: 400, Bold: true },
      ],
    },
  };
  const result = importTemplate(raw);
  assert.equal(result.layers[0].fontWeight, 300);
  assert.equal(result.layers[1].fontWeight, 700);
  assert.equal(result.layers[1].color, "#FF000080");
  assert.equal(result.kind, "text");
  assert.equal(result.desktopBackground, "C:\\photo.jpg");
});

test("web template import preserves overflow positions and clamps resource-heavy values", () => {
  const result = importTemplate({
    app: "xuwu-cover-designer",
    version: 1,
    name: "Test",
    size: [999999, 1600],
    background: "https://external.example/private.jpg",
    layers: [
      newLayer({ x: -0.5, y: 1.2, fontSize: 999999, color: "#FFFFFF80" }),
    ],
  });
  assert.equal(result.layers[0].x, -0.5);
  assert.equal(result.layers[0].y, 1.2);
  assert.equal(result.layers[0].fontSize, 2000);
  assert.equal(result.layers[0].color, "#FFFFFF80");
  assert.equal(result.size[0], 4096);
  assert.equal(result.background, null);
});

test("template copies scale text effects and never mutate the original", () => {
  const source = [newLayer({ fontSize: 100, stroke: 4, text: "不要自动换行" })];
  const copy = cloneLayers(source, 0.5);
  assert.notEqual(copy[0].id, source[0].id);
  assert.equal(copy[0].fontSize, 50);
  assert.equal(copy[0].stroke, 2);
  assert.equal(source[0].fontSize, 100);
  assert.equal(copy[0].text, "不要自动换行");
});

test("invalid and oversized template documents fail explicitly", () => {
  assert.throws(() => importTemplate({ app: "other", version: 1, layers: [] }));
  assert.throws(() =>
    importTemplate({
      app: "xuwu-cover-designer",
      version: 1,
      layers: Array(101).fill(newLayer()),
    }),
  );
  assert.throws(() =>
    importTemplate({ app: "xuwu-cover-designer", version: 1, layers: [null] }),
  );
});

test("original and ten Xiaohongshu layouts remain distinct with all original colors", () => {
  assert.equal(new Set(presets.map((p) => p.id)).size, 16);
  assert.equal(presets.filter((p) => p.category === "小红书").length, 10);
  assert.equal(palette.length, 25);
  assert.deepEqual(palette[0], ["经典蓝", "#0F4C81"]);
  assert.deepEqual(palette.at(-1), ["纯白", "#FFFFFF"]);
  for (const template of presets) {
    const imported = importTemplate({
      ...template,
      app: "xuwu-cover-designer",
      version: 1,
    });
    assert.equal(imported.layers.length, template.layers.length);
    assert.deepEqual(
      imported.layers.map((l) => l.textBackground),
      template.layers.map((l) => l.textBackground),
    );
  }
});

test("download names cannot introduce subdirectories in batch archives", () => {
  assert.equal(safeFileName("房间/前后\\对比.jpg"), "房间_前后_对比.jpg");
});
