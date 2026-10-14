// Syntax highlighting for code snippets. Loaded lazily (see hooks/useRichText) so the
// highlighter and its grammars stay out of the main bundle.
import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import c from "highlight.js/lib/languages/c";
import cpp from "highlight.js/lib/languages/cpp";
import css from "highlight.js/lib/languages/css";
import go from "highlight.js/lib/languages/go";
import java from "highlight.js/lib/languages/java";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import python from "highlight.js/lib/languages/python";
import rust from "highlight.js/lib/languages/rust";
import sql from "highlight.js/lib/languages/sql";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";

Object.entries({ bash, c, cpp, css, go, java, javascript, json, python, rust, sql, typescript, xml }).forEach(([name, grammar]) => hljs.registerLanguage(name, grammar));
hljs.registerAliases(["js", "jsx", "mjs", "cjs"], { languageName: "javascript" });
hljs.registerAliases(["ts", "tsx"], { languageName: "typescript" });
hljs.registerAliases(["html", "svg"], { languageName: "xml" });
hljs.registerAliases(["sh", "shell", "zsh"], { languageName: "bash" });
hljs.registerAliases(["py"], { languageName: "python" });
hljs.registerAliases(["c++"], { languageName: "cpp" });

/**
 * Returns highlighted HTML for `source`, or null for an unknown language. highlight.js escapes
 * the source itself, and its output only contains `<span class="hljs-…">` wrappers.
 */
export const highlight = (source, language) => {
  if (!language || !hljs.getLanguage(language)) return null;
  return hljs.highlight(source, { language, ignoreIllegals: true }).value;
};
