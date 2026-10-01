import type { Meta, StoryObj } from '@storybook/react-vite';
import { TokenTable } from './blocks/TokenTable';

const meta = {
  title: 'Foundations/Layout',
  tags: ['!autodocs', '!dev'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Widths: Story = {
  render: () => (
    <TokenTable
      namespace="container"
      usage={name => `max-w-${name}`}
      notes={{ narrow: 'error and not-found pages', page: 'the main column of a page with cards' }}
    />
  ),
};

export const Radii: Story = {
  render: () => (
    <TokenTable
      namespace="radius"
      usage={name => `rounded-${name}`}
      notes={{ sm: 'badges and buttons', md: 'cards and panels' }}
    />
  ),
};
