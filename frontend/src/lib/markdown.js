// A small, safe markdown subset for lesson bodies. It parses to plain data that React renders,
// so raw HTML in a lesson is only ever shown as text. Supported: paragraphs (line breaks kept),
// - / 1. lists, ``` fenced code, **bold**, *italic*, `inline code`, [links](https://…) and bare
// http(s) URLs. Anything else is literal text.

const FENCE = /^\s*```\s*([\w+#.-]*)\s*$/;
const BULLET = /^\s*[-*+]\s+(.*)$/;
const ORDERED = /^\s*(\d{1,9})[.)]\s+(.*)$/;
const CONTINUATION = /^\s{2,}\S/;

/** Only http(s) links are rendered as links; javascript:, data: and the like stay text. */
export const safeHref = (url) => {
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.href : null;
  } catch {
    return null;
  }
};

/** Splits markdown into blocks: `{ type: "paragraph", text }`, `{ type: "list", ordered, start, items }`, `{ type: "code", language, source }`. */
export const parseBlocks = (source = "") => {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const fence = line.match(FENCE);
    if (fence) {
      const body = [];
      i += 1;
      while (i < lines.length && !/^\s*```\s*$/.test(lines[i])) body.push(lines[i++]);
      i += 1;
      blocks.push({ type: "code", language: fence[1].toLowerCase() || "text", source: body.join("\n").replace(/\s+$/, "") });
      continue;
    }
    if (!line.trim()) {
      i += 1;
      continue;
    }
    const bullet = line.match(BULLET);
    const ordered = !bullet && line.match(ORDERED);
    if (bullet || ordered) {
      const isOrdered = Boolean(ordered);
      const items = [];
      while (i < lines.length) {
        const match = isOrdered ? lines[i].match(ORDERED) : lines[i].match(BULLET);
        if (match) items.push(isOrdered ? match[2] : match[1]);
        else if (items.length && CONTINUATION.test(lines[i])) items[items.length - 1] += `\n${lines[i].trim()}`;
        else break;
        i += 1;
      }
      blocks.push({ type: "list", ordered: isOrdered, start: isOrdered ? Number(ordered[1]) : 1, items });
      continue;
    }
    const text = [];
    while (i < lines.length && lines[i].trim() && !FENCE.test(lines[i]) && !BULLET.test(lines[i]) && !ORDERED.test(lines[i])) text.push(lines[i++]);
    blocks.push({ type: "paragraph", text: text.join("\n") });
  }
  return blocks;
};

const URL_RE = /^https?:\/\/[^\s<>()]+[^\s<>().,;:!?'"]/;
const EMPHASIS = [
  ["**", "strong"],
  ["__", "strong"],
  ["*", "em"],
  ["_", "em"],
];

/** Finds the closing delimiter for emphasis that opened at `from`; it must hug non-space text. */
const findClose = (text, delim, from) => {
  let at = text.indexOf(delim, from);
  while (at !== -1) {
    const before = text[at - 1];
    const after = text[at + delim.length];
    const wordAfter = delim[0] === "_" && after && /\w/.test(after);
    if (at > from && before && !/\s/.test(before) && !wordAfter && !(delim.length === 1 && after === delim)) return at;
    at = text.indexOf(delim, at + 1);
  }
  return -1;
};

/**
 * Parses inline markdown into nodes: strings, `{ type: "code", text }`,
 * `{ type: "strong" | "em", children }` and `{ type: "link", href, children }`.
 */
export const parseInline = (text, { links = true } = {}) => {
  const nodes = [];
  let plain = "";
  const flush = () => {
    if (plain) nodes.push(plain);
    plain = "";
  };
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    const rest = text.slice(i);

    if (ch === "\\" && /[\\`*_[\]()#+\-.!>]/.test(text[i + 1] ?? "")) {
      plain += text[i + 1];
      i += 2;
      continue;
    }

    if (ch === "`") {
      const run = rest.match(/^`+/)[0];
      const close = text.indexOf(run, i + run.length);
      if (close !== -1) {
        flush();
        nodes.push({ type: "code", text: text.slice(i + run.length, close).replace(/^ (.+) $/, "$1") });
        i = close + run.length;
        continue;
      }
      plain += run;
      i += run.length;
      continue;
    }

    if (links && ch === "[") {
      const link = rest.match(/^\[([^\]\n]+)\]\(\s*(\S+?)\s*\)/);
      const href = link && safeHref(link[2]);
      if (href) {
        flush();
        nodes.push({ type: "link", href, children: parseInline(link[1], { links: false }) });
        i += link[0].length;
        continue;
      }
    }

    if (links && (ch === "h" || ch === "H") && (i === 0 || /[\s(]/.test(text[i - 1]))) {
      const url = rest.match(URL_RE);
      const href = url && safeHref(url[0]);
      if (href) {
        flush();
        nodes.push({ type: "link", href, children: [url[0]] });
        i += url[0].length;
        continue;
      }
    }

    const emphasis = EMPHASIS.find(([delim]) => rest.startsWith(delim));
    if (emphasis) {
      const [delim, type] = emphasis;
      const opensWord = !/\s/.test(text[i + delim.length] ?? " ") && !(delim[0] === "_" && /\w/.test(text[i - 1] ?? ""));
      const close = opensWord ? findClose(text, delim, i + delim.length) : -1;
      if (close !== -1) {
        flush();
        nodes.push({ type, children: parseInline(text.slice(i + delim.length, close), { links }) });
        i = close + delim.length;
        continue;
      }
      plain += delim;
      i += delim.length;
      continue;
    }

    plain += ch;
    i += 1;
  }
  flush();
  return nodes;
};

/** Plain text of a run of inline nodes (for length budgets and labels). */
const inlineLength = (nodes) => nodes.reduce((sum, node) => sum + (typeof node === "string" ? node.length : node.text?.length ?? inlineLength(node.children)), 0);

/** Cuts inline nodes to roughly `budget` characters, ending at a word where it can. */
const cutInline = (nodes, budget) => {
  const out = [];
  let left = budget;
  for (const node of nodes) {
    if (left <= 0) break;
    if (typeof node === "string") {
      if (node.length <= left) out.push(node);
      else {
        const slice = node.slice(0, left);
        const space = slice.lastIndexOf(" ");
        out.push(`${(space > left * 0.6 ? slice.slice(0, space) : slice).trimEnd()}…`);
      }
      left -= node.length;
    } else if (node.type === "code") {
      out.push(node);
      left -= node.text.length;
    } else {
      out.push({ ...node, children: cutInline(node.children, left) });
      left -= inlineLength(node.children);
    }
  }
  return out;
};

/**
 * Parses a lesson body into renderable blocks with inline nodes. With `limit` (characters),
 * the result is a short preview: whole blocks until the budget runs out, the last one cut,
 * code fences shortened to a few lines. `truncated` says whether anything was left out.
 */
export const parseMarkdown = (source, { limit } = {}) => {
  const blocks = parseBlocks(source).map((block) =>
    block.type === "paragraph" ? { ...block, children: parseInline(block.text) } : block.type === "list" ? { ...block, items: block.items.map((item) => parseInline(item)) } : block
  );
  if (!limit) return { blocks, truncated: false };

  const out = [];
  let left = limit;
  let truncated = false;
  for (const block of blocks) {
    if (left <= 0) {
      truncated = true;
      break;
    }
    if (block.type === "paragraph") {
      const length = inlineLength(block.children);
      out.push(length > left ? { ...block, children: cutInline(block.children, left) } : block);
      truncated ||= length > left;
      left -= length;
    } else if (block.type === "list") {
      const items = [];
      for (const item of block.items) {
        if (left <= 0) {
          truncated = true;
          break;
        }
        const length = inlineLength(item);
        items.push(length > left ? cutInline(item, left) : item);
        truncated ||= length > left;
        left -= Math.max(length, 20);
      }
      out.push({ ...block, items });
    } else {
      const lines = block.source.split("\n");
      const keep = Math.min(lines.length, 6);
      out.push(keep < lines.length ? { ...block, source: `${lines.slice(0, keep).join("\n")}\n…` } : block);
      truncated ||= keep < lines.length;
      left -= Math.min(block.source.length, 160);
    }
  }
  return { blocks: out, truncated };
};
