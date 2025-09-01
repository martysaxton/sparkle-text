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
  allowInside?: boolean // if true, particles may pass over glyph fills
}
```

### Defaults

Defaults live in `src/SparkleText.defaults.ts` (`SPARKLE_DEFAULTS`) and are consumed by the component.

### Notes

- The component mirrors the computed font styles of its wrapper to an offscreen canvas to find glyph edges accurately.
- The canvas overlay is `pointer-events: none`; your text stays interactive.
- Multi-line text is supported; the canvas tracks the element’s size via `ResizeObserver`.

## How it works (glyph-edge emission)

- Render the text into an offscreen canvas to obtain an alpha mask that exactly matches the DOM text (by mirroring the computed font style).
- Convert that alpha into a binary inside mask (1 = glyph pixel, 0 = background).
- Flood‑fill from the offscreen canvas borders through background pixels to label the true outside region. Any enclosed voids the flood‑fill cannot reach are treated as holes (the insides of letters like “O”, “a”, “B”).
- Walk the inside mask to find edge pixels (inside pixels that touch outside or hole pixels). For each edge pixel, estimate a local outward normal using simple central‑difference gradients on the binary mask; flip the normal if a short look‑ahead shows it pointing the wrong way (toward fill instead of outside/hole).
- Spawn particles at random edge points. Start each particle a few pixels along the normal, give it an initial velocity along that normal with a small angular spread, then integrate gravity.
- By default, cull any particle that travels into the glyph fill so sparks remain strictly outside the letter shapes. If you set `allowInside` to `true`, this culling is skipped so particles can cross over the filled letter interior while still emitting from inner edges. Draw particles to the overlay canvas using additive blending for a subtle glow.

Why this approach

- Works with any font the browser can render; no path extraction or SDFs required.
- Respects inner holes because outside vs hole regions are distinguished via flood‑fill.
- Robust to layout changes: the mask is rebuilt on resize and after fonts finish loading.

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
