import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.aitutor.app',
  appName: 'AI Tutor',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
