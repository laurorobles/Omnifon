import { defineConfig } from 'vite';

// En GitHub Pages el sitio vive en /Omnifon/
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/Omnifon/' : '/',
}));
