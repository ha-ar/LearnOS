import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The student onboarding app talks to the LearnOS backend. In dev we proxy
// /api to the backend so the browser makes same-origin requests (no CORS).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3003,
    proxy: {
      '/api': {
        target: process.env.VITE_API_TARGET || 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
