import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../../context/AuthContext';

const schema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().required('Password is required'),
});

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const from = location.state?.from?.pathname || '/';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: yupResolver(schema) });

  const onSubmit = async (data) => {
    setError('');
    try {
      await login(data);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    }
  };

  return (
    <div className="flex flex-1 min-h-[calc(100vh-64px)]">
      {/* Left panel — hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-end p-16 overflow-hidden bg-primary-container flex-shrink-0">
        {/* Background image */}
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDKBegyy60_trtcH2gY3PKGM91jWln6MHr53cCwwWjpEyjfxyG3VgIx6I2uYp09kYR0YvEj-jMCZQeau3Xu8HMTDFIJUbBJvJN5ZF_T0zRsNYI_j9JY9GeEqUZxa8p5mz0fJtgnmlvcdwtfAZTkv4_Rky_qI2gCIZhgyXOdKCGALgOQArnUGoZwH5TzUPYqZZX81gzF4tFcbSbdiGOEo3PU5G6fMy0d3aYX-k9r_MZIZKDSoY8upQXKV5wYyb7mbea0xm--_B6poFA"
          alt="Luxury hotel lobby"
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-primary-container via-primary-container/70 to-transparent" />
        {/* Quote */}
        <div className="relative z-10">
          <p className="font-serif text-[40px] leading-tight text-secondary-fixed-dim mb-6">
            "Exclusivity is not just a destination; it is an experience meticulously crafted."
          </p>
          <div className="w-16 h-[2px] bg-secondary-fixed-dim" />
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center bg-surface-container-lowest px-6 py-12 overflow-y-auto min-h-[calc(100vh-64px)]">
        <div className="w-full max-w-md">
          {/* Brand */}
          <div className="mb-10">
            <Link to="/" className="font-serif text-2xl text-primary-container tracking-wide">
              Ascendant Luxury
            </Link>
            <p className="font-sans text-on-surface-variant mt-2">
              Welcome back. Please enter your credentials.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 bg-error-container border border-error/20 rounded-lg p-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-error text-[20px]">error_outline</span>
              <p className="font-sans text-sm text-on-error-container">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block font-sans text-sm font-medium text-on-surface mb-1">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                {...register('email')}
                placeholder="you@example.com"
                className="w-full border-0 border-b-2 border-outline-variant bg-white px-4 py-3 font-sans text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-secondary transition-colors"
              />
              {errors.email && (
                <p className="mt-1 font-sans text-sm text-error">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block font-sans text-sm font-medium text-on-surface mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  {...register('password')}
                  placeholder="••••••••"
                  className="w-full border-0 border-b-2 border-outline-variant bg-white px-4 py-3 pr-12 font-sans text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-secondary transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-on-surface-variant hover:text-on-surface transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <span className="material-symbols-outlined text-[22px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 font-sans text-sm text-error">{errors.password.message}</p>
              )}
            </div>

            {/* Remember me + Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="w-4 h-4 rounded border-outline-variant text-secondary focus:ring-secondary"
                />
                <span className="font-sans text-sm text-on-surface">Remember me</span>
              </label>
              <a href="#" className="font-sans text-sm text-secondary hover:text-on-secondary-container transition-colors">
                Forgot password?
              </a>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary-container text-on-primary w-full py-4 rounded font-sans font-semibold hover:-translate-y-1 hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Register link */}
          <p className="mt-8 text-center font-sans text-sm text-on-surface-variant">
            Don't have an account?{' '}
            <Link to="/register" className="text-secondary font-medium hover:text-on-secondary-container transition-colors">
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
