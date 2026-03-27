const { expo: baseConfig } = require('./app.json');

const mapboxDownloadToken =
  process.env.RNMAPBOX_MAPS_DOWNLOAD_TOKEN || process.env.MAPBOX_SECRET_TOKEN;
const mapboxPublicToken = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
const isEasBuild = process.env.EAS_BUILD === 'true';

if (isEasBuild && !mapboxDownloadToken) {
  throw new Error('RNMAPBOX_MAPS_DOWNLOAD_TOKEN is required for native Mapbox builds.');
}

if (mapboxDownloadToken) {
  process.env.RNMAPBOX_MAPS_DOWNLOAD_TOKEN = mapboxDownloadToken;
}

if (isEasBuild && !mapboxPublicToken) {
  throw new Error('EXPO_PUBLIC_MAPBOX_TOKEN is required so the shipped app renders the live map.');
}

module.exports = ({ config }) => ({
  ...config,
  ...baseConfig,
});
