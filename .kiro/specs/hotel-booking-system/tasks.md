# Implementation Plan: Hotel Booking System — Gap Completion

## Overview

This plan covers the 13 implementation gaps identified in §11.2 of the design document. All tasks assume the existing skeleton (auth, hotels, rooms, bookings, reviews, email, analytics, AI/chatbot, frontend routing and contexts) is already in place. Tasks are ordered by dependency: database schema first, then server-side services and routes, then client-side integration, then the test suite.

## Tasks

- [x] 1. Add FcmToken model to Prisma schema and run migration
  - In `server/prisma/schema.prisma`, add the `FcmToken` model with fields `id`, `userId` (`@unique`), `token`, `createdAt`, `updatedAt`, and a relation back to `User` with `onDelete: Cascade`; map to `"fcm_tokens"`
  - Add `fcmTokens FcmToken[]` relation field to the existing `User` model
  - Change `Booking.status` default from `PENDING` to `CONFIRMED` to match the design and existing `bookingService.js` behaviour
  - Run `npx prisma migrate dev --name add-fcm-token` inside the `server/` directory to generate and apply the migration
  - Run `npx prisma generate` to regenerate the Prisma client
  - _Requirements: 15.1, 15.2, 24.1_

- [x] 2. Implement NotificationService
  - Create `server/server/services/notificationService.js`
  - Install `firebase-admin` as a production dependency in `server/package.json`
  - Initialise the Firebase Admin SDK at module load time using `JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)` as the credential; guard against double-initialisation with `getApps().length === 0`
  - Implement `registerToken(userId, token)` — upsert `FcmToken` by `userId` using `prisma.fcmToken.upsert({ where: { userId }, create: { userId, token }, update: { token } })`
  - Implement `sendNotification(userId, { title, body })` — look up the `FcmToken` for `userId`; return silently if none found; call `firebase.messaging().send({ token, notification: { title, body } })`; on FCM error log the error and delete the invalid token via `prisma.fcmToken.delete({ where: { userId } })`
  - Implement `sendBookingConfirmedNotification(booking)` — calls `sendNotification` with title `"Booking Confirmed"` and body `"${booking.hotel.name} — Check-in: ${booking.checkIn.toLocaleDateString()}"`
  - Implement `sendBookingCancelledNotification(booking)` — calls `sendNotification` with title `"Booking Cancelled"` and body `"${booking.hotel.name}"`
  - Implement `sendReminderNotification(booking)` — calls `sendNotification` with title `"Check-in Tomorrow"` and body `"${booking.hotel.name} — Check-in: ${booking.checkIn.toLocaleDateString()}"`
  - _Requirements: 15.2, 15.3, 15.4, 15.5, 15.6, 15.7, 15.8, 24.2, 24.3_

- [x] 3. Implement notification route and controller
  - [x] 3.1 Create `server/server/controllers/notificationController.js`
    - Import `notificationService` and `catchAsync`
    - Implement `registerToken` handler: validate that `req.body.token` is present (throw `AppError('Token is required', 400)` if missing); call `notificationService.registerToken(req.user.id, req.body.token)`; respond `200` with `{ status: 'success', message: 'Token registered' }`
    - _Requirements: 15.1, 24.4_

  - [x] 3.2 Create `server/server/routes/notificationRoutes.js`
    - Define `POST /register-token` protected by the `protect` middleware, handled by `registerToken` controller
    - _Requirements: 15.1, 24.4_

  - [x] 3.3 Register notification routes in `server/app.js`
    - Import `notificationRoutes` and mount at `/api/notifications`
    - _Requirements: 15.1_

- [x] 4. Wire push notifications into BookingService
  - In `server/server/services/bookingService.js`, import `notificationService`
  - In `createBooking`, after the existing email `try/catch` block, add a second `try/catch` that calls `notificationService.sendBookingConfirmedNotification(booking)`; log errors but do not re-throw
  - In `cancelBooking`, after the existing email `try/catch` block, add a second `try/catch` that calls `notificationService.sendBookingCancelledNotification(updatedBooking)`; log errors but do not re-throw
  - _Requirements: 9.7, 11.8_

- [x] 5. Extend ReminderJob: mark COMPLETED bookings and send push reminders
  - In `server/server/jobs/reminderEmails.js`, import `notificationService`
  - At the start of the cron callback (before the reminder email block), query all `CONFIRMED` bookings where `checkOut < new Date()` and bulk-update their status to `COMPLETED` using `prisma.booking.updateMany({ where: { status: 'CONFIRMED', checkOut: { lt: new Date() } }, data: { status: 'COMPLETED' } })`; log the count of updated records
  - Inside the per-booking reminder loop, after the existing `sendReminderEmail` call, add a `try/catch` that calls `notificationService.sendReminderNotification(booking)`; log errors and continue
  - _Requirements: 12.1, 15.5_

- [x] 6. Add PATCH /api/auth/me profile update endpoint
  - [x] 6.1 Add `updateMe` to `server/server/services/authService.js`
    - Implement `updateMe(userId, { firstName, lastName, phone })` — use `prisma.user.update({ where: { id: userId }, data: { firstName, lastName, phone }, select: { id, email, firstName, lastName, phone, role } })` and return the updated user
    - _Requirements: 4.2_

  - [x] 6.2 Add `updateMe` handler to `server/server/controllers/authController.js`
    - Import `updateMe` from `authService`
    - Implement `updateMe` handler using `catchAsync`: extract `firstName`, `lastName`, `phone` from `req.body`; call `authService.updateMe(req.user.id, { firstName, lastName, phone })`; respond `200` with `{ status: 'success', data: { user } }`
    - _Requirements: 4.2_

  - [x] 6.3 Register the route in `server/server/routes/authRoutes.js`
    - Import `updateMe` from the controller
    - Add `router.patch('/me', protect, updateMe)`
    - _Requirements: 4.2_

  - [x] 6.4 Add `updateMe` to `client/src/services/api.js`
    - Add `updateMe: (data) => api.patch('/auth/me', data)` to the `authAPI` object
    - _Requirements: 4.2, 4.4_

  - [x] 6.5 Wire profile update form in `client/src/pages/user/ProfilePage.jsx`
    - Replace the static display with an editable form for `firstName`, `lastName`, and `phone` pre-populated from `useAuth().user`
    - Use `useMutation` calling `authAPI.updateMe`; on success update the `AuthContext` user state and show a success toast/notification
    - _Requirements: 4.4_

- [x] 7. Client FCM integration
  - [x] 7.1 Create `client/src/config/firebase.js`
    - Install `firebase` as a client dependency
    - Initialise the Firebase app using `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, and `VITE_FIREBASE_APP_ID` env vars
    - Export `messaging` obtained from `getMessaging(app)`
    - _Requirements: 15.1_

  - [x] 7.2 Create `client/src/hooks/useFCM.js`
    - Implement a custom hook that requests `Notification.permission`; if granted, calls `getToken(messaging, { vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY })`; POSTs the token to `/api/notifications/register-token` via `api.post`; handles and logs errors silently
    - Export `useFCM` as the default export
    - _Requirements: 15.1_

  - [x] 7.3 Call `useFCM()` inside `client/src/context/AuthContext.jsx`
    - Import `useFCM` and invoke it inside `AuthProvider` conditionally when `isAuthenticated` is `true`, so the token is registered (or refreshed) on every authenticated session
    - _Requirements: 15.1_

- [x] 8. Migrate client pages to TanStack Query
  - [x] 8.1 Migrate `HotelListPage` (`client/src/pages/hotels/HotelListPage.jsx`)
    - Confirm `useQuery(['hotels', { location, page }])` is already wired; extend the query key to include `checkIn`, `checkOut`, and `guests` from `searchParams` so availability-aware searches re-fetch correctly
    - _Requirements: 5.6, 20.1_

  - [x] 8.2 Migrate `HotelDetailPage` (`client/src/pages/hotels/HotelDetailPage.jsx`)
    - Confirm `useQuery(['hotel', id])` and `useQuery(['rooms', id, { checkIn, checkOut, guests }])` are already wired; add a separate `useQuery(['reviews', id, page])` that calls `reviewsAPI.getByHotel(id, { page, limit: 5 })` and renders paginated reviews below the existing static slice
    - _Requirements: 6.1, 13.9, 20.1_

  - [x] 8.3 Migrate `MyBookingsPage` (`client/src/pages/bookings/MyBookingsPage.jsx`)
    - Confirm `useQuery(['myBookings'])` and `useMutation` for cancel are already wired; ensure the cancel mutation invalidates both `['myBookings']` and `['rooms', hotelId]` caches
    - _Requirements: 11.9, 20.3_

  - [x] 8.4 Migrate `BookingPage` (`client/src/pages/bookings/BookingPage.jsx`)
    - Confirm `useMutation` for `createBooking` is already wired; ensure `onSuccess` invalidates `['myBookings']` and `['rooms', hotelId]` via `queryClient.invalidateQueries`
    - _Requirements: 9.8, 20.3_

  - [x] 8.5 Migrate `DashboardPage` (`client/src/pages/admin/DashboardPage.jsx`)
    - Confirm `useQuery(['dashboardAnalytics', period])` is already wired; no changes needed for this page
    - _Requirements: 17.5, 20.1_

  - [x] 8.6 Migrate `ProfilePage` (`client/src/pages/user/ProfilePage.jsx`)
    - The `useMutation` for `updateMe` is added as part of task 6.5; no additional query migration needed
    - _Requirements: 4.4, 20.1_

- [x] 9. Wire React Hook Form + Yup validation to all forms
  - [x] 9.1 Wire validation to `LoginPage` (`client/src/pages/auth/LoginPage.jsx`)
    - Replace manual `useState` form state with `useForm` from `react-hook-form` and `yupResolver` from `@hookform/resolvers/yup`
    - Define a Yup schema: `email` must be a valid email format and required; `password` is required
    - Replace the `<input>` elements with `register()`-wired inputs; display inline `<p>` error messages using `formState.errors`
    - _Requirements: 2.7_

  - [x] 9.2 Wire validation to `RegisterPage` (`client/src/pages/auth/RegisterPage.jsx`)
    - Replace manual `useState` form state with `useForm` + `yupResolver`
    - Define a Yup schema: `firstName` and `lastName` required; `email` valid email format and required; `password` min 8 characters and required; `confirmPassword` must match `password` using `yup.ref`
    - Display inline error messages per field; remove the manual length and match checks from `handleSubmit`
    - _Requirements: 1.7_

  - [x] 9.3 Wire validation to `BookingPage` (`client/src/pages/bookings/BookingPage.jsx`)
    - Add a Yup schema for the booking form: `checkIn` must not be in the past; `checkOut` must be strictly after `checkIn`; `guests` must be `>= 1` and `<= room.capacity`
    - Wire `useForm` to the special-requests textarea and the hidden date/guest fields; block `handleBooking` submission if validation fails and display inline errors
    - _Requirements: 9.9_

  - [x] 9.4 Wire validation to `HomePage` search form (`client/src/pages/HomePage.jsx`)
    - Add a Yup schema: `checkIn` not in the past; `checkOut` after `checkIn`; `guests` >= 1
    - Wire `useForm` to the search form inputs; display inline error messages below each field; block navigation if validation fails
    - _Requirements: 19.4_

  - [x] 9.5 Wire validation to `ReviewModal` (`client/src/components/ReviewModal.jsx`)
    - Add a Yup schema: `rating` required and must be between 1 and 5
    - Wire `useForm` to the star-rating selection and comment textarea; display an inline error if the user attempts to submit without selecting a rating
    - _Requirements: 13.4_

  - [x] 9.6 Wire validation to `ProfilePage` form (`client/src/pages/user/ProfilePage.jsx`)
    - Add a Yup schema: `firstName` and `lastName` required
    - Wire `useForm` with `defaultValues` from `useAuth().user`; display inline errors; this is implemented together with task 6.5
    - _Requirements: 4.3, 4.4_

- [x] 10. Cloudinary upload middleware and route wiring
  - [x] 10.1 Create `server/server/middleware/upload.js`
    - Configure Multer with `memoryStorage()`, a `limits.fileSize` of `5 * 1024 * 1024` (5 MB), and a `fileFilter` that accepts only `image/jpeg`, `image/png`, and `image/webp`; reject other types with `AppError('Only JPEG, PNG, and WebP images are allowed', 400)`
    - Export the configured `multer({ ... }).array('images', 10)` middleware as the default export
    - _Requirements: 16.1, 16.4, 16.5_

  - [x] 10.2 Create `server/server/middleware/cloudinaryUpload.js`
    - Implement an Express middleware that iterates over `req.files`; for each file, calls `cloudinary.uploader.upload_stream` with `{ folder: 'hotel-booking', resource_type: 'image' }` and wraps it in a `Promise`; collects the resulting `secure_url` values into `req.cloudinaryUrls`; if any upload fails, passes an `AppError('Image upload failed', 500)` to `next`
    - _Requirements: 16.1, 16.2, 16.3_

  - [x] 10.3 Wire upload middleware to hotel and room routes
    - In `server/server/routes/hotelRoutes.js`, import `upload` and `cloudinaryUpload`; prepend both middlewares to `POST /hotels` (createHotel) and `PATCH /hotels/:id` (updateHotel)
    - In `server/server/routes/roomRoutes.js`, import `upload` and `cloudinaryUpload`; prepend both middlewares to `POST /hotels/:hotelId/rooms` (createRoom) and `PATCH /rooms/:id` (updateRoom)
    - _Requirements: 16.1, 16.2_

  - [x] 10.4 Update hotel and room controllers to use `req.cloudinaryUrls`
    - In `server/server/controllers/hotelController.js`, in `createHotel` and `updateHotel`, merge `req.cloudinaryUrls` (if present and non-empty) into the `images` field passed to the service
    - In `server/server/controllers/roomController.js`, apply the same pattern for `createRoom` and `updateRoom`
    - _Requirements: 16.1, 16.2_

- [x] 11. Admin hotel and room management UI
  - [x] 11.1 Add `hotelsAPI.create`, `hotelsAPI.update`, `hotelsAPI.delete` and `roomsAPI.create`, `roomsAPI.update`, `roomsAPI.delete` to `client/src/services/api.js`
    - `hotelsAPI.create(formData)` — `api.post('/hotels', formData, { headers: { 'Content-Type': 'multipart/form-data' } })`
    - `hotelsAPI.update(id, formData)` — `api.patch('/hotels/${id}', formData, { headers: { 'Content-Type': 'multipart/form-data' } })`
    - `hotelsAPI.delete(id)` — `api.delete('/hotels/${id}')`
    - `roomsAPI.create(hotelId, formData)` — `api.post('/hotels/${hotelId}/rooms', formData, { headers: { 'Content-Type': 'multipart/form-data' } })`
    - `roomsAPI.update(id, formData)` — `api.patch('/rooms/${id}', formData, { headers: { 'Content-Type': 'multipart/form-data' } })`
    - `roomsAPI.delete(id)` — `api.delete('/rooms/${id}')`
    - _Requirements: 7.1, 7.2, 7.3, 8.1, 8.2, 8.3_

  - [x] 11.2 Add Hotels management tab to `client/src/pages/admin/DashboardPage.jsx`
    - Add a tab bar with "Analytics" (existing content) and "Hotels" tabs; manage active tab with `useState`
    - In the Hotels tab, add a `useQuery(['adminHotels'])` that calls `hotelsAPI.getAll({ limit: 100 })` and renders a table with columns: Name, Location, Rooms count, and Actions (Edit / Delete)
    - Add an "Add Hotel" button that opens a `CreateHotelModal`
    - _Requirements: 8.1, 8.2, 8.3_

  - [x] 11.3 Implement `CreateHotelModal` inside `DashboardPage.jsx`
    - Modal form with fields: name, location, address, description, amenities (comma-separated input), and an image file input (multiple)
    - Use `useMutation` calling `hotelsAPI.create` (with `multipart/form-data` when images are attached); on success invalidate `['adminHotels']` and close the modal
    - _Requirements: 8.1, 8.5, 16.1_

  - [x] 11.4 Implement `EditHotelModal` inside `DashboardPage.jsx`
    - Pre-populate form fields from the selected hotel object
    - Use `useMutation` calling `hotelsAPI.update(id, data)`; on success invalidate `['adminHotels']` and `['hotel', id]`
    - _Requirements: 8.2_

  - [x] 11.5 Implement hotel delete with confirmation inside `DashboardPage.jsx`
    - On Delete button click, show a `window.confirm` dialog; if confirmed, call `useMutation` with `hotelsAPI.delete(id)`; on success invalidate `['adminHotels']`
    - _Requirements: 8.3_

  - [x] 11.6 Add Rooms management tab per hotel in `DashboardPage.jsx`
    - Add a "Rooms" tab (or expandable row) that, when a hotel is selected, calls `useQuery(['adminRooms', hotelId])` via `roomsAPI.getByHotel(hotelId)` and renders a table with columns: Room Type, Price, Capacity, and Actions
    - Add "Add Room", "Edit Room", and "Delete Room" actions using `useMutation` calls to `roomsAPI` endpoints; invalidate `['adminRooms', hotelId]` and `['rooms', hotelId]` on success
    - _Requirements: 7.1, 7.2, 7.3_

- [x] 12. Test suite setup and property-based tests
  - [x] 12.1 Install Vitest and fast-check in the server
    - Run `npm install --save-dev vitest @vitest/coverage-v8 fast-check` inside `server/`
    - Add `"test": "vitest run"` and `"test:coverage": "vitest run --coverage"` to the `scripts` section of `server/package.json`
    - _Requirements: (infrastructure)_

  - [x] 12.2 Create `server/vitest.config.js`
    - Configure Vitest with `{ test: { environment: 'node', globals: true, coverage: { provider: 'v8', reporter: ['text', 'lcov'] } } }`
    - _Requirements: (infrastructure)_

  - [x] 12.3 Create `server/tests/bookingService.test.js`
    - [ ]* 12.3.1 Write property test for no double booking (P1)
      - **Property 1: No double booking — two overlapping bookings for the same room cannot both be CONFIRMED**
      - **Validates: Requirements 10.1, 10.2**
      - Use fast-check to generate arbitrary overlapping date pairs and assert that `createBooking` throws a 409 `AppError` when a conflicting CONFIRMED booking already exists

    - [ ]* 12.3.2 Write property test for price calculation (P2)
      - **Property 2: Total price equals nights × room.price for all valid date ranges**
      - **Validates: Requirements 9.1**
      - Use fast-check to generate arbitrary `(checkIn, checkOut, price)` triples where `checkOut > checkIn` and assert `totalPrice === calculateNights(checkIn, checkOut) * price`

    - [ ]* 12.3.3 Write property test for date ordering (P3)
      - **Property 3: checkOut must be strictly after checkIn**
      - **Validates: Requirements 9.3**
      - Use fast-check to generate date pairs where `checkOut <= checkIn` and assert `createBooking` throws a 400 `AppError`

    - [ ]* 12.3.4 Write property test for capacity constraint (P4)
      - **Property 4: guests must not exceed room.capacity**
      - **Validates: Requirements 9.4**
      - Use fast-check to generate `(guests, capacity)` pairs where `guests > capacity` and assert `createBooking` throws a 400 `AppError`

    - [ ]* 12.3.5 Write property test for cancellation eligibility (P8)
      - **Property 8: A booking can only be cancelled if status is CONFIRMED and checkIn is in the future**
      - **Validates: Requirements 11.3, 11.4, 11.5, 11.6**
      - Use fast-check to generate bookings with status CANCELLED, COMPLETED, or a past checkIn and assert `cancelBooking` throws the appropriate 400 `AppError`

  - [x] 12.4 Create `server/tests/reviewService.test.js`
    - [ ]* 12.4.1 Write property test for review eligibility (P5)
      - **Property 5: A review can only be created for a COMPLETED booking with checkOut in the past and no existing review**
      - **Validates: Requirements 13.1, 13.2, 13.3**
      - Use fast-check to generate bookings with non-COMPLETED status or future checkOut and assert `createReview` throws a 403 `AppError`

    - [ ]* 12.4.2 Write property test for rating bounds (P6)
      - **Property 6: Review rating must be an integer in [1, 5]**
      - **Validates: Requirements 13.4**
      - Use fast-check to generate integers outside [1, 5] and assert the service throws a 400 `AppError`

    - [ ]* 12.4.3 Write property test for hotel rating consistency (P7)
      - **Property 7: Hotel.rating equals the arithmetic mean of all review ratings rounded to one decimal place**
      - **Validates: Requirements 13.1, 13.5**
      - Use fast-check to generate arrays of ratings in [1, 5] and assert that after `updateHotelRating` the stored `Hotel.rating` equals `Math.round((sum / count) * 10) / 10`

  - [x] 12.5 Create `server/tests/roomService.test.js`
    - [ ]* 12.5.1 Write property test for availability monotonicity (P9)
      - **Property 9: Adding a CONFIRMED booking for a room can only decrease or maintain (never increase) the set of available date windows for that room**
      - **Validates: Requirements 10.1, 10.3**
      - Use fast-check to generate a room with an existing booking and a new overlapping date range; assert `checkRoomAvailability` returns `false` for the overlapping range and `true` for a non-overlapping range

  - [x] 12.6 Create `server/tests/notificationService.test.js`
    - [ ]* 12.6.1 Write property test for FCM token uniqueness (P10)
      - **Property 10: Calling `registerToken` multiple times for the same userId always results in exactly one FcmToken row with the most recently provided token**
      - **Validates: Requirements 15.2, 24.2**
      - Use fast-check to generate arbitrary `(userId, [token1, token2, ...tokenN])` sequences and assert that after all upserts, `prisma.fcmToken.findUnique({ where: { userId } })` returns the last token in the sequence

- [x] 13. Final checkpoint — ensure all tests pass
  - Run `npm test` inside `server/` and confirm all property-based and unit tests pass
  - Verify the server starts without errors (`node server.js` or `npm run dev`)
  - Verify the client builds without errors (`npm run build` inside `client/`)
  - Ensure all tests pass; ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Gaps 1–6 are pure server-side and have no client dependencies; they can be implemented first
- Gap 7 (FCM client) depends on Gap 3 (notification route) being deployed
- Gap 8 (TanStack Query migration) is largely already done; the tasks confirm and extend existing wiring
- Gap 9 (form validation) is independent of all other gaps and can be parallelised
- Gap 10 (Cloudinary middleware) is independent of notification work
- Gap 11 (admin UI) depends on Gap 10 for image upload support and Gap 11.1 (API service methods) must be done first
- Gap 12 (tests) should be implemented last so all services under test are complete
- Property tests P1–P10 validate universal correctness properties; unit tests validate specific examples and edge cases
