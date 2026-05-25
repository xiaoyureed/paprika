import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'wxt'
import path from 'path'
import { SHORTCUTS } from './utils/constants' // can't use '@' this line
import removeConsole from 'vite-plugin-remove-console'

// See https://wxt.dev/api/config.html
export default defineConfig({
  vite: ({ mode }) => {
    return {
      plugins:
        mode === 'production'
          ? [removeConsole({ includes: ['log', 'debug'] }), tailwindcss()]
          : [tailwindcss()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './'), 
        },
      },
      build: {
        // 禁用压缩，便于调试
        minify: mode === 'production',
      },
    }
  },
  modules: [
    '@wxt-dev/module-react',
    // 自动图标
    '@wxt-dev/auto-icons',
  ],

  manifest: (meta) => {
    return {
      name: 'Paprika',
      version: '0.1.0',
      description: 'A Chrome extension to ask questions or to manage your prompt templates',
      permissions: [
        'tabs',
        'bookmarks',
        'storage',
        'activeTab',
        'scripting',
        'contextMenus',
      ],
      // background: {
      //   service_worker: 'background.ts',
      // },
      // content_scripts: [
      //   {
      //     matches: ['<all_urls>'],
      //     js: ['content.ts'],
      //   },
      // ],
      //
      commands: {
        [SHORTCUTS.openPalette]: {
          suggested_key: {
            default: 'Ctrl+I',
            mac: 'Command+I',
          },
          description: 'Open the search palette',
        },
      },
    }
  },
})
