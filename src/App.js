import React, { useState } from 'react';
import './App.css';
import OnboardingScreen from './components/OnboardingScreen';
import HomeScreen from './components/HomeScreen';

function App() {
  const [currentScreen, setCurrentScreen] = useState('onboarding');

  const handleGetStarted = () => {
    setCurrentScreen('home');
  };

  const handleLogin = () => {
    setCurrentScreen('home');
  };

  return (
    <div className="App">
      {currentScreen === 'onboarding' ? (
        <OnboardingScreen 
          onGetStarted={handleGetStarted}
          onLogin={handleLogin}
        />
      ) : (
        <HomeScreen />
      )}
    </div>
  );
}

export default App;
