import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { AuthProvider } from './src/context/AuthContext';
import { AppProvider } from './src/context/AppContext';
import { ToastProvider } from './src/components/Toast';
import OnboardingTour from './src/components/OnboardingTour';
import AppNavigator from './src/navigation/AppNavigator';
import { addNotificationResponseListener } from './src/lib/notifications';

export default function App() {
  const navigationRef = useRef<any>(null);

  useEffect(() => {
    const sub = addNotificationResponseListener((screen) => {
      navigationRef.current?.navigate(screen);
    });
    return () => sub.remove();
  }, []);

  return (
    <AuthProvider>
      <AppProvider>
        <ToastProvider>
          <AppNavigator navigationRef={navigationRef} />
          <OnboardingTour />
        </ToastProvider>
      </AppProvider>
    </AuthProvider>
  );
}
