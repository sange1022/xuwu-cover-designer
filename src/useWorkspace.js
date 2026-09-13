import { useCallback, useEffect, useRef, useState } from "react";
import { get, set } from "idb-keyval";
import { initialDocument } from "./model";

export function useWorkspace(notify) {
  const [doc, setDoc] = useState(initialDocument);
  const [ready, setReady] = useState(false);
  const [saved, setSaved] = useState(false);
  const [, historyTick] = useState(0);
  const current = useRef(doc);
  const history = useRef({ past: [], future: [], key: "", time: 0 });
  useEffect(() => {
    let active = true;
    get("xuwu-workspace-v1")
      .then((stored) => {
        if (!active) return;
        if (stored?.version === 1 && Array.isArray(stored.photos)) {
          current.current = stored;
          setDoc(stored);
        }
      })
      .catch(() => notify("本地存储不可用，请及时导出作品"))
      .finally(() => active && setReady(true));
    return () => {
      active = false;
    };
  }, [notify]);
  useEffect(() => {
    if (!ready) return;
    setSaved(false);
    const timer = setTimeout(() => {
      set("xuwu-workspace-v1", doc)
        .then(() => setSaved(true))
        .catch(() => notify("保存失败，可能是浏览器存储空间不足，请导出备份"));
    }, 500);
    return () => clearTimeout(timer);
  }, [doc, ready, notify]);
  const update = useCallback((fn, key = "") => {
    const before = current.current;
    const next = fn(before);
    if (before === next) return;
    const h = history.current;
    if (!key || key !== h.key || Date.now() - h.time > 500) {
      h.past.push(before);
      if (h.past.length > 40) h.past.shift();
    }
    h.key = key;
    h.time = Date.now();
    h.future = [];
    current.current = next;
    setDoc(next);
  }, []);
  const travel = useCallback((direction) => {
    const h = history.current;
    const source = direction === "undo" ? h.past : h.future;
    const target = direction === "undo" ? h.future : h.past;
    if (!source.length) return;
    target.push(current.current);
    const next = source.pop();
    h.key = "";
    current.current = next;
    setDoc(next);
    historyTick((n) => n + 1);
  }, []);
  return {
    doc,
    update,
    ready,
    saved,
    undo: () => travel("undo"),
    redo: () => travel("redo"),
    canUndo: !!history.current.past.length,
    canRedo: !!history.current.future.length,
  };
}
