import type { App } from 'vue';
import type { IInstallOptions } from '@eonix-io/client';

import AdoConfig from './components/config/Config.vue';

function install(Vue: App, opt: IInstallOptions) {
   Vue.component(`${opt.componentPrefix}config`, AdoConfig);
}

export default { install };