const { generateSW } = require('workbox-build');

generateSW({
    globDirectory: '.next/static',
    globPatterns: ['**/*.{js,css,html,png,jpg,json}'],
    swDest: 'public/sw.js',
    modifyURLPrefix: {
        '': '/_next/static/',
    },
    // Don't cache everything, just safe static assets
    // We can also add runtime caching here
    runtimeCaching: [
        {
            urlPattern: /^https?.*/,
            handler: 'NetworkFirst',
            options: {
                cacheName: 'offlineCache',
                expiration: {
                    maxEntries: 200,
                },
            },
        },
    ],
    skipWaiting: true,
    clientsClaim: true,
}).then(({ count, size }) => {
    console.log(`Generated new Service Worker with ${count} precached files, totaling ${size} bytes.`);
});
