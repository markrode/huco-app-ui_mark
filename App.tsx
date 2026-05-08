import { AuthProvider } from './src/context/AuthContext';
import { AppProvider } from './src/context/AppContext';
import { ToastProvider } from './src/components/Toast';
import OnboardingTour from './src/components/OnboardingTour';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <ToastProvider>
          <AppNavigator />
          <OnboardingTour />
        </ToastProvider>
      </AppProvider>
    </AuthProvider>
  );
}
