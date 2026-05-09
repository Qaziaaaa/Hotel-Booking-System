import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../../context/AuthContext';

const schema = yup.object({
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  phone: yup.string().optional(),
  password: yup
    .string()
    .min(8, 'Password must be at least 8 characters')
    .required('Password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
});

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: yupResolver(schema) });

  const onSubmit = async (data) => {
    setError('');
    try {
      const { confirmPassword, ...registerData } = data;
      await registerUser(registerData);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
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
            "Your journey to unparalleled luxury begins with a single step."
          </p>
          <div className="w-16 h-[2px] bg-secondary-fixed-dim" />
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center bg-surface-container-lowest px-6 py-12 overflow-y-auto min-h-[calc(100vh-64px)]">
        <div className="w-full max-w-md">
          {/* Brand */}
          <div className="mb-8">
            <Link to="/" className="font-serif text-2xl text-primary-container tracking-wide">
              Ascendant Luxury
            </Link>
            <p className="font-sans text-on-surface-variant mt-2">
              Create your account to begin your luxury experience.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 bg-error-container border border-error/20 rounded-lg p-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-error text-[20px]">error_outline</span>
              <p className="font-sans text-sm text-on-error-container">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* First + Last Name */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block font-sans text-sm font-medium text-on-surface mb-1">
                  First Name
                </label>
                <input
                  id="firstName"
                  type="text"
                  {...register('firstName')}
                  placeholder="John"
                  className="w-full border-0 border-b-2 border-outline-variant bg-white px-4 py-3 font-sans text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-secondary transition-colors"
                />
                {errors.firstName && (
                  <p className="mt-1 font-sans text-xs text-error">{errors.firstName.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="lastName" className="block font-sans text-sm font-medium text-on-surface mb-1">
                  Last Name
                </label>
                <input
                  id="lastName"
                  type="text"
                  {...register('lastName')}
                  placeholder="Doe"
                  className="w-full border-0 border-b-2 border-outline-variant bg-white px-4 py-3 font-sans text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-secondary transition-colors"
                />
                {errors.lastName && (
                  <p className="mt-1 font-sans text-xs text-error">{errors.lastName.message}</p>
                )}
              </div>
            </div>

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

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block font-sans text-sm font-medium text-on-surface mb-1">
                Phone Number <span className="text-on-surface-variant font-normal">(optional)</span>
              </label>
              <input
                id="phone"
                type="tel"
                {...register('phone')}
                placeholder="+1 (555) 123-4567"
                className="w-full border-0 border-b-2 border-outline-variant bg-white px-4 py-3 font-sans text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-secondary transition-colors"
              />
              {errors.phone && (
                <p className="mt-1 font-sans text-sm text-error">{errors.phone.message}</p>
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
              {errors.password ? (
                <p className="mt-1 font-sans text-sm text-error">{errors.password.message}</p>
              ) : (
                <p className="mt-1 font-sans text-xs text-on-surface-variant">Must be at least 8 characters</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block font-sans text-sm font-medium text-on-surface mb-1">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                {...register('confirmPassword')}
                placeholder="••••••••"
                className="w-full border-0 border-b-2 border-outline-variant bg-white px-4 py-3 font-sans text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-secondary transition-colors"
              />
              {errors.confirmPassword && (
                <p className="mt-1 font-sans text-sm text-error">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-primary-container text-on-primary w-full py-4 rounded font-sans font-semibold hover:-translate-y-1 hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {isSubmitting ? 'Creating account...' : 'Create Account'}
              </button>
            </div>
          </form>

          {/* Login link */}
          <p className="mt-8 text-center font-sans text-sm text-on-surface-variant">
            Already have an account?{' '}
            <Link to="/login" className="text-secondary font-medium hover:text-on-secondary-container transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
