import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { StatusBadge } from './StatusBadge';
import type { StatusTone } from './StatusBadge.types';

const tones: StatusTone[] = ['ok', 'warn', 'danger', 'neutral'];

const meta = {
  title: 'Components/Feedback/StatusBadge',
  component: StatusBadge,
  args: { tone: 'ok', children: 'online' },
  argTypes: { tone: { control: 'inline-radio', options: tones } },
} satisfies Meta<typeof StatusBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Tones: Story = {
  render: () => (
    <div className="flex gap-2">
      {tones.map(tone => (
        <StatusBadge key={tone} tone={tone}>
          {tone}
        </StatusBadge>
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    for (const tone of tones) {
      await expect(canvas.getByText(tone)).toHaveAttribute('data-tone', tone);
    }
  },
};
