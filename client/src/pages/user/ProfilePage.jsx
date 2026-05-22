import { useState } from 'react';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../../context/AuthContext';
import { authAPI, bookingsAPI, reviewsAPI } from '../../services/api';
import dayjs from 'dayjs';

const schema = yup.object({
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  phone: yup.string().optional(),
});

const ProfilePage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [successMessage, setSuccessMessage] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || '',
    },
  });

  const mutation = useMutation({
    mutationFn: (data) => authAPI.updateMe(data),
    onSuccess: () => {
      setSuccessMessage('Profile updated successfully.');
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });

  const { data: bookingsData } = useQuery({
    queryKey: ['myBookings'],
    queryFn: () => bookingsAPI.getMyBookings(),
  });

  const { data: reviewsData } = useQuery({
    queryKey: ['myReviews'],
    queryFn: () => reviewsAPI.getMyReviews(),
  });

  const onSubmit = (data) => {
    setSuccessMessage('');
    mutation.mutate(data);
  };

  const totalBookings = bookingsData?.data.data.bookings?.length || 0;
  const totalReviews = reviewsData?.data.data.reviews?.length || 0;
  const memberSince = user?.createdAt ? dayjs(user.createdAt).format('YYYY') : dayjs().format('YYYY');

  const getInitials = () => {
    const first = user?.firstName?.[0] || '';
    const last = user?.lastName?.[0] || '';
    return (first + last).toUpperCase() || '?';
  };

  return (
    <div className="min-h-screen bg-background pb-16 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left Column — 4/12 */}
          <div className="lg:col-span-4 flex flex-col gap-6">

            {/* Profile Identity Card */}
            <div className="bg-surface-container-lowest rounded-xl shadow-card-raised p-8 flex flex-col items-center text-center gap-4">
              {/* Avatar */}
              <div className="w-24 h-24 bg-primary-container rounded-full flex items-center justify-center">
                <span className="font-serif text-[32px] text-on-primary">{getInitials()}</span>
              </div>
              <div>
                <h2 className="font-serif text-[24px] text-on-surface break-words">
                  {user?.firstName} {user?.lastName}
                </h2>
                <p className="font-sans text-base text-on-surface-variant mt-1 break-words">{user?.email}</p>
                {user?.role && (
                  <span className="inline-block mt-2 font-sans text-[11px] font-semibold uppercase tracking-widest bg-surface-container text-on-surface-variant px-3 py-1 rounded-full">
                    {user.role}
                  </span>
                )}
              </div>
              <button className="mt-2 inline-flex items-center gap-2 px-6 py-2.5 border border-outline-variant text-on-surface-variant rounded-full font-sans text-[12px] font-semibold uppercase tracking-widest hover:border-secondary hover:text-secondary transition-colors duration-300">
                <span className="material-symbols-outlined text-[16px]">edit</span>
                Edit Profile
              </button>
            </div>

            {/* Stats Bento Grid */}
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <div className="col-span-2 bg-primary-container rounded-xl p-4 md:p-6 flex items-center justify-between">
                <div>
                  <p className="font-sans text-[10px] md:text-[11px] font-semibold uppercase tracking-widest text-white/70 mb-0.5 md:mb-1">
                    Total Bookings
                  </p>
                  <p className="font-serif text-2xl md:text-[32px] text-white leading-none">{totalBookings}</p>
                </div>
                <span className="material-symbols-outlined text-3xl md:text-[40px] text-white/50">luggage</span>
              </div>
              <div className="bg-surface-container-lowest rounded-xl shadow-card-3d p-4 md:p-5">
                <p className="font-sans text-[10px] md:text-[11px] font-semibold uppercase tracking-widest text-on-surface-variant mb-1 md:mb-2">
                  Reviews
                </p>
                <p className="font-serif text-xl md:text-[28px] text-on-surface leading-none">{totalReviews}</p>
                <p className="font-sans text-[10px] md:text-xs text-on-surface-variant mt-0.5 md:mt-1">Written</p>
              </div>
              <div className="bg-surface-container-lowest rounded-xl shadow-card-3d p-4 md:p-5">
                <p className="font-sans text-[10px] md:text-[11px] font-semibold uppercase tracking-widest text-on-surface-variant mb-1 md:mb-2">
                  Member
                </p>
                <p className="font-serif text-xl md:text-[28px] text-on-surface leading-none">{memberSince}</p>
                <p className="font-sans text-[10px] md:text-xs text-on-surface-variant mt-0.5 md:mt-1">Since</p>
              </div>
            </div>
          </div>

          {/* Right Column — 8/12 */}
          <div className="lg:col-span-8">
            <div className="bg-surface-container-lowest rounded-xl shadow-card-raised p-5 md:p-8 md:p-12">
              <h1 className="font-serif text-[28px] md:text-[48px] leading-tight text-on-surface mb-6 md:mb-10">
                Personal Details
              </h1>

              {/* Success Message */}
              {successMessage && (
                <div className="mb-6 bg-surface-container-low border border-secondary/30 rounded-lg p-4 flex items-center gap-3">
                  <span className="material-symbols-outlined text-secondary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <p className="font-sans text-sm text-on-surface">{successMessage}</p>
                </div>
              )}

              {/* Error Message */}
              {mutation.isError && (
                <div className="mb-6 bg-error-container rounded-lg p-4 flex items-center gap-3">
                  <span className="material-symbols-outlined text-on-error-container text-[20px]">error</span>
                  <p className="font-sans text-sm text-on-error-container">
                    {mutation.error?.response?.data?.message || 'Failed to update profile. Please try again.'}
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                {/* First Name + Last Name */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label htmlFor="firstName" className="block font-sans text-[11px] font-semibold uppercase tracking-widest text-on-surface-variant mb-2">
                      First Name
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      {...register('firstName')}
                      className="w-full border-0 border-b border-outline-variant px-0 py-2 bg-transparent font-sans text-base text-on-surface focus:ring-0 focus:border-secondary focus:outline-none transition-colors"
                      placeholder="First name"
                    />
                    {errors.firstName && (
                      <p className="mt-1 font-sans text-sm text-error">{errors.firstName.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="lastName" className="block font-sans text-[11px] font-semibold uppercase tracking-widest text-on-surface-variant mb-2">
                      Last Name
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      {...register('lastName')}
                      className="w-full border-0 border-b border-outline-variant px-0 py-2 bg-transparent font-sans text-base text-on-surface focus:ring-0 focus:border-secondary focus:outline-none transition-colors"
                      placeholder="Last name"
                    />
                    {errors.lastName && (
                      <p className="mt-1 font-sans text-sm text-error">{errors.lastName.message}</p>
                    )}
                  </div>
                </div>

                {/* Email — read-only */}
                <div>
                  <label htmlFor="email" className="block font-sans text-[11px] font-semibold uppercase tracking-widest text-on-surface-variant mb-2">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={user?.email || ''}
                    readOnly
                    className="w-full border-0 border-b border-outline-variant px-0 py-2 bg-transparent font-sans text-base text-on-surface-variant focus:ring-0 focus:outline-none cursor-not-allowed"
                  />
                  <p className="mt-1 font-sans text-xs text-on-surface-variant opacity-60">Email cannot be changed</p>
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="phone" className="block font-sans text-[11px] font-semibold uppercase tracking-widest text-on-surface-variant mb-2">
                    Phone Number
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    {...register('phone')}
                    className="w-full border-0 border-b border-outline-variant px-0 py-2 bg-transparent font-sans text-base text-on-surface focus:ring-0 focus:border-secondary focus:outline-none transition-colors"
                    placeholder="+1 (555) 000-0000"
                  />
                  {errors.phone && (
                    <p className="mt-1 font-sans text-sm text-error">{errors.phone.message}</p>
                  )}
                </div>

                {/* Save Button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={mutation.isPending}
                    className="bg-primary text-on-primary font-sans text-[12px] font-semibold uppercase tracking-widest rounded-full px-10 py-4 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {mutation.isPending ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
