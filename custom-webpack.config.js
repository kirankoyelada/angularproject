const MomentLocalesPlugin = require('moment-locales-webpack-plugin');
const ReplaceInFileWebpackPlugin = require('replace-in-file-webpack-plugin');
const ENV = "dev";

module.exports = {
  plugins: [
    new MomentLocalesPlugin({
        localesToKeep: ['en']
      })
  ],
}
