import { defineConfig } from '@umijs/max';

export default defineConfig({
  antd: {},
  access: {},
  model: {},
  initialState: {},
  request: {},
  layout: {
    title: '测试Demo',
  },
  routes: [
    {
      name: '首页',
      path: '/',
      component: './Index',
    },
  ],
  npmClient: 'pnpm',
  proxy: {
    '/api/market': {
      target: 'https://buff.163.com',
      changeOrigin: true,
      // 'pathRewrite': { '^/api' : '' },
      headers: {
        Origin: 'https://buff.163.com',
        Referer: 'https://buff.163.com',
      },
    },
    '/market': {
      target: 'https://steamcommunity.com',
      changeOrigin: true,
      // 'pathRewrite': { '^/api' : '' },
    },
    '/api': {
      target: 'http://panyunkejigs.com',
      changeOrigin: true,
      // 'pathRewrite': { '^/api' : '' },
    },
    '/local': {
      target: 'http://localhost:7778',
      changeOrigin: true,
      // 'pathRewrite': { '^/api' : '' },
    },
  },
});
