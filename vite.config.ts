import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' 让构建产物可以直接放到 GitHub Pages 的子路径下运行
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    watch: {
      // 编辑器原子写入时会生成 .xxx.tmpdir 临时目录，Windows 上监听它会 EBUSY 导致 dev server 崩溃
      ignored: ['**/*.tmpdir/**', '**/.tmpdir/**', '**/node_modules/**'],
    },
  },
})
