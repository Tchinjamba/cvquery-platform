/**
 * CVQuery Processor
 *
 * Syntax supported:
 *  - Field access:       $.name   $.contact.email
 *  - Sorted iteration:   ($.array.$alias, [[field, ASC|DESC]]) => { body }
 *  - Simple iteration:   $.array.$alias{ body }
 *  - Conditional:        $( $.field/-- cond --/ ){ true }{ false }
 *  - Dynamic JS:         /-- expression --/
 *  - Mustache:           {{field}}  {{#each arr}} {{/each}}  {{#if f}} {{/if}}
 *  - Inner blocks:       /** ... **/  (stripped and content processed)
 *  - Escapes:            \n  \\
 */

function resolvePath(data, path) {
  const clean = path.replace(/^\$\.?/, '');
  if (!clean) return data;
  return clean.split('.').reduce((acc, key) => {
    if (acc == null) return undefined;
    return acc[key];
  }, data);
}

function sortArray(arr, field, direction = 'ASC') {
  return [...arr].sort((a, b) => {
    const va = a[field], vb = b[field];
    if (va == null && vb == null) return 0;
    if (va == null) return 1;
    if (vb == null) return -1;
    const cmp = va < vb ? -1 : va > vb ? 1 : 0;
    return direction.toUpperCase() === 'DESC' ? -cmp : cmp;
  });
}

function parseSortSpec(raw) {
  const specs = [];
  const re = /\[\s*['"]?(\w+)['"]?\s*,\s*['"]?(ASC|DESC)['"]?\s*\]/gi;
  let m;
  while ((m = re.exec(raw)) !== null) specs.push({ field: m[1], direction: m[2].toUpperCase() });
  return specs;
}

function evalDynamic(expr, data) {
  try {
    const fn = new Function('$', `return (${expr.trim()})`);
    return String(fn(data) ?? '');
  } catch (e) {
    return `[ERR: ${e.message}]`;
  }
}

/**
 * Core recursive template processor.
 * Order of operations is important — iterations before conditionals so that
 * nested `{}` inside iteration bodies are resolved before the conditional
 * regex runs, avoiding bracket-mismatch issues.
 */
function processTemplate(template, data) {
  let result = template;

  // 0. Strip inner /** ... **/ markers and recursively process their content.
  //    Loop until stable so nested blocks are all resolved.
  let prev;
  do {
    prev = result;
    result = result.replace(/\/\*\*([\s\S]*?)\*\*\//g, (_, inner) =>
      processTemplate(inner.trim(), data)
    );
  } while (result !== prev);

  // 1. Sorted iteration: ($.array.$alias, [[field, DIR]]) => { body }
  //    Item alias (.$alias) is optional; falls back to $item.
  const sortedIterRe = /\(\s*(\$[\w.$]*)\s*,\s*(\[\[[\s\S]*?\]\])\s*\)\s*=>\s*\{([\s\S]*?)\}/g;
  result = result.replace(sortedIterRe, (_, pathExpr, sortRaw, body) => {
    const aliasMatch = pathExpr.match(/^(\$\.?[\w.]*?)\.\$(\w+)$/);
    const arrayPath  = aliasMatch ? aliasMatch[1] : pathExpr;
    const itemAlias  = aliasMatch ? aliasMatch[2] : null;
    const arr = resolvePath(data, arrayPath);
    if (!Array.isArray(arr)) return '';
    const specs = parseSortSpec(sortRaw);
    let sorted = arr;
    for (const spec of specs.reverse()) sorted = sortArray(sorted, spec.field, spec.direction);
    return sorted.map(item => {
      const ctx = { ...data, $item: item, ...item };
      if (itemAlias) ctx[itemAlias] = item;
      return processTemplate(body, ctx);
    }).join('');
  });

  // 2. Simple iteration: $.array.$alias{ body }  (no sort spec)
  const simpleIterRe = /(\$\.[\w.]+\.\$\w+)\s*\{([\s\S]*?)\}/g;
  result = result.replace(simpleIterRe, (_, pathExpr, body) => {
    const aliasMatch = pathExpr.match(/^(\$\.?[\w.]*?)\.\$(\w+)$/);
    if (!aliasMatch) return '';
    const [, arrayPath, itemAlias] = aliasMatch;
    const arr = resolvePath(data, arrayPath);
    if (!Array.isArray(arr)) return '';
    return arr.map(item => {
      const ctx = { ...data, $item: item, ...item, [itemAlias]: item };
      return processTemplate(body, ctx);
    }).join('');
  });

  // 3. Conditional: $( $.field/-- cond --/ ){ trueBlock }{ falseBlock }
  //    The JS condition expression is used as a hint but field truthiness drives the decision.
  //    By this point iterations are already resolved, so no nested {} inside blocks.
  const condRe = /\$\(\s*(\$\.[\w.]+)(?:\/--[\s\S]*?--\/)?\s*\)\s*\{([\s\S]*?)\}(?:\s*\{([\s\S]*?)\})?/g;
  result = result.replace(condRe, (_, pathExpr, trueBlock, falseBlock = '') => {
    const val = resolvePath(data, pathExpr);
    const isTrue = val != null && val !== false && val !== '' &&
                   !(Array.isArray(val) && val.length === 0);
    return processTemplate(isTrue ? trueBlock : falseBlock, data);
  });

  // 4. Dynamic JS /-- expr --/
  result = result.replace(/\/--\s*([\s\S]*?)\s*--\//g, (_, expr) => evalDynamic(expr, data));

  // 5. Mustache fields {{contact.email}} etc.
  result = result.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, path) => {
    const val = resolvePath(data, `$.${path}`);
    if (val == null) return '';
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
  });

  // 6. Field access $.path  or  $path
  result = result.replace(/\$\.?([\w.]+)/g, (_, path) => {
    const val = resolvePath(data, `$.${path}`);
    if (val == null) return '';
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
  });

  // 7. Escape sequences
  result = result.replace(/\\n/g, '\n');
  result = result.replace(/\\ /g, ' ');

  return result;
}

/**
 * Process a CVQuery template (with optional /** **/ outer wrapper).
 */
function processCV(cvData, template, format = 'text') {
  const inner = template
    .replace(/^\/\*\*[\s\S]*?\n/, '')
    .replace(/\n\s*\*\*\/\s*$/, '')
    .trim();

  const raw = processTemplate(inner, cvData);

  switch (format.toLowerCase()) {
    case 'html':
      return raw;
    case 'latex':
      return raw
        .replace(/&/g, '\\&').replace(/%/g, '\\%').replace(/_/g, '\\_')
        .replace(/\^/g, '\\^{}').replace(/#/g, '\\#');
    case 'markdown':
    case 'text':
    default:
      return raw;
  }
}

/**
 * Normalize Handlebars templates that use $. prefixes in paths.
 */
function normalizeHandlebarsTemplate(template) {
  return template
    .replace(/\{\{#each\s+\$\.([\w.]+)\}\}/g, '{{#each $1}}')
    .replace(/\{\{#if\s+\$\.([\w.]+)\}\}/g,   '{{#if $1}}')
    .replace(/\{\{\$\.([\w.]+)\}\}/g,           '{{$1}}');
}

const Handlebars = require('handlebars');

/**
 * Auto-detect template dialect and process accordingly.
 * - Pure CVQuery ($.path, iterations, conditionals) → processCV
 * - Handlebars ({{#each}}, {{#if}}) → Handlebars.compile, fallback to processCV
 */
function processWithHandlebars(cvData, template, format = 'text') {
  const hasHandlebarsBlocks = /\{\{[#/]/.test(template);
  const hasCVQuerySyntax    = /\$\./.test(template) || /\(\s*\$/.test(template) || /\$\(/.test(template);

  if (hasCVQuerySyntax && !hasHandlebarsBlocks) {
    return processCV(cvData, template, format);
  }

  if (hasHandlebarsBlocks) {
    try {
      const normalized = normalizeHandlebarsTemplate(template);
      const compiled   = Handlebars.compile(normalized);
      const result     = compiled(cvData);
      return format.toLowerCase() === 'text' ? result.replace(/<[^>]*>/g, '') : result;
    } catch (err) {
      console.error('Erro Handlebars:', err.message);
      return processCV(cvData, template, format);
    }
  }

  return processCV(cvData, template, format);
}

module.exports = { processCV, processWithHandlebars };
