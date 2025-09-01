/**
 * Single source of truth for all default values used by SparkleText.
 * Keep defaults here and reference them wherever needed (component, docs, stories).
 */
export const SPARKLE_DEFAULTS = {
  emissionRate: 150,
  speed: 100,
  spread: Math.PI / 6,
  gravity: 100,
  maxParticles: 1200,
  particleSize: { min: 0.5, max: 1.2 },
  ttl: { min: 0.5, max: 1.2 },
  colors: undefined as string[] | undefined,
  paused: false,
  canvasBleed: 60,
  allowInside: false,
} as const

export type SparkleDefaults = typeof SPARKLE_DEFAULTS
