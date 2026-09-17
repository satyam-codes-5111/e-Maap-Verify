import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'gov.in.doca.emaap',
  appName: 'e-Maap Verify',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
