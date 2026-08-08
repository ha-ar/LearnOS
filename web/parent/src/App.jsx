import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { Navbar } from './components/Navbar';
import { LoginPage } from './pages/LoginPage';
import { LatestReportPage } from './pages/LatestReportPage';
import { ReportHistoryPage } from './pages/ReportHistoryPage';
import { ProgressOverviewPage } from './pages/ProgressOverviewPage';

function ProtectedLayout() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="page-layout">
      <Navbar />
      <main className="main-container">
        <Outlet />
      </main>
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<ProtectedLayout />}>
            <Route path="/report/latest" element={<LatestReportPage />} />
            <Route path="/history" element={<ReportHistoryPage />} />
            <Route path="/overview" element={<ProgressOverviewPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/report/latest" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
