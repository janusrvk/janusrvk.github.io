import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        interesses: resolve(__dirname, 'interesses.html'),
        sollicitaties: resolve(__dirname, 'sollicitaties.html'),
        'sollicitatie-vpro': resolve(__dirname, 'sollicitatie-vpro.html'),
        'over-mij': resolve(__dirname, 'over-mij.html'),
      },
    },
  },
  server: {
    proxy: {
      '/api/letterboxd': {
        target: 'https://letterboxd.com',
        changeOrigin: true,
        rewrite: (path) => path.replace('/api/letterboxd', ''),
      },
      '/api/goodreads': {
        target: 'https://www.goodreads.com',
        changeOrigin: true,
        rewrite: (path) => path.replace('/api/goodreads', ''),
      },
    },
  },
});
