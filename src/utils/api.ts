/**
 * Resolves the dynamic API base URL depending on the hosting environment.
 * If running on GitHub Pages (github.io), it proxies API calls to the Render live backend.
 * Otherwise, it uses relative paths (for local development, AI Studio, and Render).
 */
export const getApiUrl = (endpoint: string): string => {
  if (typeof window === 'undefined') {
    return endpoint;
  }

  const isGitHubPages = window.location.hostname.includes('github.io');
  
  // Capacitor check: Capacitor injects window.Capacitor, or uses capacitor:// scheme,
  // or runs on localhost WITHOUT a port in native webviews, or is triggered inside mobile user agents.
  const isCapacitor = !!(
    (window as any).Capacitor || 
    window.location.protocol.startsWith('capacitor') || 
    (window.location.hostname === 'localhost' && !window.location.port && window.location.protocol.startsWith('http')) ||
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
  );

  const useLiveBackend = isGitHubPages || isCapacitor;
  const base = useLiveBackend ? 'https://easylesson.onrender.com' : '';

  if (useLiveBackend) {
    console.log(`[API URL Resolver] Redirected to live backend for ${isCapacitor ? 'Capacitor/Mobile' : 'GitHub Pages'}: ${base}${endpoint}`);
  }

  return `${base}${endpoint}`;
};
