import { useEffect, useState } from "react";
import {
  Plus,
  Trash2,
  Upload,
  Download,
  Pencil,
  Check,
  Save,
  FileImage,
  Search,
} from "lucide-react";
import { IconButton } from "./Controls";
import { presets } from "../model";
import { renderCover } from "../render";

function TemplateThumb({ template }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    let alive = true;
    let url;
    renderCover({
      src: template.background || `${import.meta.env.BASE_URL}demo.jpg`,
      layers: template.layers,
      size: template.size,
      fit: template.fit,
      thumbnail: true,
      format: "jpeg",
    })
      .then((blob) => {
        url = URL.createObjectURL(blob);
        if (alive) setSrc(url);
        else URL.revokeObjectURL(url);
      })
      .catch(() => {});
    return () => {
      alive = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [template]);
  return src ? (
    <img src={src} alt={`${template.name}版式预览`} />
  ) : (
    <div className="thumbnail-loading" aria-label="正在生成模板预览" />
  );
}

export function Library({
  doc,
  photo,
  selectedTemplate,
  onSelectTemplate,
  onApplyTemplate,
  onSaveTemplate,
  onRenameTemplate,
  onDeleteTemplate,
  onExportTemplate,
  onImportTemplate,
  onAddPhotos,
  onSelectPhoto,
  onRemovePhoto,
}) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("小红书");
  const templates = [...presets, ...doc.templates].filter(
    (t) =>
      t.name.includes(search) &&
      (category === "全部" || t.category === category),
  );
  return (
    <aside className="library panel" aria-label="图片与模板">
      <section className="photos-section">
        <div className="section-heading">
          <h2>
            图片列表 <span>{doc.photos.length}</span>
          </h2>
          <IconButton
            icon={Trash2}
            label="移除当前图片"
            disabled={!photo}
            onClick={onRemovePhoto}
          />
        </div>
        <button
          className="button subtle full-width"
          onClick={() => onAddPhotos()}
        >
          <Plus size={17} />
          添加图片
        </button>
        <div className="photo-list">
          {doc.photos.map((p) => (
            <button
              key={p.id}
              className={`photo-item ${p.id === photo?.id ? "selected" : ""}`}
              title={p.name}
              onClick={() => onSelectPhoto(p.id)}
            >
              <img src={p.src} alt={p.name} />
              <span className="photo-caption">
                <strong>{p.name}</strong>
                <small>
                  {p.width} × {p.height}
                </small>
              </span>
              {p.id === photo?.id && (
                <Check size={15} className="photo-check" />
              )}
            </button>
          ))}
        </div>
      </section>
      <section className="templates-section">
        <div className="section-heading">
          <h2>模板列表</h2>
          <div className="icon-row">
            <IconButton
              icon={Upload}
              label="导入模板"
              onClick={onImportTemplate}
            />
            <IconButton
              icon={Download}
              label="导出选中模板"
              disabled={!selectedTemplate}
              onClick={onExportTemplate}
            />
          </div>
        </div>
        <div className="template-actions">
          <button
            className="button"
            disabled={!photo}
            onClick={() => onSaveTemplate("text")}
          >
            <Save size={14} />
            保存文字
          </button>
          <button
            className="button"
            disabled={!photo}
            onClick={() => onSaveTemplate("full")}
          >
            <FileImage size={14} />
            保存完整
          </button>
        </div>
        <div className="template-apply-row">
          <button
            className="button"
            disabled={!selectedTemplate || !photo}
            onClick={() => onApplyTemplate(selectedTemplate)}
          >
            套用选中模板
          </button>
          <IconButton
            icon={Pencil}
            label="重命名模板"
            disabled={!selectedTemplate || selectedTemplate.builtin}
            onClick={onRenameTemplate}
          />
          <IconButton
            icon={Trash2}
            label="删除模板"
            disabled={!selectedTemplate || selectedTemplate.builtin}
            onClick={onDeleteTemplate}
          />
        </div>
        <div className="search-field">
          <Search size={15} />
          <input
            aria-label="搜索模板"
            placeholder="搜索模板"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="category-tabs" role="tablist" aria-label="模板分类">
          {["小红书", "全部", "建筑", "杂志", "简约", "醒目", "我的"].map(
            (name) => (
              <button
                key={name}
                role="tab"
                aria-selected={category === name}
                onClick={() => setCategory(name)}
              >
                {name}
              </button>
            ),
          )}
        </div>
        <div className="template-grid">
          {templates.map((t) => (
            <button
              key={t.id}
              className={`template-card ${selectedTemplate?.id === t.id ? "selected" : ""}`}
              onClick={() => onSelectTemplate(t)}
              onDoubleClick={() => photo && onApplyTemplate(t)}
              title={t.name}
            >
              <TemplateThumb template={t} />
              <span>{t.name}</span>
            </button>
          ))}
        </div>
        {!templates.length && <p className="empty-label">暂无模板</p>}
      </section>
    </aside>
  );
}
