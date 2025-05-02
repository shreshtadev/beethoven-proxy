const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

// Configuration
const pocketbaseUrl = "http://3.109.250.92:8090";
const svelteUrl = 'http://13.232.178.86:3000';
const proxyPort = 9080;

// Create Express app
const app = express();

// Set CORS headers
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://13.232.178.86:3000');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*, Authorization, Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Max-Age', '1728000');
        return res.sendStatus(200);
    }

    next();
});

// Proxy routes
app.use(
    '/api',
    createProxyMiddleware({
        target: `${pocketbaseUrl}/api`,
        changeOrigin: true,
    })
);
app.use(
    '/_/',
    createProxyMiddleware({
        target: `${pocketbaseUrl}/_/`,
        changeOrigin: true,
    })
);
app.use(
    '/',
    createProxyMiddleware({
        target: svelteUrl,
        changeOrigin: true,
    })
);

// Start the server
app.listen(proxyPort, () => {
    console.log(`Proxy server listening on port ${proxyPort}`);
    console.log(`Proxying:`);
    console.log(`  FE => ${svelteUrl}`);
});
