const express = require('express');
const compression = require('compression');
// const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

// Configuration
const pocketbaseUrl = "http://13.232.178.86:8090";
const svelteUrl = 'http://13.232.178.86:3000';
const proxyPort = 9080;
const proxyHost = '0.0.0.0';

// Create Express app
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression());
// app.use(cors());
// Set CORS headers
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
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
        logLevel: 'debug',
    })
);

app.use('/_/',
    createProxyMiddleware({
        target: pocketbaseUrl+'/_/',
        changeOrigin: true,
        logLevel: 'debug',

    })
);
app.use(
    '/',
    createProxyMiddleware({
        target: svelteUrl,
        changeOrigin: true,
        logLevel: 'debug',
    })
);

// Start the server
app.listen(proxyPort, proxyHost, () => {
    console.log(`Proxy server listening on port ${proxyPort}`);
    console.log(`Proxying:`);
    console.log(`  FE => ${svelteUrl}`);
});
