import type { Meta, StoryObj } from '@storybook/react-vite'
import '@fontsource/orbitron'

import SparkleText from '../SparkleText'
import { SPARKLE_DEFAULTS } from '../SparkleText.defaults.ts'

const meta = {
  title: 'Example/SparkleText',
  component: SparkleText,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    emissionRate: { table: { defaultValue: { summary: `${SPARKLE_DEFAULTS.emissionRate}` } } },
    speed: { table: { defaultValue: { summary: `${SPARKLE_DEFAULTS.speed}` } } },
    spread: { table: { defaultValue: { summary: `${SPARKLE_DEFAULTS.spread}` } } },
    gravity: { table: { defaultValue: { summary: `${SPARKLE_DEFAULTS.gravity}` } } },
    maxParticles: { table: { defaultValue: { summary: `${SPARKLE_DEFAULTS.maxParticles}` } } },
    particleSize: {
      table: {
        defaultValue: {
          summary: `{ min: ${SPARKLE_DEFAULTS.particleSize.min}, max: ${SPARKLE_DEFAULTS.particleSize.max} }`,
        },
      },
    },
    ttl: {
      table: {
        defaultValue: {
          summary: `{ min: ${SPARKLE_DEFAULTS.ttl.min}, max: ${SPARKLE_DEFAULTS.ttl.max} }`,
        },
      },
    },
    colors: { table: { defaultValue: { summary: 'undefined' } } },
    paused: { table: { defaultValue: { summary: String(SPARKLE_DEFAULTS.paused) } } },
    canvasBleed: { table: { defaultValue: { summary: `${SPARKLE_DEFAULTS.canvasBleed}` } } },
  },
  decorators: [
    Story => (
      <div
        style={{
          fontFamily: '"Orbitron", system-ui, sans-serif',
          fontSize: '3rem',
          backgroundColor: 'black',
          color: 'white',
          padding: 100,
        }}
      >
        <Story />
      </div>
    ),
  ],
  args: {
    children: 'SPARKLE',
    className: '',
  },
} satisfies Meta<typeof SparkleText>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
