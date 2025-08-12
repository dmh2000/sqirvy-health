# Configuration Guide

This document explains how to configure the Sqirvy Health application to connect to a server at a specific IP address.

## Methods to Configure Server Address

### 1. Environment Variables (Build-time)

Create a `.env` file in the project root:

```bash
# Copy the example file
cp .env.example .env

# Edit the values
VITE_SERVER_HOST=192.168.1.148
VITE_SERVER_PORT=3000
```

Then rebuild the application:

```bash
npm run build
```

### 2. Runtime Configuration (Deployment-time)

Edit the `index.html` file before deploying:

```html
<script>
  window.__SQIRVY_CONFIG__ = {
    serverHost: "192.168.1.148", // Change this to your server IP
    serverPort: "3000",
  };
</script>
```

This method allows you to change the server address without rebuilding the application.

### 3. Quick Runtime Override

For testing or temporary changes, you can override the configuration in the browser console:

```javascript
window.__SQIRVY_CONFIG__ = {
  serverHost: "192.168.1.148",
  serverPort: "3000",
};
// Then refresh the page
```

## Examples

### Local Development

```javascript
window.__SQIRVY_CONFIG__ = {
  serverHost: "localhost",
  serverPort: "3000",
};
```

### Network Server

```javascript
window.__SQIRVY_CONFIG__ = {
  serverHost: "192.168.1.148",
  serverPort: "3000",
};
```

### Docker Container

```javascript
window.__SQIRVY_CONFIG__ = {
  serverHost: "sqirvy-server", // Container name
  serverPort: "3000",
};
```

## Configuration Priority

The configuration is loaded in this order (later values override earlier ones):

1. Default values (localhost:3000)
2. Environment variables (`VITE_SERVER_HOST`, `VITE_SERVER_PORT`)
3. Runtime configuration (`window.__SQIRVY_CONFIG__`)

## Notes

- The server must be configured to listen on `0.0.0.0` to accept connections from other devices
- Make sure the port is accessible and not blocked by firewalls
- For HTTPS deployments, update the config to use `https://` URLs
