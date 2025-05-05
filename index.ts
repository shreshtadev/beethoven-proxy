const express = require('express');
const compression = require('compression');
// const cors = require('cors');
const { createProxyMiddleware, fixRequestBody } = require('http-proxy-middleware');

// Configuration
const pocketbaseUrl = "http://127.0.0.1:8090";
const svelteUrl = 'http://localhost:3000';
const proxyPort = 9080;

// Create Express app
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression());
// app.use(cors());
// Set CORS headers
const allowedOrigins = [
    'http://13.232.178.86:3000',
    'http://13.232.178.86:9080',
    'http://127.0.0.1:3000',
    'http://localhost:3000',
    'http://127.0.0.1:8090',
    'http://localhost:8090',
    'http://localhost:9080',
];
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Max-Age', '1728000');
        return res.sendStatus(200);
    }

    next();
});

// Proxy routes
app.use('/api',  createProxyMiddleware({
        target: pocketbaseUrl+'/api',
        changeOrigin: true,
        onProxyReq: (proxyReq, req, res) => fixRequestBody(proxyReq, req),
        logLevel: 'debug',
    })
);

app.use('/_/',
    createProxyMiddleware({
        target: pocketbaseUrl+'/_/',
        changeOrigin: true,
        onProxyReq: (proxyReq, req, res) => fixRequestBody(proxyReq, req),
        logLevel: 'debug',

    })
);
app.use(
    '/',
    createProxyMiddleware({
        target: svelteUrl,
        changeOrigin: true,
        onProxyReq: (proxyReq, req, res) => fixRequestBody(proxyReq, req),
        logLevel: 'debug',
    })
);

// Start the server
app.listen(proxyPort, () => {
    console.log(`Proxy server listening on port ${proxyPort}`);
    console.log(`Proxying:`);
    console.log(`  FE => ${svelteUrl}`);
});
