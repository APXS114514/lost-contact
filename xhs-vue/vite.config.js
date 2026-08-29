import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// 构建产物输出到 demo/assets/xhs-app/，供原生外壳 <script> 加载（IIFE，file:// 可用）
export default defineConfig({
  plugins: [vue()],
  base: './',
  build: {
    outDir: '../assets/xhs-app',
    emptyOutDir: true,
    rollupOptions: {
      input: 'src/mount.js',
      output: {
        format: 'iife',
        entryFileNames: 'xhs-app.js',
        assetFileNames: 'xhs-app-[name].[ext]'
      }
    }
  }
})
