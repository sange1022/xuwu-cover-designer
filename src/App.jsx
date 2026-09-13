import { useCallback, useEffect, useRef, useState } from "react";
import {
  Download,
  Undo2,
  Redo2,
  Image,
  SlidersHorizontal,
  LayoutTemplate,
  Check,
  X,
} from "lucide-react";
import { Library } from "./components/Library";
import { CanvasEditor } from "./components/CanvasEditor";
import { Inspector } from "./components/Inspector";
import { ExportDialog } from "./components/ExportDialog";
import { IconButton, Modal } from "./components/Controls";
import {
  cloneLayers,
  fonts as baseFonts,
  importTemplate,
  newLayer,
  presets,
  safeFileName,
  uid,
} from "./model";
import { download, readDataURL, readPhoto, renderCover } from "./render";
import { readLocalFonts, restoreFonts, uploadFont } from "./fonts";
import { useWorkspace } from "./useWorkspace";

export default function App() {
  const [toast, setToast] = useState("");
  const notify = useCallback((message) => setToast(message), []);
  const { doc, update, ready, saved, undo, redo, canUndo, canRedo } =
    useWorkspace(notify);
  const photo =
    doc.photos.find((p) => p.id === doc.selectedPhotoId) || doc.photos[0];
  const [selectedId, setSelectedId] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(
    presets.find((t) => t.category === "小红书"),
  );
  const [fontOptions, setFontOptions] = useState(baseFonts);
  const [mobileTab, setMobileTab] = useState("canvas");
  const [dialog, setDialog] = useState(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [exportResult, setExportResult] = useState(null);
  const [exportMessage, setExportMessage] = useState("");
  const fileInput = useRef(null);
  const templateInput = useRef(null);
  const fontInput = useRef(null);
  const canvas = useRef(null);
  const canvasReady = useCallback((value) => {
    canvas.current = value;
  }, []);
  useEffect(() => {
    setSelectedId(photo?.layers[0]?.id ?? null);
  }, [photo?.id]);
  useEffect(() => {
    restoreFonts()
      .then((fonts) => setFontOptions((old) => [...old, ...fonts]))
      .catch(() => {});
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 6500);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(
    () => () => {
      if (exportResult) URL.revokeObjectURL(exportResult.url);
    },
    [exportResult],
  );

  const patchLayer = useCallback(
    (id, changes) => {
      update(
        (d) => ({
          ...d,
          photos: d.photos.map((p) =>
            p.layers.some((l) => l.id === id)
              ? {
                  ...p,
                  layers: p.layers.map((l) =>
                    l.id === id ? { ...l, ...changes } : l,
                  ),
                }
              : p,
          ),
        }),
        `layer-${id}-${Object.keys(changes).join()}`,
      );
    },
    [update],
  );
  const replaceLayers = (layers) =>
    update((d) => ({
      ...d,
      photos: d.photos.map((p) => (p.id === photo.id ? { ...p, layers } : p)),
    }));
  const addLayer = () => {
    if (!photo) return;
    const layer = newLayer({ fontSize: doc.size[0] * 0.095 });
    replaceLayers([...photo.layers, layer]);
    setSelectedId(layer.id);
    setMobileTab("inspector");
  };
  const copyLayer = () => {
    const source = photo?.layers.find((l) => l.id === selectedId);
    if (!source) return;
    const layer = {
      ...source,
      id: uid(),
      x: source.x + 0.025,
      y: source.y + 0.025,
    };
    replaceLayers([...photo.layers, layer]);
    setSelectedId(layer.id);
  };
  const deleteLayer = () => {
    if (!photo || !selectedId) return;
    const layers = photo.layers.filter((l) => l.id !== selectedId);
    replaceLayers(layers);
    setSelectedId(layers.at(-1)?.id ?? null);
  };
  const reorderLayer = (direction) => {
    const layers = [...photo.layers];
    const from = layers.findIndex((l) => l.id === selectedId);
    const to = from + direction;
    if (from < 0 || to < 0 || to >= layers.length) return;
    [layers[from], layers[to]] = [layers[to], layers[from]];
    replaceLayers(layers);
  };
  useEffect(() => {
    const handler = (e) => {
      if (
        e.target.closest("input, textarea, select, [contenteditable]") ||
        canvas.current?.getActiveObject()?.isEditing ||
        dialog
      )
        return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        e.shiftKey ? redo() : undo();
      }
      if ((e.key === "Backspace" || e.key === "Delete") && selectedId) {
        e.preventDefault();
        deleteLayer();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d") {
        e.preventDefault();
        copyLayer();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  const addPhotos = async (files) => {
    if (!files) {
      fileInput.current.click();
      return;
    }
    const added = [];
    for (const file of Array.from(files)) {
      try {
        const result = await readPhoto(file);
        added.push({
          ...result,
          id: uid(),
          name: file.name,
          layers: cloneLayers(photo?.layers || []),
        });
      } catch (error) {
        notify(`${file.name}：${error.message || "不支持此图片"}`);
      }
    }
    if (added.length) {
      update((d) => ({
        ...d,
        photos: [...d.photos, ...added],
        selectedPhotoId: added[0].id,
      }));
      setMobileTab("canvas");
      notify(`已添加 ${added.length} 张图片`);
    }
  };
  const applyTemplate = (template) => {
    if (!photo) return;
    const size = template.kind === "full" ? template.size : doc.size;
    const layers = cloneLayers(template.layers, size[0] / template.size[0]);
    update((d) => ({
      ...d,
      size,
      fit: template.kind === "full" ? template.fit || "cover" : d.fit,
      photos: d.photos.map((p) =>
        p.id === photo.id
          ? {
              ...p,
              layers,
              ...(template.background ? { src: template.background } : {}),
            }
          : p,
      ),
    }));
    setSelectedId(layers[0]?.id ?? null);
    setMobileTab("canvas");
    notify(`已套用「${template.name}」`);
  };
  const saveTemplate = (kind) => {
    setName(
      `我的${kind === "full" ? "完整" : "文字"}模板 ${doc.templates.length + 1}`,
    );
    setDialog({ type: "save-template", kind });
  };
  const confirmTemplate = async (e) => {
    e.preventDefault();
    if (!name.trim() || busy) return;
    setBusy(true);
    try {
      if (dialog.type === "rename-template") {
        const updated = { ...selectedTemplate, name: name.trim() };
        update((d) => ({
          ...d,
          templates: d.templates.map((t) =>
            t.id === updated.id ? updated : t,
          ),
        }));
        setSelectedTemplate(updated);
      } else {
        let background = null;
        if (dialog.kind === "full") {
          background = photo.src.startsWith("data:")
            ? photo.src
            : await readDataURL(await (await fetch(photo.src)).blob());
        }
        const template = {
          id: uid(),
          name: name.trim(),
          kind: dialog.kind,
          size: [...doc.size],
          fit: doc.fit,
          layers: cloneLayers(photo.layers),
          background,
          category: "我的",
        };
        update((d) => ({ ...d, templates: [...d.templates, template] }));
        setSelectedTemplate(template);
      }
      setDialog(null);
      notify("模板已保存");
    } catch {
      notify("模板保存失败，请重试");
    } finally {
      setBusy(false);
    }
  };
  const importFile = async (file) => {
    if (!file) return;
    try {
      if (file.size > 80 * 1024 * 1024) throw new Error("模板文件过大");
      const template = importTemplate(JSON.parse(await file.text()));
      update((d) => ({ ...d, templates: [...d.templates, template] }));
      setSelectedTemplate(template);
      notify(
        template.desktopBackground
          ? "已导入文字版式；桌面版背景图片需重新添加"
          : "模板已导入",
      );
    } catch (error) {
      notify(`导入失败：${error.message}`);
    }
  };
  const exportTemplate = () => {
    if (!selectedTemplate) return;
    const { builtin, desktopBackground, ...data } = selectedTemplate;
    download(
      new Blob(
        [
          JSON.stringify(
            { ...data, app: "xuwu-cover-designer", version: 1 },
            null,
            2,
          ),
        ],
        { type: "application/json" },
      ),
      `${safeFileName(data.name)}.json`,
    );
  };
  const exportImages = async (batch, format, quality) => {
    if (!photo || busy) return;
    setBusy(true);
    setProgress(0);
    setExportMessage("");
    setExportResult(null);
    try {
      const sources = batch ? doc.photos : [photo];
      const extension = format === "jpeg" ? "jpg" : format;
      const zip = batch ? new (await import("jszip")).default() : null;
      for (let i = 0; i < sources.length; i++) {
        const blob = await renderCover({
          src: sources[i].src,
          layers: photo.layers,
          size: doc.size,
          fit: doc.fit,
          format,
          quality,
        });
        const filename = `${String(i + 1).padStart(2, "0")}-${safeFileName(sources[i].name.replace(/\.[^.]+$/, ""))}.${extension}`;
        if (zip) zip.file(filename, blob);
        else {
          setExportResult({
            url: URL.createObjectURL(blob),
            name: filename,
            preview: true,
          });
          download(blob, filename);
        }
        setProgress(((i + 1) / sources.length) * (zip ? 90 : 100));
      }
      if (zip) {
        const blob = await zip.generateAsync(
          { type: "blob", compression: "STORE" },
          (meta) => setProgress(90 + meta.percent / 10),
        );
        setExportResult({
          url: URL.createObjectURL(blob),
          name: "戌無营造-封面合集.zip",
          preview: false,
        });
        download(blob, "戌無营造-封面合集.zip");
      }
      setExportMessage(
        batch ? `已生成 ${sources.length} 张封面` : "封面已生成",
      );
    } catch (error) {
      setExportMessage(`导出失败：${error.message}`);
    } finally {
      setBusy(false);
    }
  };
  const centerLayer = (direction) => {
    const target = canvas.current
      ?.getObjects()
      .find((o) => o.layerId === selectedId);
    if (!target) return;
    const bounds = target.getBoundingRect();
    patchLayer(
      selectedId,
      direction === "horizontal"
        ? {
            x:
              (target.left + doc.size[0] / 2 - bounds.left - bounds.width / 2) /
              doc.size[0],
          }
        : {
            y:
              (target.top + doc.size[1] / 2 - bounds.top - bounds.height / 2) /
              doc.size[1],
          },
    );
  };
  const importFonts = async (files) => {
    for (const file of Array.from(files || [])) {
      try {
        if (file.size > 60 * 1024 * 1024) throw new Error("字体文件超过 60 MB");
        const font = await uploadFont(file);
        setFontOptions((old) => [...old, font]);
        if (selectedId) patchLayer(selectedId, { fontFamily: font.family });
        notify(`已导入字体「${font.name}」`);
      } catch (error) {
        notify(`字体导入失败：${error.message}`);
      }
    }
  };
  return (
    <div className={`app mobile-${mobileTab}`} aria-busy={!ready}>
      <header className="app-header">
        <h1>
          <strong>戌無营造</strong>
          <span>/</span>封面设计
        </h1>
        <div className="header-actions">
          <span className="save-status">
            {saved ? (
              <>
                <Check size={13} />
                已保存到本机
              </>
            ) : (
              "保存中…"
            )}
          </span>
          <IconButton
            icon={Undo2}
            label="撤销"
            onClick={undo}
            disabled={!canUndo}
          />
          <IconButton
            icon={Redo2}
            label="重做"
            onClick={redo}
            disabled={!canRedo}
          />
          <button
            className="button primary"
            onClick={() => setDialog({ type: "export" })}
            disabled={!photo || !ready}
          >
            <Download size={17} />
            <span>导出</span>
          </button>
        </div>
      </header>
      <nav className="mobile-tabs" aria-label="编辑面板">
        {[
          [LayoutTemplate, "library", "图片与模板"],
          [Image, "canvas", "画布"],
          [SlidersHorizontal, "inspector", "文字设置"],
        ].map(([Icon, key, label]) => (
          <button
            key={key}
            aria-current={mobileTab === key ? "page" : undefined}
            onClick={() => setMobileTab(key)}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </nav>
      <div className="editor-layout" inert={!ready ? true : undefined}>
        <Library
          doc={doc}
          photo={photo}
          selectedTemplate={selectedTemplate}
          onSelectTemplate={setSelectedTemplate}
          onApplyTemplate={applyTemplate}
          onSaveTemplate={saveTemplate}
          onRenameTemplate={() => {
            setName(selectedTemplate.name);
            setDialog({ type: "rename-template" });
          }}
          onDeleteTemplate={() => {
            update((d) => ({
              ...d,
              templates: d.templates.filter(
                (t) => t.id !== selectedTemplate.id,
              ),
            }));
            setSelectedTemplate(presets[0]);
          }}
          onExportTemplate={exportTemplate}
          onImportTemplate={() => templateInput.current.click()}
          onAddPhotos={addPhotos}
          onSelectPhoto={(id) => update((d) => ({ ...d, selectedPhotoId: id }))}
          onRemovePhoto={() =>
            update((d) => {
              const photos = d.photos.filter((p) => p.id !== photo.id);
              return { ...d, photos, selectedPhotoId: photos[0]?.id ?? null };
            })
          }
        />
        <CanvasEditor
          photo={photo}
          size={doc.size}
          fit={doc.fit}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onPatch={patchLayer}
          onAddPhotos={addPhotos}
          onReady={canvasReady}
          notify={notify}
          fontRevision={fontOptions.length}
        />
        <Inspector
          photo={photo}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onAdd={addLayer}
          onCopy={copyLayer}
          onDelete={deleteLayer}
          onReorder={reorderLayer}
          onPatch={patchLayer}
          fonts={fontOptions}
          favorites={doc.favorites}
          onCenter={centerLayer}
          onFavorite={(family) =>
            update((d) => ({
              ...d,
              favorites: d.favorites.includes(family)
                ? d.favorites.filter((f) => f !== family)
                : [...d.favorites, family],
            }))
          }
          onUploadFont={() => fontInput.current.click()}
          onLocalFonts={async () => {
            try {
              const fonts = await readLocalFonts();
              setFontOptions((old) => [
                ...old.filter((f) => !f.family.startsWith("LocalFont-")),
                ...fonts,
              ]);
              notify(`已读取 ${fonts.length} 个字体样式`);
            } catch (error) {
              notify(error.message);
            }
          }}
          doc={doc}
          onFit={(fit) => update((d) => ({ ...d, fit }))}
        />
      </div>
      <input
        ref={fileInput}
        type="file"
        hidden
        multiple
        accept="image/png,image/jpeg,image/webp,image/avif,image/gif,image/bmp"
        aria-label="添加图片文件"
        onChange={(e) => {
          void addPhotos(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={templateInput}
        type="file"
        hidden
        accept=".json"
        aria-label="导入模板文件"
        onChange={(e) => {
          void importFile(e.target.files[0]);
          e.target.value = "";
        }}
      />
      <input
        ref={fontInput}
        type="file"
        hidden
        multiple
        accept=".ttf,.otf,.woff,.woff2"
        aria-label="导入字体文件"
        onChange={(e) => {
          void importFonts(e.target.files);
          e.target.value = "";
        }}
      />
      {dialog?.type === "export" && (
        <ExportDialog
          size={doc.size}
          onSize={(size) => update((d) => ({ ...d, size }))}
          photoCount={doc.photos.length}
          onClose={() => setDialog(null)}
          onExport={exportImages}
          busy={busy}
          progress={progress}
          result={exportResult}
          message={exportMessage}
        />
      )}
      {dialog && dialog.type !== "export" && (
        <Modal
          title={dialog.type === "rename-template" ? "重命名模板" : "保存模板"}
          onClose={() => !busy && setDialog(null)}
        >
          <form onSubmit={confirmTemplate}>
            <label className="stacked-field">
              模板名称
              <input
                autoFocus
                aria-label="模板名称"
                value={name}
                maxLength={80}
                required
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <button
              className="button primary full-width"
              type="submit"
              disabled={busy || !name.trim()}
            >
              保存
            </button>
          </form>
        </Modal>
      )}
      {toast && (
        <div className="toast" role="status">
          <span>{toast}</span>
          <IconButton icon={X} label="关闭提示" onClick={() => setToast("")} />
        </div>
      )}
    </div>
  );
}
