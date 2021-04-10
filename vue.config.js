
const path = require('path');

// eslint-disable-next-line no-undef
module.exports = {

    css: { extract: false },

    configureWebpack: config => {
        // eslint-disable-next-line no-undef
        if (process.env.NODE_ENV === 'development') {
            config.devtool = 'eval-source-map';
            config.output.devtoolModuleFilenameTemplate = info =>

                info.resourcePath.match(/\.vue$/) && !info.identifier.match(/type=script/)  // this is change ✨ 
                    ? `webpack-generated:///${info.resourcePath}?${info.hash}`
                    : `webpack-yourCode:///${info.resourcePath}`;

            config.output.devtoolFallbackModuleFilenameTemplate = 'webpack:///[resource-path]?[hash]';
        } else {
            //Added this line to drop all console.____ from output in production
            config.optimization.minimizer[0].options.terserOptions.compress.drop_console = true;
        }

        //THis is to fix a Symbol error when using a symlink to ux-core.
        //https://github.com/vuejs/vue-next/issues/2064
        config.resolve.alias.vue = path.resolve('./node_modules/vue');

    }
};