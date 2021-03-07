import { createApp } from 'vue';
import App from './App.vue';
import uxCore from '@eonix-io/ux-core';
import '@eonix-io/ux-core/dist/style.css';

createApp(App)
   .use(uxCore)
   .mount('#app');
