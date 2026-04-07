import { parseAttributes, parseLines, transformLineText, formatLineNumber, STATIC_CSS, generateDynamicCSS } from './poem-element-core.js';

function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Render a <poem-element> with Declarative Shadow DOM.
 *
 * @param {string} poemText - The raw poem text (newline-separated lines)
 * @param {object} [attrs={}] - Attributes: { numbers?, wrap?, 'numbers-layout'?, 'aria-label'? }
 *   - numbers: true or '' for default (every 5th), or a number string like '3'
 *   - wrap: true or '' for plain wrap, 'indent', or 'indent-arrow'
 *   - 'numbers-layout': 'list' or 'grid'
 *   - 'aria-label': custom accessible label (defaults to 'poem')
 * @returns {string} Complete HTML string
 */
export function renderPoemElement(poemText, attrs = {}) {
  // Normalize attrs: true/boolean -> '' (empty string for boolean attributes)
  const normalized = {
    numbers: attrs.numbers === true ? '' : (attrs.numbers ?? null),
    wrap: attrs.wrap === true ? '' : (attrs.wrap ?? null),
    'numbers-layout': attrs['numbers-layout'] ?? null,
    'numbers-position': attrs['numbers-position'] ?? null,
    'aria-label': attrs['aria-label'] ?? null,
  };

  const config = parseAttributes(normalized);
  const lines = parseLines(poemText);
  const css = STATIC_CSS + generateDynamicCSS(config.numberInterval);

  // Build outer tag attributes
  const outerAttrs = [];
  if (config.hasNumbers) {
    outerAttrs.push(normalized.numbers === '' ? 'numbers' : `numbers="${escapeHTML(normalized.numbers)}"`);
  }
  if (config.hasWrap) {
    outerAttrs.push(normalized.wrap === '' ? 'wrap' : `wrap="${escapeHTML(normalized.wrap)}"`);
  }
  if (normalized['numbers-layout']) {
    outerAttrs.push(`numbers-layout="${escapeHTML(normalized['numbers-layout'])}"`);
  }
  if (normalized['numbers-position']) {
    outerAttrs.push(`numbers-position="${escapeHTML(normalized['numbers-position'])}"`);
  }
  if (normalized['aria-label']) {
    outerAttrs.push(`aria-label="${escapeHTML(normalized['aria-label'])}"`);
  }
  const attrStr = outerAttrs.length ? ' ' + outerAttrs.join(' ') : '';

  // Build shadow DOM content
  let shadowHTML = `<style>${css}</style>`;
  shadowHTML += `<slot name="title"></slot><slot name="author"></slot>`;

  const tabindexAttr = config.hasWrap ? '' : ' tabindex="0"';
  let numbersHTML = '';
  let linesHTML = '';
  lines.forEach((line, i) => {
    if (config.useGridNumbers) {
      const num = escapeHTML(formatLineNumber(i, config.numberInterval));
      if (config.useGridSplit) {
        numbersHTML += `<span>${num}</span>`;
      } else {
        linesHTML += `<span part="line-number" aria-hidden="true">${num}</span>`;
      }
    }
    linesHTML += `<span part="line" role="none">${escapeHTML(transformLineText(line, config))}</span>`;
  });

  if (config.useGridSplit) {
    const outerClass = 'poem-grid-outer' + (config.numbersOutside ? ' poem-numbers-outside' : '');
    shadowHTML += `<div class="${outerClass}">`;
    shadowHTML += `<div part="line-numbers" aria-hidden="true">${numbersHTML}</div>`;
    shadowHTML += `<pre part="block" role="group" aria-label="${escapeHTML(config.ariaLabel)}"${tabindexAttr}>${linesHTML}</pre>`;
    shadowHTML += `</div>`;
  } else {
    shadowHTML += `<pre part="block" role="group" aria-label="${escapeHTML(config.ariaLabel)}"${tabindexAttr}>${linesHTML}</pre>`;
  }

  // Raw poem text preserved in light DOM as fallback
  const lightDOM = escapeHTML(poemText);

  return `<poem-element${attrStr}><template shadowrootmode="open">${shadowHTML}</template>${lightDOM}</poem-element>`;
}
