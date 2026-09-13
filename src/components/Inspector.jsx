import { useEffect, useState } from "react";
import {
  Plus,
  Copy,
  Trash2,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Type,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignHorizontalJustifyCenter,
  AlignVerticalJustifyCenter,
  RotateCcw,
  Star,
  Upload,
  Monitor,
} from "lucide-react";
import { IconButton, NumberField } from "./Controls";
import { normalizeColor, palette } from "../model";

function ColorField({ value, onChange }) {
  const argb =
    value.length === 9 ? `#${value.slice(7)}${value.slice(1, 7)}` : value;
  const [draft, setDraft] = useState(argb);
  const [error, setError] = useState(false);
  useEffect(() => {
    setDraft(argb);
    setError(false);
  }, [argb]);
  const commit = () => {
    try {
      onChange(normalizeColor(draft));
      setError(false);
    } catch {
      setError(true);
    }
  };
  return (
    <>
      <div className="color-input-row">
        <input
          type="color"
          aria-label="自定义文字颜色"
          value={value.slice(0, 7)}
          onChange={(e) => onChange(e.target.value)}
        />
        <input
          aria-label="颜色代码"
          value={draft}
          maxLength={9}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
          }}
          aria-invalid={error}
        />
      </div>
      {error && <p className="field-error">请输入 #RRGGBB 或 #AARRGGBB</p>}
    </>
  );
}

export function Inspector({
  photo,
  selectedId,
  onSelect,
  onAdd,
  onCopy,
  onDelete,
  onReorder,
  onPatch,
  fonts,
  favorites,
  onFavorite,
  onUploadFont,
  onLocalFonts,
  onCenter,
  doc,
  onFit,
}) {
  const layer = photo?.layers.find((l) => l.id === selectedId);
  const patch = (changes) => onPatch(selectedId, changes);
  const favoriteFonts = fonts.filter((f) => favorites.includes(f.family));
  return (
    <aside className="inspector panel" aria-label="文字设置">
      <section>
        <div className="section-heading">
          <h2>文字层</h2>
          <div className="icon-row">
            <IconButton
              icon={Plus}
              label="添加文字"
              onClick={onAdd}
              disabled={!photo}
            />
            <IconButton
              icon={Copy}
              label="复制文字"
              onClick={onCopy}
              disabled={!layer}
            />
            <IconButton
              icon={Trash2}
              label="删除文字"
              onClick={onDelete}
              disabled={!layer}
            />
          </div>
        </div>
        <div className="layer-list">
          {[...(photo?.layers || [])].reverse().map((l) => (
            <div
              key={l.id}
              className={`layer-row ${l.id === selectedId ? "selected" : ""}`}
            >
              <IconButton
                icon={l.visible ? Eye : EyeOff}
                label={`${l.visible ? "隐藏" : "显示"} ${l.text}`}
                onClick={() => onPatch(l.id, { visible: !l.visible })}
              />
              <button
                className="layer-name"
                title={l.text}
                onClick={() => onSelect(l.id)}
              >
                <Type size={15} />
                <span>{l.text || "空文字层"}</span>
              </button>
            </div>
          ))}
        </div>
        <div className="layer-order">
          <IconButton
            icon={ArrowUp}
            label="文字上移一层"
            disabled={!layer}
            onClick={() => onReorder(1)}
          />
          <IconButton
            icon={ArrowDown}
            label="文字下移一层"
            disabled={!layer}
            onClick={() => onReorder(-1)}
          />
        </div>
      </section>
      {layer ? (
        <>
          <section className="text-properties">
            <label className="stacked-field">
              文字内容
              <textarea
                aria-label="文字内容"
                value={layer.text}
                maxLength={10000}
                onChange={(e) => patch({ text: e.target.value })}
              />
            </label>
            <label className="select-field">
              <span>字体</span>
              <select
                aria-label="字体"
                title={
                  fonts.find((f) => f.family === layer.fontFamily)?.name ||
                  layer.fontFamily
                }
                value={layer.fontFamily}
                onChange={(e) => patch({ fontFamily: e.target.value })}
              >
                {!fonts.some((f) => f.family === layer.fontFamily) && (
                  <option value={layer.fontFamily}>{layer.fontFamily}</option>
                )}
                {favoriteFonts.length > 0 && (
                  <optgroup label="常用字体">
                    {favoriteFonts.map((f) => (
                      <option key={f.family} value={f.family}>
                        {f.name}
                      </option>
                    ))}
                  </optgroup>
                )}
                <optgroup label="全部字体">
                  {fonts.map((f) => (
                    <option key={f.family} value={f.family}>
                      {f.name}
                    </option>
                  ))}
                </optgroup>
              </select>
            </label>
            <div className="font-actions">
              <IconButton
                icon={Star}
                label="收藏当前字体"
                active={favorites.includes(layer.fontFamily)}
                onClick={() => onFavorite(layer.fontFamily)}
              />
              <button className="text-button" onClick={onUploadFont}>
                <Upload size={14} />
                导入字体
              </button>
              <IconButton
                icon={Monitor}
                label="读取系统字体（支持的浏览器需授权）"
                onClick={onLocalFonts}
              />
            </div>
            <div className="weight-row">
              <label className="select-field">
                <span>字重</span>
                <select
                  aria-label="字重"
                  value={layer.fontWeight}
                  onChange={(e) => patch({ fontWeight: +e.target.value })}
                >
                  {[
                    [100, "极细"],
                    [200, "纤细"],
                    [300, "细体"],
                    [400, "常规"],
                    [500, "中等"],
                    [600, "半粗"],
                    [700, "粗体"],
                    [800, "特粗"],
                    [900, "重黑"],
                  ].map(([n, text]) => (
                    <option key={n} value={n}>
                      {text} · {n}
                    </option>
                  ))}
                </select>
              </label>
              <IconButton
                icon={Italic}
                label="斜体"
                active={layer.italic}
                onClick={() => patch({ italic: !layer.italic })}
              />
            </div>
            <NumberField
              label="字号"
              value={layer.fontSize}
              min={1}
              max={2000}
              onChange={(fontSize) => patch({ fontSize })}
              range
            />
            <NumberField
              label="旋转"
              value={layer.rotation}
              min={-360}
              max={360}
              unit="°"
              onChange={(rotation) => patch({ rotation })}
              range
            />
            <div className="align-row">
              <span className="field-label">对齐</span>
              <div className="segmented">
                {[
                  [AlignLeft, "left", "左对齐"],
                  [AlignCenter, "center", "居中对齐"],
                  [AlignRight, "right", "右对齐"],
                ].map(([Icon, value, label]) => (
                  <IconButton
                    key={value}
                    icon={Icon}
                    label={label}
                    active={layer.align === value}
                    onClick={() => patch({ align: value })}
                  />
                ))}
              </div>
              <IconButton
                icon={RotateCcw}
                label="重置角度"
                onClick={() => patch({ rotation: 0 })}
              />
            </div>
            <div className="align-row">
              <span className="field-label">位置</span>
              <div className="segmented">
                <IconButton
                  icon={AlignHorizontalJustifyCenter}
                  label="画布水平居中"
                  onClick={() => onCenter("horizontal")}
                />
                <IconButton
                  icon={AlignVerticalJustifyCenter}
                  label="画布垂直居中"
                  onClick={() => onCenter("vertical")}
                />
              </div>
            </div>
          </section>
          <section>
            <h3>文字颜色</h3>
            <ColorField
              value={layer.color}
              onChange={(color) => patch({ color })}
            />
            <div className="swatches">
              {[...palette.slice(20), ...palette.slice(0, 20)].map(
                ([name, color]) => (
                  <button
                    key={name}
                    aria-label={name}
                    title={name}
                    className={`swatch ${layer.color.slice(0, 7).toUpperCase() === color ? "active" : ""}`}
                    style={{ backgroundColor: color }}
                    onClick={() => patch({ color })}
                  />
                ),
              )}
            </div>
            <NumberField
              label="透明度"
              value={Math.round(layer.opacity * 100)}
              min={0}
              max={100}
              unit="%"
              onChange={(opacity) => patch({ opacity: opacity / 100 })}
              range
            />
          </section>
          <section>
            <h3>文字效果</h3>
            <NumberField
              label="描边"
              value={layer.stroke}
              min={0}
              max={100}
              unit="px"
              onChange={(stroke) => patch({ stroke })}
              range
            />
            <label className="effect-color">
              描边颜色
              <input
                aria-label="描边颜色"
                type="color"
                value={layer.strokeColor}
                onChange={(e) => patch({ strokeColor: e.target.value })}
              />
            </label>
            <label className="toggle-row">
              <span>阴影</span>
              <input
                type="checkbox"
                role="switch"
                aria-label="启用阴影"
                checked={layer.shadow}
                onChange={(e) => patch({ shadow: e.target.checked })}
              />
            </label>
            {layer.shadow && (
              <div className="shadow-fields">
                <NumberField
                  label="阴影 X"
                  value={layer.shadowX}
                  min={-1000}
                  max={1000}
                  onChange={(shadowX) => patch({ shadowX })}
                />
                <NumberField
                  label="阴影 Y"
                  value={layer.shadowY}
                  min={-1000}
                  max={1000}
                  onChange={(shadowY) => patch({ shadowY })}
                />
                <NumberField
                  label="模糊"
                  value={layer.shadowBlur}
                  min={0}
                  max={100}
                  onChange={(shadowBlur) => patch({ shadowBlur })}
                />
              </div>
            )}
          </section>
        </>
      ) : (
        <section>
          <button
            className="button full-width"
            disabled={!photo}
            onClick={onAdd}
          >
            <Plus size={16} />
            添加文字
          </button>
        </section>
      )}
      <section>
        <h3>图片适配</h3>
        <select
          aria-label="图片适配"
          value={doc.fit}
          onChange={(e) => onFit(e.target.value)}
        >
          <option value="cover">铺满画布</option>
          <option value="contain">完整显示</option>
        </select>
      </section>
    </aside>
  );
}
