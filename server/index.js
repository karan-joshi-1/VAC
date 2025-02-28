const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');
const app = express();
const port = process.env.PORT || 3001;

// Allow requests from your React app
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://10.220.115.68:3000');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Proxy all /api/mlflow requests to MLflow server
app.use(
  '/api/mlflow',
  createProxyMiddleware({
    target: 'http://10.220.115.68:5000',
    changeOrigin: true,
    pathRewrite: {
      '^/api/mlflow': '/api/2.0/mlflow', // Rewrite path
    },
  })
);

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../build', 'index.html'));
  });
}

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});