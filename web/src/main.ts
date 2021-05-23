import { createApp } from 'vue';
import App from './App.vue';
import uxCore from '@eonix-io/ux-core';
import '@eonix-io/ux-core/style';
createApp(App as any)
   .use(uxCore)
   .mount('#app');
