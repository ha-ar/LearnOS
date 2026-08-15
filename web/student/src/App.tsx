import { useState } from 'react';
import { RegisterPage } from './pages/RegisterPage';
import { PlacementTestPage } from './pages/PlacementTestPage';
import { DashboardPage } from './pages/DashboardPage';
import { clearToken, getToken } from './api';
import { Preferences } from './types';

type Step = 'register' | 'test' | 'dashboard';

export function App() {
  // Returning learners (token already stored) land straight on the dashboard.
  const [step, setStep] = useState<Step>(getToken() ? 'dashboard' : 'register');
  const [name, setName] = useState(localStorage.getItem('learnos_student_name') || 'Learner');
  const [grade, setGrade] = useState('Grade 6');
  const [preferences, setPreferences] = useState<Preferences>({});

  function handleRegistered(info: { name: string; grade: string; preferences: Preferences }) {
    setName(info.name);
    setGrade(info.grade);
    setPreferences(info.preferences);
    localStorage.setItem('learnos_student_name', info.name);
    setStep('test');
  }

  function handleLogout() {
    clearToken();
    localStorage.removeItem('learnos_student_name');
    setStep('register');
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">◇</span> LearnOS
        </div>
        <div className="topbar-sub">Adaptive learning, built around you</div>
      </header>

      <main className="content">
        {step === 'register' && <RegisterPage onRegistered={handleRegistered} />}
        {step === 'test' && (
          <PlacementTestPage grade={grade} preferences={preferences} onComplete={() => setStep('dashboard')} />
        )}
        {step === 'dashboard' && <DashboardPage name={name} onLogout={handleLogout} />}
      </main>
    </div>
  );
}
