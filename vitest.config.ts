import path from 'path'
import { defineConfig } from 'vitest/config'
import { WxtVitest } from 'wxt/testing/vitest-plugin'

export default defineConfig({
  plugins: [WxtVitest()],
  test: {
    // 全局免导包
    globals: true,
    // 浏览器环境，表示测试的是dom，非node
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    //测试文件目录
    // include: ['tests/**/*.test.{ts,tsx}'],

    // 测试覆盖率
    // coverage: {
    //   provider: 'v8',
    //   reporter: ['text', 'json', 'html'],
    //   include: ['utils/**/*.ts'],
    // },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      '~': path.resolve(__dirname, '.'),
      '#imports': path.resolve(__dirname, 'tests/mocks/imports.ts'),
    },
  },
})
