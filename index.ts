const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();

// Configuration
const pocketbaseUrl = 'http://localhost:8090';
const svelteUrl = 'http://localhost:3000';
const proxyPort = 9080;

// Proxy middleware
const proxy = createProxyMiddleware({
    router: {
        '/api': pocketbaseUrl,
        '/_/': pocketbaseUrl,
        '/': svelteUrl,  //  This catches all other requests and sends them to svelte
    },
    changeOrigin: true,
    ws: true,
    logLevel: 'info',
    onProxyRes: function (proxyRes, req, res) {
        // Set CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
        if (req.method === 'OPTIONS') {
           res.setHeader('Access-Control-Max-Age', '1728000');
           res.writeHead(204);
           res.end();
        }
    }
});

// Use the proxy middleware
app.use('/', proxy);

// Start the server
app.listen(proxyPort, () => {
    console.log(`Proxy server listening on port ${proxyPort}`);
    console.log(`Proxying:`);
    console.log(`  /api  => ${pocketbaseUrl}`);
    console.log(`  /_/   => ${pocketbaseUrl}`);
    console.log(`  Other => ${svelteUrl}`);
});
