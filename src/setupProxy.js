// src/setupProxy.js
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://10.220.115.68:5000',
      changeOrigin: true,
      secure: false,
      logLevel: 'debug',
      onProxyRes: (proxyRes, req, res) => {
        console.log(`[Proxy] ${req.method} ${req.url} => ${proxyRes.statusCode}`);
      }
    })
  );
};
