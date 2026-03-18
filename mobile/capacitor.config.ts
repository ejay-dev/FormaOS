import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.formaos.mobile',
  appName: 'FormaOS',
  server: {
    url: 'https://app.formaos.com.au',
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0A0A0A',
      androidSplashResourceName: 'splash',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#0A0A0A'
    },
    App: {
      launchAutoHide: false
    },
    Keyboard: {
      resizeOnFullScreen: true
    }
  },
  ios: {
    scheme: 'FormaOS'
  },
  android: {
    buildOptions: {
      keystorePath: '',
      keystoreAlias: '',
      keystorePassword: '',
      keystoreAliasPassword: '',
      releaseType: 'APK'
    }
  }
};

export default config;