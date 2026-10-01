import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { AppShell } from './AppShell';

const meta = {
  title: 'Components/Layout/AppShell',
  component: AppShell,
  parameters: { layout: 'fullscreen' },
  args: {
    name: 'skeleton',
    connection: 'live',
    children: <p className="text-body text-muted">Page content</p>,
  },
  argTypes: { connection: { control: 'inline-radio', options: ['connecting', 'live', 'reconnecting'] } },
} satisfies Meta<typeof AppShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    await expect(canvas.getByText('live')).toHaveAttribute('data-tone', 'ok');
  },
};

export const Reconnecting: Story = {
  args: { connection: 'reconnecting' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('reconnecting')).toHaveAttribute('data-tone', 'warn');
  },
};
