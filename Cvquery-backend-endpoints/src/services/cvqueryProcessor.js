/**
 * CVQuery Processor
 * Parses CVQuery templates and fills them with CV JSON data.
 *
 * Syntax supported:
 *  - Field access:  $.name  $.contact.email  $.expprof.pubs.pub
 *  - Iteration:     ($.path.to.array, [[field, ASC|DESC]]) => { template }
 *  - Dynamic JS:    /-- expression --/
 *  - Escape chars:  \n  (newline)   \  (literal space)
 *  - Query blocks:  /** ... *\/  (wraps the whole template)
 */

/**
 * Resolve a dot-path from root object.
 * $.contact.email -> data["contact"]["email"]
 */
function resolvePath(data, path) {
  const clean = path.replace(/^\$\.?/, "");
  if (!clean) return data;
  return clean.split(".").reduce((acc, key) => {
    if (acc == null) return undefined;
    return acc[key];
  }, data);
}

/**
 * Sort an array by a field with direction ASC or DESC.
 */
function sortArray(arr, field, direction = "ASC") {
  return [...arr].sort((a, b) => {
    const va = a[field];
    const vb = b[field];
    if (va == null && vb == null) return 0;
    if (va == null) return 1;
    if (vb == null) return -1;
    const cmp = va < vb ? -1 : va > vb ? 1 : 0;
    return direction.toUpperCase() === "DESC" ? -cmp : cmp;
  });
}

/**
 * Parse the sort spec [[field, DIR], [field2, DIR2], ...]
 */
function parseSortSpec(raw) {
  const specs = [];
  const re = /\[\s*['"]?(\w+)['"]?\s*,\s*['"]?(ASC|DESC)['"]?\s*\]/gi;
  let m;
  while ((m = re.exec(raw)) !== null) {
    specs.push({ field: m[1], direction: m[2].toUpperCase() });
  }
  return specs;
}

/**
 * Evaluate dynamic JS expressions /-- expr --/
 * Provides `$` as the data root inside the expression.
 */
function evalDynamic(expr, data) {
  try {
    const fn = new Function("$", `return (${expr.trim()})`);
    return String(fn(data) ?? "");
  } catch (e) {
    return `[ERR: ${e.message}]`;
  }
}

/**
 * Process a single template block against data.
 */
function processTemplate(template, data) {
  let result = template;

  // 1. Process iteration blocks:
  //    ($.path, [[field, DIR]]) => { body }
  const iterRe =
    /\(\s*(\$[\w.$]*)\s*,\s*(\[\[.*?\]\])\s*\)\s*=>\s*\{([\s\S]*?)\}/g;
  result = result.replace(iterRe, (_, pathExpr, sortRaw, body) => {
    const arr = resolvePath(data, pathExpr);
    if (!Array.isArray(arr)) return "";

    const sortSpecs = parseSortSpec(sortRaw);
    let sorted = arr;
    for (const spec of sortSpecs.reverse()) {
      sorted = sortArray(sorted, spec.field, spec.direction);
    }

    return sorted
      .map((item) => processTemplate(body, { ...data, $item: item, ...item }))
      .join("");
  });

  // 2. Dynamic JS /-- expr --/
  result = result.replace(/\/--\s*([\s\S]*?)\s*--\//g, (_, expr) =>
    evalDynamic(expr, data)
  );

  // 3. Mustache-style fields {{name}} or {{contact.email}}
  result = result.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, path) => {
    const val = resolvePath(data, `$.${path}`);
    if (val == null) return "";
    if (typeof val === "object") return JSON.stringify(val);
    return String(val);
  });

  // 4. Field access $.path
  result = result.replace(/\$\.?([\w.]+)/g, (_, path) => {
    const val = resolvePath(data, `$.${path}`);
    if (val == null) return "";
    if (typeof val === "object") return JSON.stringify(val);
    return String(val);
  });

  // 5. Escape sequences
  result = result.replace(/\\n/g, "\n");
  result = result.replace(/\\ /g, " ");

  return result;
}

/**
 * Main entry point.
 * @param {object} cvData   - The CV JSON object
 * @param {string} template - Raw CVQuery template (with or without /** **\/ wrapper)
 * @param {string} format   - "text" | "html" | "latex" | "markdown"
 */
function processCV(cvData, template, format = "text") {
  // Strip /** ... **/ wrapper if present
  const inner = template
    .replace(/^\/\*\*[\s\S]*?\n/, "")
    .replace(/\n\s*\*\*\/\s*$/, "")
    .trim();

  const raw = processTemplate(inner, cvData);

  switch (format.toLowerCase()) {
    case "html":
      return `<div class="cvquery-output">${raw
        .split("\n")
        .map((l) => `<p>${l}</p>`)
        .join("")}</div>`;

    case "latex":
      return raw
        .replace(/&/g, "\\&")
        .replace(/%/g, "\\%")
        .replace(/_/g, "\\_")
        .replace(/\^/g, "\\^{}")
        .replace(/#/g, "\\#");

    case "markdown":
      return raw;

    case "text":
    default:
      return raw;
  }
}
const Handlebars = require('handlebars');

/**
 * Processa um template Handlebars completo com os dados do CV.
 * Deteta automaticamente se o template é Handlebars (contém {{...}} ou {{#...}})
 * ou se é CVQuery (contém $. ou ($.) ) e usa o processador adequado.
 * 
 * @param {object} cvData   - Dados do CV
 * @param {string} template - Template (Handlebars ou CVQuery)
 * @param {string} format   - "html" | "latex" | "markdown" | "text"
 * @returns {string}        - Template processado
 */
/**
 * Strip the `$.` prefix that the template editor adds to Handlebars paths.
 * {{#each $.experience}} → {{#each experience}}
 * {{#if $.field}}        → {{#if field}}
 * {{$.contact.email}}   → {{contact.email}}
 * This makes the hybrid syntax the editor produces valid for the Handlebars engine.
 */
function normalizeHandlebarsTemplate(template) {
  return template
    .replace(/\{\{#each\s+\$\.([\w.]+)\}\}/g, '{{#each $1}}')
    .replace(/\{\{#if\s+\$\.([\w.]+)\}\}/g,   '{{#if $1}}')
    .replace(/\{\{\$\.([\w.]+)\}\}/g,           '{{$1}}');
}

function processWithHandlebars(cvData, template, format = 'text') {
  const hasHandlebarsBlocks = /\{\{[#/]/.test(template);
  const hasCVQuerySyntax    = /\$\./.test(template) || /\(\s*\$/.test(template);

  // Pure CVQuery syntax (no Handlebars block tags) — use CVQuery processor
  if (hasCVQuerySyntax && !hasHandlebarsBlocks) {
    return processCV(cvData, template, format);
  }

  // Handlebars (with or without $.  prefixes) — normalize then compile
  if (hasHandlebarsBlocks) {
    try {
      const normalized = normalizeHandlebarsTemplate(template);
      const compiled   = Handlebars.compile(normalized);
      const result     = compiled(cvData);
      return format.toLowerCase() === 'text'
        ? result.replace(/<[^>]*>/g, '')
        : result;
    } catch (err) {
      console.error('Erro Handlebars:', err.message);
      return processCV(cvData, template, format);
    }
  }

  return processCV(cvData, template, format);
}

module.exports = { processCV, processWithHandlebars };
