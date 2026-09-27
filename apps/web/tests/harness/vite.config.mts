import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
const path = (value: string) => fileURLToPath(new URL(value, import.meta.url));
// This separate test server renders real admin components against an in-memory adapter.
// It adds no route or authentication bypass to the Next.js application.
export default defineConfig({
  root: path('./'),
  resolve: {
    alias: {
      '@': path('../../src'),
      'convex/react': path('./convex.ts'),
      'next/image': path('./image.tsx'),
      'next/link': path('./link.tsx'),
      'next/navigation': path('./navigation.ts'),
    },
  },
  define: { 'process.env': '{}' },
  server: {
    host: '127.0.0.1',
    port: 3334,
    strictPort: true,
    fs: { allow: [path('../../../../')] },
  },
});
