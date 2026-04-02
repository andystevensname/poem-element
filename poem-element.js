import { parseAttributes, parseLines, transformLineText, formatLineNumber, STATIC_CSS, generateDynamicCSS } from './poem-element-core.js';

let staticSheet = null;
const dynamicSheetCache = new Map();

class PoemElement extends HTMLElement {
  static get observedAttributes() {
    return ['numbers', 'wrap', 'numbers-layout', 'numbers-position', 'aria-label'];
  }

  #renderPending = false;

  connectedCallback() {
    // If Declarative Shadow DOM already provided content, skip render
    if (this.shadowRoot && this.shadowRoot.querySelector('[part="block"]')) {
      return;
    }
    this.scheduleRender();
  }

  attributeChangedCallback() {
    if (this.isConnected) {
      this.scheduleRender();
    }
  }

  scheduleRender() {
    if (!this.#renderPending) {
      this.#renderPending = true;
      queueMicrotask(() => {
        this.#renderPending = false;
        if (this.isConnected) {
          this.render();
        }
      });
    }
  }

  get text() {
    return this.textContent;
  }

  set text(value) {
    this.textContent = value;
    this.scheduleRender();
  }

  render() {
    const raw = this.textContent;
    const lines = parseLines(raw);

    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
    }
    const shadow = this.shadowRoot;

    const config = parseAttributes({
      numbers: this.hasAttribute('numbers') ? (this.getAttribute('numbers') ?? '') : null,
      wrap: this.hasAttribute('wrap') ? (this.getAttribute('wrap') ?? '') : null,
      'numbers-layout': this.getAttribute('numbers-layout'),
      'numbers-position': this.getAttribute('numbers-position'),
      'aria-label': this.getAttribute('aria-label'),
    });

    // Preserve scroll position if re-rendering
    const scrollTarget = shadow.querySelector('[part="block"]');
    const scrollLeft = scrollTarget ? scrollTarget.scrollLeft : 0;

    // Apply styles: adoptedStyleSheets with shared static + cached dynamic sheets
    if (shadow.adoptedStyleSheets !== undefined) {
      if (!staticSheet) {
        staticSheet = new CSSStyleSheet();
        staticSheet.replaceSync(STATIC_CSS);
      }
      if (!dynamicSheetCache.has(config.numberInterval)) {
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(generateDynamicCSS(config.numberInterval));
        dynamicSheetCache.set(config.numberInterval, sheet);
      }
      shadow.adoptedStyleSheets = [staticSheet, dynamicSheetCache.get(config.numberInterval)];
    } else {
      // Fallback: inline <style> for browsers without adoptedStyleSheets
      const existing = shadow.querySelector('style');
      const css = STATIC_CSS + generateDynamicCSS(config.numberInterval);
      if (existing) {
        existing.textContent = css;
      } else {
        const style = document.createElement('style');
        style.textContent = css;
        shadow.prepend(style);
      }
    }

    // Build new DOM in a DocumentFragment to batch DOM mutations
    const frag = document.createDocumentFragment();

    const container = document.createElement('pre');
    container.setAttribute('part', 'block');
    container.setAttribute('role', 'group');
    container.setAttribute('aria-label', config.ariaLabel);
    if (!config.hasWrap) {
      container.setAttribute('tabindex', '0');
    }

    let numbersCol;
    if (config.useGridSplit) {
      numbersCol = document.createElement('div');
      numbersCol.setAttribute('part', 'line-numbers');
      numbersCol.setAttribute('aria-hidden', 'true');
    }

    lines.forEach((line, i) => {
      if (config.useGridNumbers) {
        const numSpan = document.createElement('span');
        numSpan.textContent = formatLineNumber(i, config.numberInterval);
        if (config.useGridSplit) {
          numbersCol.appendChild(numSpan);
        } else {
          numSpan.setAttribute('part', 'line-number');
          numSpan.setAttribute('aria-hidden', 'true');
          container.appendChild(numSpan);
        }
      }

      const lineSpan = document.createElement('span');
      lineSpan.setAttribute('part', 'line');
      lineSpan.setAttribute('role', 'none');
      lineSpan.textContent = transformLineText(line, config);
      container.appendChild(lineSpan);
    });

    if (config.useGridSplit) {
      const outer = document.createElement('div');
      outer.className = 'poem-grid-outer' + (config.numbersOutside ? ' poem-numbers-outside' : '');
      outer.appendChild(numbersCol);
      outer.appendChild(container);
      frag.appendChild(outer);
    } else {
      frag.appendChild(container);
    }

    // Remove old content (but preserve <style> for fallback path)
    const styleEl = shadow.querySelector('style');
    shadow.innerHTML = '';
    if (styleEl && shadow.adoptedStyleSheets === undefined) {
      shadow.appendChild(styleEl);
    }

    // Single append for all new content
    shadow.appendChild(frag);

    // Restore scroll position
    if (scrollLeft) {
      const newScrollTarget = shadow.querySelector('[part="block"]');
      if (newScrollTarget) {
        newScrollTarget.scrollLeft = scrollLeft;
      }
    }

    // Emit rendered event
    this.dispatchEvent(new CustomEvent('poem-rendered', {
      bubbles: true,
      composed: true,
      detail: { lines: lines.length, config },
    }));
  }
}
customElements.define('poem-element', PoemElement);
