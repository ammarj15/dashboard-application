import { useState } from 'react';
import LoginForm from './loginForm';
import RegistrationForm from './registerForm';

export default function AuthPage({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);

  const handleLoginSuccess = (token) => {
    localStorage.setItem('token', token);
    onLoginSuccess();
  };

  const handleRegistrationSuccess = () => {
    setIsLogin(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="w-full max-w-md">
        {isLogin ? (
          <LoginForm onLoginSuccess={handleLoginSuccess} />
        ) : (
          <RegistrationForm onRegistrationSuccess={handleRegistrationSuccess} />
        )}
        <p className="mt-4 text-center text-white">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            className="text-light-blue underline"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? 'Register' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
}