import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import LandingPage from './components/LandingPage';
import GLIFPrototype from './GLIFPrototype';
import InvoiceApproval from './InvoiceApproval';
import ContractReview from './ContractReview';
import VendorAudit from './VendorAudit';
import LoginModal from './components/LoginModal';
import { isAuthenticated } from './utils/auth';
import './index.css';

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [authChecked, setAuthChecked] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      if (!isAuthenticated()) {
        setShowLogin(true);
      }
      setAuthChecked(true);
    };
    checkAuth();
  }, []);

  const handleLogin = () => {
    setShowLogin(false);
    // Reload to refresh auth state
    window.location.reload();
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated()) {
    return (
      <>
        <LoginModal
          isOpen={showLogin}
          onClose={() => window.location.href = '/'}
          onLogin={handleLogin}
        />
      </>
    );
  }

  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route 
          path="/audit-oversight" 
          element={
            <ProtectedRoute>
              <GLIFPrototype />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/invoice-approval" 
          element={
            <ProtectedRoute>
              <InvoiceApproval />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/contract-review" 
          element={
            <ProtectedRoute>
              <ContractReview />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/vendor-audit" 
          element={
            <ProtectedRoute>
              <VendorAudit />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

