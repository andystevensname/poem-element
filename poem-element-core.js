/**
 * Parse poem-element attributes into a normalized config object.
 * @param {object} attrs - Raw attributes
 * @param {string|null} attrs.numbers - null if absent, '' if boolean, or a number string
 * @param {string|null} attrs.wrap - null if absent, '' if boolean, or 'indent'|'indent-arrow'
 * @param {string|null} attrs['numbers-layout'] - 'list'|'grid' or null
 * @param {string|null} attrs['numbers-position'] - 'inside'|'outside' or null
 * @param {string|null} attrs['aria-label'] - custom label or null
 * @returns {object}
 */
export function parseAttributes(attrs) {
  const hasNumbers = attrs.numbers != null;
  let numberInterval = 5;
  if (hasNumbers) {
    const val = attrs.numbers;
    if (val !== '' && !isNaN(Number(val)) && Number(val) > 0) {
      numberInterval = Number(val);
    }
  }
  const hasWrap = attrs.wrap != null;
  const numbersLayout = attrs['numbers-layout'] || 'grid';
  const useListNumbers = hasNumbers && hasWrap && numbersLayout === 'list';
  const useGridNumbers = hasNumbers && !useListNumbers;
  const numbersOutside = attrs['numbers-position'] === 'outside';
  const ariaLabel = attrs['aria-label'] || 'poem';

  return {
    hasNumbers,
    numberInterval,
    hasWrap,
    numbersLayout,
    useListNumbers,
    useGridNumbers,
    numbersOutside,
    ariaLabel,
  };
}

/**
 * Process raw poem text into trimmed lines array.
 * @param {string} raw
 * @returns {string[]}
 */
export function parseLines(raw) {
  const lines = raw.split('\n');
  const first = lines.findIndex(l => l.trim() !== '');
  if (first === -1) return [];
  let last = lines.length - 1;
  while (last > first && lines[last].trim() === '') last--;
  return lines.slice(first, last + 1);
}

/**
 * Transform a single line's text content based on config.
 * @param {string} line
 * @param {object} config - from parseAttributes
 * @returns {string}
 */
export function transformLineText(line, config) {
  if (!config.hasWrap && !config.hasNumbers) {
    let leading = '';
    const match = line.match(/^\s+/);
    if (match) {
      leading = match[0].replace(/ /g, '\u00A0').replace(/\t/g, '\u00A0\u00A0\u00A0\u00A0');
    }
    return leading + line.trimStart();
  }
  return line === '' ? '\u00A0' : line.trimEnd();
}

/**
 * Format a line number for display.
 * @param {number} index - 0-based line index
 * @param {number} interval - numbering interval
 * @returns {string} The formatted number (e.g. "5.") or NBSP for non-numbered lines
 */
export function formatLineNumber(index, interval) {
  if (interval > 0 && ((index + 1) % interval === 0)) {
    return String(index + 1) + '.';
  }
  return '\u00A0';
}

/**
 * Static CSS shared by all poem-element instances (interval-independent).
 * @type {string}
 */
export const STATIC_CSS = `
      :host {
        display: block;
        width: 100%;
        box-sizing: border-box;
        --poem-num-col: 3ch;
        --poem-num-gap: 0.5rem;
        --poem-num-gutter: calc(var(--poem-num-col) + var(--poem-num-gap));
        --poem-line-number-color: inherit;
        --poem-line-number-font: inherit;
        --poem-line-number-font-size: inherit;
        --poem-line-number-font-weight: inherit;
        --poem-line-number-line-height: inherit;
        --poem-text-indent: 2em;
      }
      slot[name="title"],
      slot[name="author"] {
        display: block;
      }
      [part="block"] {
        margin: 0;
        padding: 0;
        font-family: inherit;
        font-size: inherit;
        line-height: inherit;
        width: 100%;
        box-sizing: border-box;
        contain: layout style;
        overflow-x: auto;
      }
      [part="block"]:focus-visible {
        outline: 2px solid Highlight;
        outline-offset: 2px;
      }
      [part="line"] {
        display: list-item;
        list-style-type: none;
      }
      /* Wrap */
      :host([wrap]) [part="block"] {
        white-space: pre-wrap;
        overflow-x: visible;
        word-break: break-word;
        overflow-wrap: anywhere;
      }
      /* Wrap + indent: hanging indent */
      :host([wrap="indent"]) [part="line"],
      :host([wrap="indent-arrow"]) [part="line"] {
        text-indent: calc(-1 * var(--poem-text-indent, 2em));
        margin-left: var(--poem-text-indent, 2em);
      }
      /* Wrap + indent-arrow: continuation arrow via background */
      :host([wrap="indent-arrow"]) [part="line"] {
        padding-left: 1em;
        text-indent: calc(-1 * (var(--poem-text-indent, 2em) + 1em));
        margin-left: calc(var(--poem-text-indent, 2em) + 1em);
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16'%3E%3Ctext x='0' y='14' font-size='16' fill='%23888'%3E%E2%86%AA%3C/text%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-size: 0.8em 0.8em;
        background-position: 0 calc(1lh + (1lh - 1em) / 2);
      }
      /* Numbers (list layout): inside positioning — pad block so markers sit within content flow */
      :host([numbers][numbers-layout="list"]:not([numbers-position="outside"])) [part="block"] {
        padding-left: var(--poem-num-gutter);
      }
      /* Numbers (list layout) + indent: override margin with padding for ::marker space */
      :host([numbers][numbers-layout="list"][wrap="indent"]) [part="line"],
      :host([numbers][numbers-layout="list"][wrap="indent-arrow"]) [part="line"] {
        margin-left: 0;
        padding-left: var(--poem-text-indent, 2em);
        text-indent: calc(-1 * var(--poem-text-indent, 2em));
      }
      /* Numbers (list layout) + indent-arrow: arrow in padding area */
      :host([numbers][numbers-layout="list"][wrap="indent-arrow"]) [part="line"] {
        padding-left: calc(var(--poem-text-indent, 2em) + 1em);
        text-indent: calc(-1 * (var(--poem-text-indent, 2em) + 1em));
        background-position: var(--poem-text-indent, 2em) calc(1lh + (1lh - 1em) / 2);
      }
      /* Grid numbers (interleaved grid, default) */
      :host([numbers]:not([numbers-layout="list"])) [part="block"] {
        display: grid;
        grid-template-columns: var(--poem-num-col) 1fr;
        column-gap: var(--poem-num-gap);
        align-items: first baseline;
      }
      :host([numbers]:not([numbers-layout="list"])) [part="line"] {
        display: block;
        min-width: 0;
      }
      /* Grid numbers + indent-arrow: restore margin to indent only (grid handles number column) */
      :host([numbers][wrap="indent-arrow"]:not([numbers-layout="list"])) [part="line"] {
        margin-left: var(--poem-text-indent, 2em);
      }
      /* Grid numbers: outside positioning */
      :host([numbers][numbers-position="outside"]:not([numbers-layout="list"])) [part="block"] {
        margin-left: calc(-1 * var(--poem-num-gutter));
        width: calc(100% + var(--poem-num-gutter));
      }
      /* Number styles (grid layout DOM elements) */
      [part="line-number"] {
        text-align: right;
        line-height: var(--poem-line-number-line-height, inherit);
        color: var(--poem-line-number-color, inherit);
        font-family: var(--poem-line-number-font, inherit);
        font-size: var(--poem-line-number-font-size, 1em);
        font-weight: var(--poem-line-number-font-weight, inherit);
        font-variant-numeric: lining-nums;
        user-select: none;
        -webkit-user-select: none;
        pointer-events: none;
      }
      /* Print: force wrap and remove overflow clipping */
      @media print {
        [part="block"] {
          white-space: pre-wrap;
          overflow-x: visible;
          contain: none;
        }
      }`;

/**
 * Generate the interval-dependent CSS (nth-child rules for line numbers).
 * @param {number} numberInterval
 * @returns {string}
 */
export function generateDynamicCSS(numberInterval) {
  return `
      /* List layout: ::marker on nth lines */
      :host([numbers][numbers-layout="list"][wrap]) [part="line"]:nth-child(${numberInterval}n) {
        list-style-type: decimal;
      }
      :host([numbers][numbers-layout="list"][wrap]) [part="line"]:nth-child(${numberInterval}n)::marker {
        color: var(--poem-line-number-color, inherit);
        font-family: var(--poem-line-number-font, inherit);
        font-size: var(--poem-line-number-font-size, 1em);
        font-weight: var(--poem-line-number-font-weight, inherit);
        font-variant-numeric: tabular-nums lining-nums;
      }`;
}

/**
 * Generate the full CSS string for the shadow DOM.
 * @param {number} numberInterval
 * @returns {string}
 */
export function generateCSS(numberInterval) {
  return STATIC_CSS + generateDynamicCSS(numberInterval);
}
