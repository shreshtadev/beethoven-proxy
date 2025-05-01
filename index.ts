import { createProxyMiddleware } from 'http-proxy-middleware';
import { parse } from 'url';

// Configuration
const pocketbaseUrl = 'http://localhost:8090';
const svelteUrl = 'http://localhost:3000';
const proxyPort = 9080; // Or 8080, depending on your setup

// Create proxy middleware
const proxy = createProxyMiddleware({
    //  No target here.  We'll decide dynamically in the router.
    changeOrigin: true,
    ws: true,  // Enable for WebSockets if needed
    logLevel: 'info', // Adjust as needed: 'debug', 'info', 'warn', or 'error'
    onError: (err, req, res) => {
        console.error('Proxy Error:', err);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(`Proxy Error: ${err.message}`);
    },
    //  This is where the magic happens.
    router: (req) => {
        const parsedUrl = parse(req.url, true);
        if (parsedUrl.pathname?.startsWith('/api') || parsedUrl.pathname?.startsWith('/_/')) {
            return pocketbaseUrl;
        } else {
            return svelteUrl;
        }
    },
    //  Optional:  Add headers
    onProxyReq: (proxyReq, req) => {
        proxyReq.headers['X-Forwarded-For'] = req.connection.remoteAddress;
        //  Add other headers as needed
    },
});

// Create Bun server
Bun.serve({
    fetch: (req, server) => {
        // Set CORS headers
        const headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Authorization, Content-Type',
        };

        // Handle preflight requests
        if (req.method === 'OPTIONS') {
            headers['Access-Control-Max-Age'] = '1728000';
            return new Response(null, {
                status: 204,
                headers: headers, // Pass headers in the constructor
            });
        }

        //  Use the proxy.  Adapt Bun's request/response to Node's.
        return new Promise((resolve, reject) => {
            let responseData; // Store the response data
            const nodeRes = {  //  Minimal Node.js response object
                writeHead: (status, headers) => {
                    server.status(status);
                    for (const key in headers) {
                        //  This is where we set the headers on the Bun response
                        server.header(key, headers[key]);
                    }
                },
                end: (data) => {
                    responseData = data; // Store data
                    const response = new Response(responseData, { // Use stored data
                        headers: Object.fromEntries(server.headers),
                    });
                    resolve(response); // Resolve with the constructed Response
                },
                //  Required for http-proxy-middleware
                setHeader: (name, value) => {
                    server.header(name, value);
                },
                // Required for http-proxy-middleware
                getHeader: (name) => {
                    return server.header(name);
                },
                // Required for http-proxy-middleware
                removeHeader: (name) => {
                    server.header(name, undefined);
                }
            };
            //  Call the proxy middleware
            proxy(req, nodeRes, (err) => {
                if (err) {
                    console.error("Error during proxying:", err);
                    const errorResponse = new Response(`Internal Server Error: ${err.message}`, { status: 500 });
                    resolve(errorResponse);
                }
            });
        });
    },
    port: proxyPort,
});

console.log(`Proxy server listening on port ${proxyPort}`);
console.log(`Proxying:`);
console.log(`  /api  => ${pocketbaseUrl}`);
console.log(`  /_/   => ${pocketbaseUrl}`);
console.log(`  Other => ${svelteUrl}`);
