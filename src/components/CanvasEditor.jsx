import { useEffect, useRef, useState } from "react";
import { Canvas, IText } from "fabric";
import { ImagePlus, Maximize, Minus, Plus } from "lucide-react";
import { background, textOptions } from "../render";
import { ensureFont } from "../fonts";
import { IconButton } from "./Controls";

export function CanvasEditor({
  photo,
  size,
  fit,
  selectedId,
  onSelect,
  onPatch,
  onAddPhotos,
  onReady,
  notify,
  fontRevision,
}) {
  const element = useRef(null);
  const holder = useRef(null);
  const api = useRef(null);
  const synchronizing = useRef(false);
  const callbacks = useRef({ onSelect, onPatch, size });
  callbacks.current = { onSelect, onPatch, size };
  const [zoom, setZoom] = useState(1);
  const [scale, setScale] = useState(1);
  const [mounted, setMounted] = useState(false);
  const [box, setBox] = useState({ width: 400, height: 500 });
  useEffect(() => {
    const canvas = new Canvas(element.current, {
      width: 400,
      height: 500,
      backgroundColor: "#ffffff",
      preserveObjectStacking: true,
      selection: false,
      uniformScaling: true,
      enableRetinaScaling: true,
      renderOnAddRemove: false,
    });
    api.current = canvas;
    onReady(canvas);
    const selected = () => {
      if (!synchronizing.current)
        callbacks.current.onSelect(canvas.getActiveObject()?.layerId ?? null);
    };
    canvas.on("selection:created", selected);
    canvas.on("selection:updated", selected);
    canvas.on("selection:cleared", selected);
    canvas.on("object:modified", ({ target: t }) => {
      if (!t?.layerId) return;
      const fontSize = Math.max(1, Math.min(2000, t.fontSize * t.scaleX));
      t.set({ fontSize, scaleX: 1, scaleY: 1 });
      t.setCoords();
      callbacks.current.onPatch(t.layerId, {
        x: t.left / callbacks.current.size[0],
        y: t.top / callbacks.current.size[1],
        rotation: t.angle,
        fontSize,
      });
    });
    canvas.on("text:changed", ({ target: t }) => {
      callbacks.current.onPatch(t.layerId, { text: t.text });
    });
    const observer = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      setBox({
        width: Math.max(160, r.width - 64),
        height: Math.max(180, r.height - 64),
      });
    });
    observer.observe(holder.current);
    setMounted(true);
    return () => {
      observer.disconnect();
      onReady(null);
      api.current = null;
      void canvas.dispose();
    };
  }, [onReady]);
  useEffect(() => {
    const canvas = api.current;
    if (!canvas) return;
    const next = Math.min(box.width / size[0], box.height / size[1]) * zoom;
    setScale(next);
    canvas.setDimensions({
      width: Math.round(size[0] * next),
      height: Math.round(size[1] * next),
    });
    canvas.setZoom(next);
    canvas.requestRenderAll();
  }, [mounted, size, box, zoom]);
  useEffect(() => {
    const canvas = api.current;
    if (!canvas) return;
    let cancelled = false;
    canvas.backgroundImage = undefined;
    canvas.requestRenderAll();
    background(photo?.src, size, fit)
      .then((img) => {
        if (cancelled) {
          img?.dispose();
          return;
        }
        canvas.backgroundImage = img || undefined;
        canvas.requestRenderAll();
      })
      .catch(() => !cancelled && notify("图片加载失败，请重新添加图片"));
    return () => {
      cancelled = true;
      canvas.backgroundImage?.dispose();
    };
  }, [photo?.src, size, fit, mounted, notify]);
  useEffect(() => {
    const canvas = api.current;
    if (!canvas) return;
    let cancelled = false;
    const layers = photo?.layers || [];
    // Replacing a photo/template must not clear the new inspector selection.
    synchronizing.current = true;
    const ids = new Set(layers.map((l) => l.id));
    canvas
      .getObjects()
      .filter((o) => !ids.has(o.layerId))
      .forEach((o) => canvas.remove(o));
    layers.forEach((l, index) => {
      let object = canvas.getObjects().find((o) => o.layerId === l.id);
      if (!object) {
        object = new IText(l.text, textOptions(l, size));
        object.layerId = l.id;
        object.setControlsVisibility({
          ml: false,
          mr: false,
          mt: false,
          mb: false,
        });
        canvas.add(object);
      } else if (!object.isEditing) {
        object.set(textOptions(l, size));
        object.initDimensions();
        object.setCoords();
      }
      canvas.moveObjectTo(object, index);
      ensureFont(l)
        .then(() => {
          if (!cancelled && !object.isEditing) {
            object.initDimensions();
            object.setCoords();
            canvas.requestRenderAll();
          }
        })
        .catch(() => !cancelled && notify("字体加载失败，可重新选择字体"));
    });
    synchronizing.current = false;
    canvas.requestRenderAll();
    return () => {
      cancelled = true;
    };
  }, [photo?.layers, size, mounted, notify, fontRevision]);
  useEffect(() => {
    const canvas = api.current;
    if (!canvas) return;
    const target = canvas.getObjects().find((o) => o.layerId === selectedId);
    if (target && canvas.getActiveObject() !== target)
      canvas.setActiveObject(target);
    if (!target && canvas.getActiveObject()) canvas.discardActiveObject();
    canvas.requestRenderAll();
  }, [selectedId, photo?.layers, mounted]);
  return (
    <main className="workspace">
      <div className="canvas-heading">
        <span>{photo?.name || "新建封面"}</span>
        <span>{photo ? "封面画布" : "未添加图片"}</span>
      </div>
      <div
        className="canvas-viewport"
        ref={holder}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          onAddPhotos(e.dataTransfer.files);
        }}
      >
        <div className="canvas-scroll">
          <div
            className="canvas-paper"
            style={{ display: photo ? "block" : "none" }}
          >
            <canvas ref={element} />
          </div>
        </div>
        {!photo && (
          <button className="canvas-empty" onClick={() => onAddPhotos()}>
            <ImagePlus size={40} strokeWidth={1} />
            <span>添加封面图片</span>
          </button>
        )}
      </div>
      <footer className="canvas-footer">
        <span>
          {size[0]} × {size[1]} px
        </span>
        <div className="zoom-controls">
          <IconButton
            icon={Minus}
            label="缩小画布"
            onClick={() => setZoom((z) => Math.max(0.3, z - 0.2))}
          />
          <output>{Math.round(scale * 100)}%</output>
          <IconButton
            icon={Plus}
            label="放大画布"
            onClick={() => setZoom((z) => Math.min(3, z + 0.2))}
          />
          <IconButton
            icon={Maximize}
            label="适应画布"
            onClick={() => setZoom(1)}
          />
        </div>
      </footer>
    </main>
  );
}
