## SparkleText

[Demo](https://martysaxton.github.io/sparkle-text/)

[Storybook](https://martysaxton.github.io/sparkle-text/storybook/)

Canvas-powered React component that emits tiny sparks from the actual edges of your rendered text glyphs. The real text stays in the DOM for accessibility; an overlaid canvas renders the particles.

### Features

- Outward-emitting particles from true glyph edges
- Works with any font the browser can render
- Accessible: underlying text remains selectable and readable
- Zero dependencies beyond React

## Installation (bun)

```bash
bun add sparkle-text
```

Requires React 18+.

Optional fonts (examples use Fontsource):

```bash
bun add @fontsource/orbitron @fontsource/metal-mania @fontsource/cinzel-decorative @fontsource/codystar
```

Then import a font once in your app entry:

```ts
import '@fontsource/orbitron'
```

## Quick start

```tsx
import React from 'react'
import SparkleText from 'sparkle-text'

export default function Example() {
  return (
    <div style={{ padding: 24 }}>
      <SparkleText className="text-6xl font-black tracking-tight">SPARKLE</SparkleText>
    </div>
  )
}
```

Without utility classes:

```tsx
<SparkleText style={{ fontSize: 72, fontWeight: 900, letterSpacing: -1 }}>Hello</SparkleText>
```

## API

```ts
type SparkleTextProps = {
  children: string // required; text content
  className?: string // optional; forwarded to wrapper
  style?: React.CSSProperties // optional; inline styles for text wrapper
  emissionRate?: number // particles/sec (see defaults in src/SparkleText.tsx)
  speed?: number // px/sec
  spread?: number // radians around outward normal
  gravity?: number // px/sec^2; downward positive
  maxParticles?: number // global live particle cap
  particleSize?: { min: number; max: number } // px radius
  ttl?: { min: number; max: number } // seconds
  colors?: string[] // CSS colors; random HSL if omitted
  paused?: boolean // pause the animation
  canvasBleed?: number // extra px padding around text
}
```

### Defaults

Defaults are defined in a single TypeScript source of truth inside `src/SparkleText.tsx` and used by the component directly. Refer to that file for the authoritative values.

### Notes

- The component mirrors the computed font styles of its wrapper to an offscreen canvas to find glyph edges accurately.
- The canvas overlay is `pointer-events: none`; your text stays interactive.
- Multi-line text is supported; the canvas tracks the element’s size via `ResizeObserver`.

## Accessibility

- The text is rendered in the DOM inside the wrapper, so screen readers and selection work as usual.
- The particle canvas sits behind the text visually (higher `z-index` but `pointer-events: none`).

## SSR / Next.js

- The particle system runs only in the browser. When using Next.js/App Router, mark the file as a client component:

```tsx
'use client'
import SparkleText from 'sparkle-text'
```

## Performance tips

- Lower **emissionRate** and/or **maxParticles** on slower devices.
- Prefer smaller **particleSize** or shorter **ttl** to reduce fill cost.
- Pause when offscreen using an IntersectionObserver in your app and the **paused** prop.

## Development

This repo includes a Vite demo app and Storybook for local development.

### Prerequisites

- Bun installed (`https://bun.sh`)

### Install

```bash
bun install
```

### Run the demo (Vite)

```bash
bun run dev
```

Visit `http://localhost:5173`.

### Storybook

```bash
bun run storybook
```

Visit `http://localhost:6006`. See `src/stories/SparkleText.stories.tsx`.

### Lint

```bash
bun run lint
```

### Build

```bash
bun run build
```

Outputs to `dist/`. You can preview with:

```bash
bun run preview
```

## TypeScript

Full TypeScript types are included. Props are exported via the `SparkleTextProps` type.

## License

MIT. See `LICENSE`.
