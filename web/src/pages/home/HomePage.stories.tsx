import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { healthHandlers } from '@/test-utils/handlers';
import { HomePage } from './HomePage';

const meta = {
  title: 'Pages/Home/HomePage',
  component: HomePage,
  tags: ['!autodocs'],
  parameters: { layout: 'fullscreen', msw: { handlers: [healthHandlers.ok] } },
} satisfies Meta<typeof HomePage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(await canvas.findByText('0.1.0')).toBeInTheDocument();
  },
};

export const Unreachable: Story = {
  parameters: { msw: { handlers: [healthHandlers.down] } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole('alert')).toHaveTextContent('Could not reach the server.');
  },
};
