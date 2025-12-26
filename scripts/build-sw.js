const { generateSW } = require('workbox-build');
const { version } = require('../package.json');

// Use app version + build timestamp for guaranteed cache busting
const BUILD_TIMESTAMP = Date.now();
const CACHE_VERSION = `${version.replace(/\./g, '-')}-${BUILD_TIMESTAMP}`;

generateSW({
    globDirectory: '.next/static',
    globPatterns: ['**/*.{js,css,html,png,jpg,json}'],
    swDest: 'public/sw.js',
    modifyURLPrefix: {
        '': '/_next/static/',
    },
    // CRITICAL: Force immediate activation of new service workers
    skipWaiting: true,
    clientsClaim: true,
    // Use versioned cache names to force cache invalidation
    cacheId: `finance-flow-v${CACHE_VERSION}`,
    // Don't cache everything, just safe static assets
    runtimeCaching: [
        {
            urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
                cacheName: `google-fonts-v${CACHE_VERSION}`,
                expiration: {
                    maxEntries: 4,
                    maxAgeSeconds: 365 * 24 * 60 * 60,
                },
            },
        },
        {
            urlPattern: /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
                cacheName: `static-font-assets-v${CACHE_VERSION}`,
                expiration: {
                    maxEntries: 4,
                    maxAgeSeconds: 7 * 24 * 60 * 60,
                },
            },
        },
        {
            urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
                cacheName: `static-image-assets-v${CACHE_VERSION}`,
                expiration: {
                    maxEntries: 64,
                    maxAgeSeconds: 24 * 60 * 60,
                },
            },
        },
        {
            urlPattern: /\/_next\/image\?url=.+$/i,
            handler: 'StaleWhileRevalidate',
            options: {
                cacheName: `next-image-v${CACHE_VERSION}`,
                expiration: {
                    maxEntries: 64,
                    maxAgeSeconds: 24 * 60 * 60,
                },
            },
        },
        {
            urlPattern: /\.(?:js)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
                cacheName: `static-js-assets-v${CACHE_VERSION}`,
                expiration: {
                    maxEntries: 32,
                    maxAgeSeconds: 24 * 60 * 60,
                },
            },
        },
        {
            urlPattern: /\.(?:css|less)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
                cacheName: `static-style-assets-v${CACHE_VERSION}`,
                expiration: {
                    maxEntries: 32,
                    maxAgeSeconds: 24 * 60 * 60,
                },
            },
        },
        // API calls should NOT be cached
        // Removed the catch-all handler to prevent API caching
    ],
}).then(({ count, size }) => {
    console.log(`Generated new Service Worker v${version} with ${count} precached files, totaling ${size} bytes.`);
});
