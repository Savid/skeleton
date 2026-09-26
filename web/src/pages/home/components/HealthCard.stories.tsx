import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { healthHandlers } from '@/test-utils/handlers';
import { HealthCard } from './HealthCard';

const meta = {
  title: 'Pages/Home/Components/HealthCard',
  component: HealthCard,
  parameters: { layout: 'padded', msw: { handlers: [healthHandlers.ok] } },
  args: { now: Date.parse('2026-09-26T12:00:12.000Z') },
} satisfies Meta<typeof HealthCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(await canvas.findByText('0.1.0')).toBeInTheDocument();
    await expect(canvas.getByText('ok')).toHaveAttribute('data-tone', 'ok');
  },
};

export const Loading: Story = {
  parameters: { msw: { handlers: [healthHandlers.pending] } },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('status')).toHaveTextContent("Loading the server's health…");
  },
};

export const Unreachable: Story = {
  parameters: { msw: { handlers: [healthHandlers.down] } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole('alert')).toHaveTextContent('Could not reach the server.');
  },
};
