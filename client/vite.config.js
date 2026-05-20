import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Replace CSP-unsafe Function("return this")() from engine.io-client with globalThis
    // engine.io-client's browser globals.js uses Function("return this")() to detect the
    // global object, which is blocked by Content-Security-Policy. Since we're building for
    // modern browsers, globalThis is a safe replacement.
    {
      name: 'csp-safe-globals',
      async transform(code, id) {
        if (!id.includes('engine.io-client')) return null;
        if (code.includes('Function("return this")()')) {
          return {
            code: code.replace('Function("return this")()', 'globalThis'),
            map: null,
          };
        }
        return null;
      },
    },
  ],
})
