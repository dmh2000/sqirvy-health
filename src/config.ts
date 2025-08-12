// Configuration for the Sqirvy Health application
export interface AppConfig {
  serverHost: string;
  serverPort: number;
}

// Default configuration
const defaultConfig: AppConfig = {
  serverHost: '192.168.1.148',
  serverPort: 3000,
};

// Load configuration from environment variables or use defaults
function loadConfig(): AppConfig {
  const config = { ...defaultConfig };

  // Check for environment variables (for build-time configuration)
  if (typeof window !== 'undefined') {
    // Browser environment - check for runtime config
    const runtimeConfig = (window as any).__SQIRVY_CONFIG__;
    if (runtimeConfig) {
      if (runtimeConfig.serverHost) config.serverHost = runtimeConfig.serverHost;
      if (runtimeConfig.serverPort) config.serverPort = parseInt(runtimeConfig.serverPort, 10);
    }
  }

  // Check for Vite environment variables (build-time)
  if (import.meta.env.VITE_SERVER_HOST) {
    config.serverHost = import.meta.env.VITE_SERVER_HOST;
  }
  if (import.meta.env.VITE_SERVER_PORT) {
    config.serverPort = parseInt(import.meta.env.VITE_SERVER_PORT, 10);
  }

  return config;
}

// Export the loaded configuration
export const config = loadConfig();

// Helper function to get the full API base URL
export function getApiBaseUrl(): string {
  return `http://${config.serverHost}:${config.serverPort}/api`;
}