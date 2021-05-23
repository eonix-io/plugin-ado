import type { UserConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

const config: UserConfig = {
   plugins: [vue()],
   resolve: {
      alias: {
         '@/': '/src/'
      }
   },
   build: {
      lib: {
         entry: path.resolve(__dirname, 'src/index.ts'),
         name: 'eonix-plugin-ado',
         formats: ['umd']
      },
      rollupOptions: {
         // make sure to externalize deps that shouldn't be bundled
         // into your library
         external: ['vue'],
         output: {
            exports: 'named',
            globals: {
               vue: 'Vue',
            },
         },
      }
   },
   server: {
      port: 8081,
      strictPort: true
   }
};

export default config;