import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { NotFoundPage } from './NotFoundPage';

const meta = {
  title: 'Pages/NotFound/NotFoundPage',
  component: NotFoundPage,
  tags: ['!autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof NotFoundPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('link', { name: 'Back home' })).toHaveAttribute('href', '/');
  },
};
