const { expo: baseConfig } = require('./app.json');

const mapboxDownloadToken =
  process.env.RNMAPBOX_MAPS_DOWNLOAD_TOKEN || process.env.MAPBOX_SECRET_TOKEN;
const mapboxPublicToken = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
const isEasBuild = process.env.EAS_BUILD === 'true';
const googleIosUrlScheme = process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME;

if (isEasBuild && !mapboxDownloadToken) {
  throw new Error('RNMAPBOX_MAPS_DOWNLOAD_TOKEN is required for native Mapbox builds.');
}

if (mapboxDownloadToken) {
  process.env.RNMAPBOX_MAPS_DOWNLOAD_TOKEN = mapboxDownloadToken;
}

if (isEasBuild && !mapboxPublicToken) {
  throw new Error('EXPO_PUBLIC_MAPBOX_TOKEN is required so the shipped app renders the live map.');
}

function configureGooglePlugin(plugins = []) {
  return plugins.map((plugin) => {
    const pluginName = Array.isArray(plugin) ? plugin[0] : plugin;

    if (pluginName !== '@react-native-google-signin/google-signin' || !googleIosUrlScheme) {
      return plugin;
    }

    const pluginOptions = Array.isArray(plugin) && typeof plugin[1] === 'object' ? plugin[1] : {};
    return [
      '@react-native-google-signin/google-signin',
      {
        ...pluginOptions,
        iosUrlScheme: googleIosUrlScheme,
      },
    ];
  });
}

module.exports = ({ config }) => ({
  ...config,
  ...baseConfig,
  plugins: configureGooglePlugin(baseConfig.plugins),
});
