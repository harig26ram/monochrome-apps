import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'tf.monochrome.app',
  appName: 'Monochrome',
  webDir: 'www',
  server: {
    url: 'https://monochrome.tf',
    allowNavigation: [
      '*.monochrome.tf',
      'accounts.google.com',
      '*.google.com',
      'discord.com',
      '*.discord.com',
      'github.com',
      '*.github.com',
    ],
    errorPath: 'index.html',
  },
  assets: {
    iconBackgroundColor: '#000000',
    iconBackgroundColorDark: '#000000',
    splashBackgroundColor: '#000000',
    splashBackgroundColorDark: '#000000',
  },
};

export default config;
