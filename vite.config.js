import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        dashboard: resolve(__dirname, 'dashboard.html'),
        game: resolve(__dirname, 'game.html'),
        lobby: resolve(__dirname, 'lobby.html'),
        deposit: resolve(__dirname, 'deposit.html'),
        promo: resolve(__dirname, 'promo.html'),
        account: resolve(__dirname, 'account.html')
      }
    }
  },
  server: {
    port: 5174,
    host: true,
    open: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8090',
        changeOrigin: true,
        secure: false
      }
    }
  }
});
