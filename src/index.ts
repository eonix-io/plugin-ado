import type { App } from 'vue';

import AdoConfig from './components/AdoConfig.vue';

function install(Vue: App) {
   Vue.component('ado-config', AdoConfig);
}

export default { install };