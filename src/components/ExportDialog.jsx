import { useState } from "react";
import { Download, Files } from "lucide-react";
import { Modal, NumberField } from "./Controls";
import { sizes } from "../model";

export function ExportDialog({
  size,
  onSize,
  photoCount,
  onExport,
  onClose,
  busy,
  progress,
  result,
  message,
}) {
  const [format, setFormat] = useState("png");
  const [quality, setQuality] = useState(95);
  const [custom, setCustom] = useState(
    !sizes.some((s) => s.join("x") === size.join("x")),
  );
  return (
    <Modal title="导出封面" onClose={() => !busy && onClose()}>
      <fieldset disabled={busy}>
        <label className="stacked-field">
          导出尺寸
          <select
            aria-label="导出尺寸"
            value={custom ? "custom" : size.join("x")}
            onChange={(e) => {
              setCustom(e.target.value === "custom");
              if (e.target.value !== "custom")
                onSize(e.target.value.split("x").map(Number));
            }}
          >
            {sizes.map((s) => (
              <option key={s.join("x")} value={s.join("x")}>
                {s[0]} × {s[1]}
              </option>
            ))}
            <option value="custom">自定义尺寸</option>
          </select>
        </label>
        {custom && (
          <div className="custom-size">
            <NumberField
              label="宽度"
              value={size[0]}
              min={120}
              max={4096}
              onChange={(v) => onSize([v, size[1]])}
            />
            <NumberField
              label="高度"
              value={size[1]}
              min={120}
              max={4096}
              onChange={(v) => onSize([size[0], v])}
            />
          </div>
        )}
        <label className="stacked-field">
          输出格式
          <select
            aria-label="输出格式"
            value={format}
            onChange={(e) => setFormat(e.target.value)}
          >
            <option value="png">PNG</option>
            <option value="jpeg">JPG</option>
            <option value="webp">WebP</option>
          </select>
        </label>
        {format !== "png" && (
          <NumberField
            label="画质"
            value={quality}
            min={10}
            max={100}
            unit="%"
            onChange={setQuality}
            range
          />
        )}
        <div className="export-actions">
          <button
            className="button primary"
            onClick={() => onExport(false, format, quality / 100)}
          >
            <Download size={17} />
            导出当前封面
          </button>
          <button
            className="button"
            onClick={() => onExport(true, format, quality / 100)}
          >
            <Files size={17} />
            批量套用导出 · {photoCount} 张
          </button>
        </div>
      </fieldset>
      {busy && (
        <div className="export-progress">
          <progress value={progress} max="100" />
          <span>{Math.round(progress)}%</span>
        </div>
      )}
      {message && (
        <p className="export-message" role="status">
          {message}
        </p>
      )}
      {result && (
        <div className="export-result">
          {result.preview && <img src={result.url} alt="导出的封面预览" />}
          <a
            className="button full-width"
            href={result.url}
            download={result.name}
          >
            <Download size={16} />
            下载{result.preview ? "封面图片" : "封面合集"}
          </a>
        </div>
      )}
    </Modal>
  );
}
