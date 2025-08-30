import type { Meta, StoryObj } from '@storybook/react-vite'
import '@fontsource/orbitron'

import SparkleText from '../SparkleText'

const meta = {
  title: 'Example/SparkleText',
  component: SparkleText,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
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
