// Unified API base URL for both HTTP requests and socket connections.
const isDev = import.meta.env.DEV;

// In dev mode, HTTP requests go through Vite's proxy (empty string prefix),
// and socket also uses the current origin's proxy
const API_BASE_URL = isDev
  ? ''
  : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000');

// Socket URL is now perfectly aligned with API base
export const SOCKET_URL = API_BASE_URL;

// Extract config for PeerJS
export const getPeerConfig = () => {
  if (isDev) {
    // Route PeerJS through the Vite proxy (handles mixed content completely)
    return {
      host: window.location.hostname,
      port: window.location.port, 
      path: '/peerjs',
      secure: window.location.protocol === 'https:'
    };
  }

  // Production fallback
  try {
    const url = new URL(import.meta.env.VITE_API_BASE_URL || 'http://localhost');
    return {
      host: url.hostname,
      port: 9000,
      path: '/peerjs',
      secure: url.protocol === 'https:'
    };
  } catch {
    return { host: 'localhost', port: 9000, path: '/peerjs', secure: false };
  }
};

export default API_BASE_URL;