import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../ui/LoadingSpinner';
import ErrorMessage from '../ui/ErrorMessage';

const Login = () => {
  const { signIn, resetPassword, loading, error: authError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    if (!email) {
      setError('Please enter your email address');
      setIsLoading(false);
      return;
    }

    if (showResetPassword) {
      // Handle password reset
      const result = await resetPassword(email);
      if (result.success) {
        setSuccess('Password reset email sent! Check your inbox for instructions.');
        setShowResetPassword(false);
      } else {
        setError(result.error || 'Failed to send reset email. Please try again.');
      }
    } else {
      // Handle sign in
      if (!password) {
        setError('Please enter your password');
        setIsLoading(false);
        return;
      }

      const result = await signIn(email, password);
      
      if (!result.success) {
        setError(result.error || 'Failed to sign in. Please check your credentials.');
      }
    }
    
    setIsLoading(false);
  };

  const displayError = error || authError;

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Trade Tracker</h1>
          <p className="text-gray-400">Sign in to access your trading data</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {displayError && (
            <ErrorMessage 
              message={displayError} 
              onDismiss={() => setError(null)}
            />
          )}

          {success && (
            <div className="bg-green-900/20 border border-green-500 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-green-400 text-sm font-medium">{success}</p>
              </div>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading || loading}
              className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#a4fc3c] focus:border-[#a4fc3c] disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="your@email.com"
            />
          </div>

          {!showResetPassword && (
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-400 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading || loading}
                className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#a4fc3c] focus:border-[#a4fc3c] disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="••••••••"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || loading}
            className="w-full bg-[#a4fc3c] text-black font-semibold rounded-lg px-4 py-3 hover:bg-[#8fdd2f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading || loading ? (
              <>
                <LoadingSpinner size="sm" />
                <span>{showResetPassword ? 'Sending...' : 'Signing in...'}</span>
              </>
            ) : (
              showResetPassword ? 'Send Reset Email' : 'Sign In'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          {!showResetPassword ? (
            <button
              type="button"
              onClick={() => {
                setShowResetPassword(true);
                setError(null);
                setSuccess(null);
                setPassword('');
              }}
              className="text-sm text-gray-400 hover:text-[#a4fc3c] transition-colors"
            >
              Forgot your password?
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setShowResetPassword(false);
                setError(null);
                setSuccess(null);
              }}
              className="text-sm text-gray-400 hover:text-[#a4fc3c] transition-colors"
            >
              Back to sign in
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;

