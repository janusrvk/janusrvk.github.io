import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        'artikel-fincher': resolve(__dirname, 'artikel-fincher.html'),
        'artikel-breitner': resolve(__dirname, 'artikel-breitner.html'),
        'artikel-groenteman': resolve(__dirname, 'artikel-groenteman.html'),
        'artikel-thesis': resolve(__dirname, 'artikel-thesis.html'),
        'sollicitatie-vpro': resolve(__dirname, 'sollicitatie-vpro.html'),
        'aanbevelingen': resolve(__dirname, 'aanbevelingen.html'),
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
