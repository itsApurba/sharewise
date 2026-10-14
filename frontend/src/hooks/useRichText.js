import { useEffect, useState } from "react";

// Rich lesson text: the lazily loaded syntax highlighter.
let highlighter;
const loadHighlighter = () => (highlighter ??= import("../lib/highlight").then((module) => module.highlight));

/**
 * Highlighted HTML for a code snippet, or null while the highlighter loads (and for plain
 * text or an unknown language), so callers render the plain source until then.
 */
export const useHighlightedCode = (source, language) => {
  const [result, setResult] = useState(null);
  const wanted = language && language !== "text";

  useEffect(() => {
    if (!wanted) return undefined;
    let live = true;
    loadHighlighter()
      .then((highlight) => live && setResult({ source, language, html: highlight(source, language) }))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [source, language, wanted]);

  return wanted && result?.source === source && result?.language === language ? result.html : null;
};

/** Copies text to the clipboard and reports `copied` for a moment afterwards. */
export const useCopy = (resetMs = 1500) => {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return undefined;
    const timer = setTimeout(() => setCopied(false), resetMs);
    return () => clearTimeout(timer);
  }, [copied, resetMs]);
  const copy = async (text) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
  };
  return { copied, copy };
};
