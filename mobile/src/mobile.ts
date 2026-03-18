import { App } from '@capacitor/app';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard } from '@capacitor/keyboard';

class FormaOSMobile {
  constructor() {
    this.init();
  }

  async init() {
    try {
      // Configure status bar for dark theme
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: '#0A0A0A' });

      // Handle app state changes
      App.addListener('appStateChange', ({ isActive }) => {
        console.log('App state changed. Is active:', isActive);
      });

      // Handle deep links
      App.addListener('appUrlOpen', (event) => {
        console.log('App opened with URL:', event);
        // Handle auth redirects and deep links
        this.handleDeepLink(event.url);
      });

      // Handle back button (Android)
      App.addListener('backButton', ({ canGoBack }) => {
        if (canGoBack) {
          window.history.back();
        } else {
          App.exitApp();
        }
      });

      // Keyboard handling for better mobile UX
      Keyboard.addListener('keyboardWillShow', (info) => {
        document.body.style.height = `${window.innerHeight - info.keyboardHeight}px`;
      });

      Keyboard.addListener('keyboardWillHide', () => {
        document.body.style.height = 'initial';
      });

      // Hide splash screen after app is ready
      await this.waitForAppReady();
      await SplashScreen.hide();

    } catch (error) {
      console.error('Error initializing FormaOS Mobile:', error);
    }
  }

  private async waitForAppReady(): Promise<void> {
    return new Promise((resolve) => {
      if (document.readyState === 'complete') {
        resolve();
      } else {
        window.addEventListener('load', () => resolve());
      }
    });
  }

  private handleDeepLink(url: string) {
    // Handle auth redirects and deep links
    if (url.includes('/auth/callback')) {
      // Redirect to auth callback
      window.location.href = url;
    }
  }

  // Mobile-specific optimizations
  optimizeForMobile() {
    // Add mobile-specific CSS classes
    document.body.classList.add('mobile-app', 'capacitor-app');
    
    // Disable text selection for better mobile feel
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';
    
    // Improve touch responsiveness
    document.body.style.touchAction = 'manipulation';
    
    // Add viewport meta tag if not present
    if (!document.querySelector('meta[name="viewport"]')) {
      const viewport = document.createElement('meta');
      viewport.name = 'viewport';
      viewport.content = 'width=device-width, initial-scale=1.0, viewport-fit=cover';
      document.head.appendChild(viewport);
    }
  }
}

// Initialize the mobile app
document.addEventListener('DOMContentLoaded', () => {
  const formaOSMobile = new FormaOSMobile();
  formaOSMobile.optimizeForMobile();
});

export default FormaOSMobile;