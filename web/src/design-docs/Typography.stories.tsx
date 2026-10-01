import type { Meta, StoryObj } from '@storybook/react-vite';
import { TokenTable } from './blocks/TokenTable';
import { TypeScale } from './blocks/TypeScale';

const meta = {
  title: 'Foundations/Typography',
  tags: ['!autodocs', '!dev'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Families: Story = {
  render: () => (
    <TokenTable
      namespace="font"
      usage={name => `font-${name}`}
      notes={{ sans: 'the default, set on body', mono: 'ids, versions, times, code' }}
    />
  ),
};

export const Scale: Story = {
  render: () => <TypeScale sample="The quick brown fox checks the server's health" />,
};

export const Sizes: Story = {
  render: () => (
    <TokenTable
      namespace="text"
      usage={name => `text-${name}`}
      notes={{
        caption: 'labels over values, badges',
        body: 'running text and controls (the page default)',
        title: 'card titles',
        heading: 'the page heading (one per page)',
      }}
    />
  ),
};

export const Weights: Story = {
  render: () => (
    <TokenTable namespace="font-weight" usage={name => `font-${name}`} notes={{ semibold: 'titles and headings' }} />
  ),
};
