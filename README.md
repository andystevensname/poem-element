# poem-element

## Overview
`<poem-element>` was developed to help solve the following difficulties with displaying poems on the web.

- **No semantic element**: A poem is composed of lines grouped into stanzas. Many developers wrap stanzas or lines in paragraph tags (`<p>`), which, while understandable, is semanticaly incorrect. Preformatted text (`<pre>`) is a better option, but by itself it's limited.
- **No control over line formatting**: No single text element can offer control over individual lines.
- **Difficult to set within a reponsive site design**: Poems in print have always been constrained by the page, and while a responsive web design provides more options to adapt to a poem than physical media, sometimes a poem needs to respond to the constraints of a site design.

## Features
### Element Options
`<poem-element>` allows for the following per-poem options.

- **Line wrap**: `<poem-element>` defaults to horizontal scrolling when the content box is constrained by a parent element. Optionally, `<poem-element>` can wrap longer lines with or without a hanging indent, and with or without a graphic glyph denoting the line wrap. 

- **Line numbers**: Line numbers are a booksetting convention for longer poems or academic settings. Two layout modes are available: 
  - `grid` (default) uses a CSS grid layout to display lines and line numbers.
  -  `list` uses a browser's built-in list-item counter with a `::marker` pseudo element, and is only available with wrapped poems.

### Other Features
- **Accessibility**: `<poem-element>` uses `role="group"` with a configurable `aria-label` on the poem container to help screen readers announce the poem as a whole, and `role="none"` on individual lines to prevent screen readers from announcing list items. Line numbers are marked `aria-hidden`. In non-wrapping mode, the poem container is keyboard-focusable (`tabindex="0"`) so users can scroll horizontally with arrow keys.

- **Server-side rendering**: `<poem-element>` supports Declarative Shadow DOM for instant rendering without JavaScript. A Node.js SSR helper renders the complete HTML output when used with [Astro](https://astro.build), [11ty](https://www.11ty.dev), or any templating system.

- **Print support**: `poem-element` provides a `@media print` rule that forces text wrapping and removes overflow clipping, allowing poems to render completely when printed or saved as a PDF.

- **External styling**: `<poem-element>` exposes `part` attributes and CSS custom properties, allowing developers to style the component via a site's main stylesheet.

## Installation

```bash
npm install poem-element
```

Or include the script directly:

```html
<script type="module" src="poem-element.js"></script>
```

## Usage

### Basic usage
```html
<poem-element>
Buffalo Bill 's
defunct
               who used to
               ride a watersmooth-silver
                                                              stallion
and break onetwothreefourfive pigeonsjustlikethat
                                                                                        Jesus
he was a handsome man
                                            and what i want to know is
how do you like your blueeyed boy
Mister Death
</poem-element>
```

### Line wrap
```html
<!-- Standard wrap -->
<poem-element wrap>
This is the forest primeval. The murmuring pines and the hemlocks,
Bearded with moss, and in garments green, indistinct in the twilight,
</poem-element>

<!-- Indented wrap -->
<poem-element wrap="indent">
Shall I compare thee to a summer's day?
Thou art more lovely and more temperate:
</poem-element>

<!-- Indented wrap with continuation arrow -->
<poem-element wrap="indent-arrow">
Shall I compare thee to a summer's day?
Thou art more lovely and more temperate:
</poem-element>
```

### Line numbers
```html
<!-- Numbers every 5th line (default, grid layout) -->
<poem-element numbers>
...
</poem-element>

<!-- Numbers every 4th line -->
<poem-element numbers="4">
...
</poem-element>

<!-- Numbers with indented wrap (grid layout, default) -->
<poem-element numbers wrap="indent">
...
</poem-element>

<!-- Numbers with list layout (only available with wrap) -->
<poem-element numbers numbers-layout="list" wrap="indent">
...
</poem-element>

<!-- Numbers positioned outside (in the margin) -->
<poem-element numbers numbers-position="outside" wrap="indent">
...
</poem-element>
```

### Accessibility
```html
<poem-element aria-label="Sonnet 18 by William Shakespeare" numbers wrap="indent">
Shall I compare thee to a summer's day?
...
</poem-element>
```

### FOUC prevention

Add this to your page CSS to prevent a flash of unstyled content. This will preserve the poem's whitespace while hiding its content while the component registers:

```css
poem-element:not(:defined) {
  visibility: hidden;
}
```

## Demo

Because the web component is served over HTTP, you'll need to run the included local server to view the demo:

```bash
npx serve .
```

Then open `index.html` in your browser.

## API Reference

### Attributes

| Attribute | Values | Default | Description |
|-----------|--------|---------|-------------|
| `wrap` | (boolean), `"indent"`, `"indent-arrow"` | No line wrap | Controls line wrapping behavior. Adding this attribute without a value forces horizontal scrolling. Adding one of the values changes the wrap behavior. |
| `numbers` | (boolean), or a positive integer | 5 | Enables line numbering. Adding this attribute without a value creates line numbers every 5th line. A number sets the interval. |
| `numbers-layout` | `"grid"`, `"list"` | `"grid"` | `grid` uses CSS Grid with DOM elements for numbers. `list` uses `display: list-item` with `::marker` for numbers (only effective with `wrap`; silently ignored without it). |
| `numbers-position` | `"inside"`, `"outside"` | `"inside"` | `inside` positions numbers flush with surrounding content. `outside` hangs numbers in the left margin. |
| `aria-label` | any string | `"poem"` | Accessible label for the poem container. Forwarded to the inner `role="group"` element. |

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `text` | `string` | Get or set the poem text. Setting triggers a re-render. |

### Methods

| Method | Description |
|--------|-------------|
| `render()` | Manually re-render the component. Called automatically on attribute changes. |
| `scheduleRender()` | Queue a render via microtask. Multiple calls are debounced into a single render. |

### Events

| Event | Detail | Description |
|-------|--------|-------------|
| `poem-rendered` | `{ lines: number, config: object }` | Fired after each render completes. Bubbles and crosses shadow DOM boundaries (`composed: true`). |

## Customization

### CSS `::part()` Selectors

Internal elements expose `part` attributes for direct styling:

```css
/* Style the poem container (font, color, background, line-height, etc.) */
poem-element::part(block) {
  font-family: Georgia, serif;
  font-size: 1.1em;
  color: #333;
  background: #fafafa;
  line-height: 1.6;
}

/* Style individual poem lines */
poem-element::part(line) {
  color: #333;
}

/* Style line numbers (grid interleaved layout) */
poem-element::part(line-number) {
  color: #c00;
}

/* Style the line numbers column (grid split layout) */
poem-element::part(line-numbers) {
  color: #999;
}
```

### CSS Custom Properties

These properties control values that can't be styled through `::part()` — either because they're used in internal `calc()` expressions or because they target `::marker`, which isn't styleable via `::part()`.

```css
poem-element {
  /* Layout calc values */
  --poem-num-col: 40px;        /* Width of the line number column */
  --poem-num-gap: 0.5rem;      /* Gap between numbers and text */
  --poem-text-indent: 2em;     /* Hanging indent depth for wrap="indent" */

  /* ::marker styling (not reachable via ::part) */
  --poem-line-number-color: inherit;
  --poem-line-number-font: inherit;
  --poem-line-number-font-size: 1em;
  --poem-line-number-font-weight: normal;
}
```

For general text styling (font, color, background, line-height, etc.), use `::part()` selectors.

## Server-Side Rendering

The SSR helper produces Declarative Shadow DOM output for instant rendering without JavaScript:

```js
import { renderPoemElement } from 'poem-element/ssr';

const html = renderPoemElement(
  `Shall I compare thee to a summer's day?
Thou art more lovely and more temperate:`,
  {
    numbers: true,
    wrap: 'indent',
    'aria-label': 'Sonnet 18',
  }
);
```

The output includes a `<template shadowrootmode="open">` with the fully rendered shadow DOM. The browser attaches it immediately on parse, with no JavaScript required for the initial render.

When the client-side JS loads, it detects the existing DSD content and skips re-rendering. Dynamic attribute changes after load will trigger re-renders as normal.

### Framework integration

**Astro:**
```astro
---
import { renderPoemElement } from 'poem-element/ssr';
const html = renderPoemElement(`Shall I compare...`, { numbers: true, wrap: 'indent' });
---
<Fragment set:html={html} />
<script>import 'poem-element';</script>
```

**11ty:**
```js
const { renderPoemElement } = require('poem-element/ssr');
eleventyConfig.addShortcode('poem', (text, attrs) => renderPoemElement(text, attrs));
```

### Package exports

```js
import 'poem-element';                    // Client-side custom element
import { renderPoemElement } from 'poem-element/ssr';   // SSR helper
import { parseAttributes, parseLines, transformLineText, formatLineNumber, generateCSS, STATIC_CSS, generateDynamicCSS } from 'poem-element/core'; // Shared utilities
```