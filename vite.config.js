import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    host: '0.0.0.0', // 允许局域网访问
    //host: 'husky-tough-snake.ngrok-free.app',
    port: 5174, // 端口号
    allowedHosts: ['husky-tough-snake.ngrok-free.app'],

  },
})
