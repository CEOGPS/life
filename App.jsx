import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './lib/FirebaseAuthContext';
import { ModelProvider } from "@/contexts/ModelContext";

// ── Loading View ──
const LoadingView = () => (
  <div className="fixed inset-0 bg-slate-950 flex items-center justify-center text-white">
    <div className="flex flex-col items-center gap-4">
      <div className="w-8 h-8 border-4 border-slate-700 border-t-indigo-500 rounded-full animate-spin"></div>
      <p className="text-slate-400 text-sm">Authenticating secure session...</p>
    </div>
  </div>
);

// ── Auth Error View ──
const AuthErrorView = () => {
  const navigate = useNavigate();
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white p-6">
      <div className="w-full max-w-md bg-slate-900 border border-red-800 p-8 rounded-xl shadow-2xl text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-red-400 mb-4">Authentication Failed</h1>
        <p className="text-slate-400 mb-6">Unable to complete authentication. Please try again.</p>
        <button
          onClick={() => navigate('/login', { replace: true })}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-6 rounded-lg transition"
        >
          Return to Login
        </button>
      </div>
    </div>
  );
};

// ── Login View ──
const LoginView = () => {
  const { signInWithGoogle, isLoadingAuth, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const from = location.state?.from?.pathname || '/dashboard';
  const [loginError, setLoginError] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleLogin = async () => {
    setLoginError(null);
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Login failed:', error);
      setLoginError(error.message || 'Authentication failed. Please try again.');
      navigate('/auth-error', { replace: true });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white p-6">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-xl shadow-2xl text-center">
        <div className="mb-6">
          <div className="w-16 h-16 mx-auto bg-indigo-600 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg shadow-indigo-600/20 mb-4">
            ⌘
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-indigo-400">LifeOS Workspace</h1>
          <p className="text-slate-400 mt-2 text-sm">Please authenticate to access your secure instance.</p>
        </div>
        
        {loginError && (
          <div className="mb-4 p-3 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-sm">
            {loginError}
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={isLoadingAuth}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
        >
          {isLoadingAuth ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              Connecting Security Session...
            </>
          ) : (
            'Sign in with Google'
          )}
        </button>
      </div>
    </div>
  );
};

// ── Dashboard View ──
const DashboardView = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout failed:', error);
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <header className="max-w-6xl mx-auto flex items-center justify-between border-b border-slate-800 pb-6 mb-8">
        <div className="flex items-center gap-4">
          {user?.photoURL ? (
            <img 
              src={user.photoURL} 
              alt="User Profile" 
              className="w-12 h-12 rounded-full ring-2 ring-indigo-500 object-cover" 
            />
          ) : (
            <div className="w-12 h-12 rounded-full ring-2 ring-indigo-500 bg-indigo-900 flex items-center justify-center text-xl font-bold">
              {user?.displayName?.charAt(0)?.toUpperCase() ||
                user?.email?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold tracking-tight">{user?.displayName || 'Authorized Member'}</h1>
            <p className="text-xs text-slate-500 font-mono uppercase tracking-wider">{user?.role || 'User'}</p>
          </div>
        </div>
        
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="bg-slate-900 hover:bg-red-950/40 border border-slate-800 hover:border-red-900 text-slate-300 hover:text-red-400 font-medium py-2 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoggingOut ? 'Disconnecting...' : 'Disconnect'}
        </button>
      </header>

      <main className="max-w-6xl mx-auto grid gap-6 md:grid-cols-2">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-md hover:border-indigo-900/50 transition">
          <h2 className="text-lg font-semibold mb-2 text-indigo-400">Secure Instance Details</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Your runtime credentials have been processed and approved through the Cloudflare edge verification loop. 
            All requests sent through this layer include secure cryptographic verification metadata.
          </p>
        </div>
        
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-md hover:border-indigo-900/50 transition font-mono text-xs text-slate-400">
          <p className="text-indigo-400 font-semibold mb-2 font-sans text-sm">Identity Attributes</p>
          <div className="space-y-1">
            <p className="break-all"><span className="text-slate-600">ID:</span> {user?.uid || 'Not available'}</p>
            <p className="break-all"><span className="text-slate-600">Email:</span> {user?.email || 'Not available'}</p>
            {user?.displayName && (
              <p className="break-all"><span className="text-slate-600">Name:</span> {user.displayName}</p>
            )}
            {user?.metadata && (
              <p className="break-all text-slate-500">
                <span className="text-slate-600">Created:</span> {new Date(user.metadata.creationTime).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

// ── Main App Component ──
export default function App() {
  return (
    <BrowserRouter>
      <ModelProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginView />} />
          <Route path="/auth-error" element={<AuthErrorView />} />

          {/* Protected Routes */}
          <Route 
            element={
              <ProtectedRoute 
                fallback={<LoadingView />} 
                unauthenticatedElement={<Navigate to="/login" replace />} 
              />
            }
          >
            <Route path="/dashboard" element={<DashboardView />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </ModelProvider>
    </BrowserRouter>
  );
}