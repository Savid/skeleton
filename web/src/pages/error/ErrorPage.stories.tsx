import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { ErrorPage } from './ErrorPage';

const meta = {
  title: 'Pages/Error/ErrorPage',
  component: ErrorPage,
  tags: ['!autodocs'],
  parameters: { layout: 'fullscreen' },
  args: { error: new Error('the stream exploded'), reset: fn() },
} satisfies Meta<typeof ErrorPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('alert')).toHaveTextContent('the stream exploded');
    await expect(canvas.getByRole('link', { name: 'Back home' })).toHaveAttribute('href', '/');
  },
};

export const WithoutMessage: Story = {
  args: { error: undefined },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('alert')).toHaveTextContent('Something went wrong');
  },
};
