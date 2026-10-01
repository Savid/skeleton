// Knip runs from the workspace root so the graph spans every package. Its Vite
// and Vitest plugins find main.tsx and the test setup on their own.
export default {
  // Tailwind 4 is imported from CSS, and design docs are MDX: reduce both to
  // their imports so knip sees those dependencies.
  compilers: {
    css: (text: string): string => [...text.matchAll(/(?<=@)import[^;]+/g)].join('\n'),
    mdx: (text: string): string => [...text.matchAll(/^import\s[^;]+;?$/gm)].map(m => m[0]).join('\n'),
  },
  // CI runs package scripts as `pnpm --dir web <script>`, which knip reads as
  // bare binaries; every name here is a script in web/package.json, except
  // `playwright`, web's dependency reached through `pnpm --dir web exec`.
  ignoreBinaries: ['lint', 'typecheck', 'build', 'build-storybook', 'playwright'],
  workspaces: {
    web: {
      entry: ['src/routes/**/*.tsx'],
      project: ['src/**/*.{ts,tsx,css,mdx}'],
      // Generated from api/openapi.yaml; it exports every operation and type
      // whether or not the app uses it.
      ignore: ['src/api/**'],
    },
  },
};
