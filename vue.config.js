
// eslint-disable-next-line no-undef
module.exports = {

    //Needed to compile templates from string client side which is used by, at time of writing, card ux. Adds about 60kB to the vendor bundle
    runtimeCompiler: true,

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
    }
};