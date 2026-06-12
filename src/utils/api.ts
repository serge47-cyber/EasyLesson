/**
 * Resolves the dynamic API base URL depending on the hosting environment.
 * If running on GitHub Pages (github.io), it proxies API calls to the Render live backend.
 * Otherwise, it uses relative paths (for local development, AI Studio, and Render).
 */
export const getApiUrl = (endpoint: string): string => {
  const isGitHubPages = typeof window !== 'undefined' && window.location.hostname.includes('github.io');
  const base = isGitHubPages ? 'https://easylesson.onrender.com' : '';
  return `${base}${endpoint}`;
};
