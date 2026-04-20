import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        // Splash (keuze tussen klassiek en nieuw)
        main: resolve(__dirname, 'index.html'),

        // Nieuwe versie (portfolio-stijl, zwart/oranje)
        nieuw: resolve(__dirname, 'nieuw.html'),
        'artikel-fincher': resolve(__dirname, 'artikel-fincher.html'),
        'artikel-breitner': resolve(__dirname, 'artikel-breitner.html'),
        'artikel-groenteman': resolve(__dirname, 'artikel-groenteman.html'),
        'artikel-thesis': resolve(__dirname, 'artikel-thesis.html'),
        'sollicitatie-vpro': resolve(__dirname, 'sollicitatie-vpro.html'),
        'aanbevelingen': resolve(__dirname, 'aanbevelingen.html'),

        // Klassieke versie (krant-stijl, donker + oranje)
        'klassiek': resolve(__dirname, 'klassiek/index.html'),
        'klassiek-archief': resolve(__dirname, 'klassiek/archief.html'),
        'klassiek-cv': resolve(__dirname, 'klassiek/cv.html'),
        'klassiek-over-mij': resolve(__dirname, 'klassiek/over-mij.html'),
        'klassiek-interesses': resolve(__dirname, 'klassiek/interesses.html'),
        'klassiek-sollicitaties': resolve(__dirname, 'klassiek/sollicitaties.html'),
        'klassiek-sollicitatie-vpro': resolve(__dirname, 'klassiek/sollicitatie-vpro.html'),
        'klassiek-aanbevelingen': resolve(__dirname, 'klassiek/aanbevelingen.html'),
        'klassiek-artikel-fincher': resolve(__dirname, 'klassiek/artikel-fincher.html'),
        'klassiek-artikel-breitner': resolve(__dirname, 'klassiek/artikel-breitner.html'),
        'klassiek-artikel-groenteman': resolve(__dirname, 'klassiek/artikel-groenteman.html'),
        'klassiek-artikel-thesis': resolve(__dirname, 'klassiek/artikel-thesis.html'),
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
