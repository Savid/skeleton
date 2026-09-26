import { defineConfig } from '@hey-api/openapi-ts';

// Generates src/api from the spec: `pnpm generate:api`. Never edit src/api.
export default defineConfig({
  input: '../api/openapi.yaml',
  output: {
    path: 'src/api',
    postProcess: ['prettier'],
  },
  plugins: [
    {
      name: '@hey-api/client-fetch',
      runtimeConfigPath: './src/lib/api-client.ts',
    },
    {
      name: 'zod',
      compatibilityVersion: 'mini',
      metadata: false,
    },
    '@tanstack/react-query',
    {
      name: '@hey-api/sdk',
      validator: { request: false, response: 'zod' },
    },
  ],
});
