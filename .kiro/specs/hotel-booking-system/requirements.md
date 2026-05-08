# Requirements Document

## Introduction

This document defines the requirements for a full-featured Hotel Booking System built on an existing React/Node.js/Express/Prisma/PostgreSQL foundation. The system enables guests to search for hotels, check room availability, make and manage bookings, and leave reviews. Administrators manage hotel and room inventory through a dedicated dashboard. The system integrates Nodemailer for transactional emails, Firebase Cloud Messaging (FCM) for push notifications, Cloudinary for image storage, and an AI-powered chatbot and recommendation engine. Authentication is JWT-based with role-based access control (USER and ADMIN roles).

The existing codebase provides a working skeleton: Prisma schema with User, Hotel, Room, Booking, and Review models; Express routes and controllers for auth, hotels, rooms, bookings, reviews, AI, analytics, and chatbot; a React frontend with routing, AuthContext, and page scaffolding. Requirements in this document describe the complete, correct behavior the system must exhibit — including gaps that must be filled and behaviors that must be hardened.

---

## Glossary

- **System**: The Hotel Booking System as a whole (frontend + backend).
- **API**: The Express/Node.js REST API backend.
- **Client**: The React/Vite frontend application.
- **AuthService**: The backend service responsible for user registration, login, token generation, and session validation.
- **HotelService**: The backend service responsible for hotel CRUD operations and search.
- **RoomService**: The backend service responsible for room CRUD and availability checking.
- **BookingService**: The backend service responsible for booking creation, cancellation, and lifecycle management.
- **ReviewService**: The backend service responsible for review creation, update, deletion, and hotel rating recalculation.
- **NotificationService**: The backend service responsible for sending Firebase Cloud Messaging push notifications.
- **EmailService**: The backend utility responsible for sending transactional emails via Nodemailer.
- **ReminderJob**: The node-cron scheduled job that sends check-in reminder emails and push notifications.
- **AuthContext**: The React context that holds the authenticated user state on the Client.
- **ProtectedRoute**: The React component that redirects unauthenticated users to the login page.
- **Guest**: An unauthenticated visitor of the Client.
- **User**: An authenticated person with the USER role.
- **Admin**: An authenticated person with the ADMIN role.
- **Booking**: A reservation record linking a User, Hotel, Room, check-in date, check-out date, guest count, and total price.
- **BookingStatus**: One of PENDING, CONFIRMED, CANCELLED, or COMPLETED.
- **Availability Window**: The date range [checkIn, checkOut) during which a room is considered occupied.
- **Overlap**: A condition where two Availability Windows share at least one calendar day, detected by the predicate `(A.checkIn < B.checkOut) AND (A.checkOut > B.checkIn)`.
- **FCM**: Firebase Cloud Messaging, used for browser and mobile push notifications.
- **FCM_Token**: A device-specific token registered with FCM that identifies a notification recipient.
- **JWT**: JSON Web Token used for stateless authentication.
- **Cloudinary**: The cloud image storage and transformation service used for hotel and room images.
- **TanStack Query**: The React data-fetching and caching library (also known as React Query v5) used on the Client.
- **React Hook Form**: The form state management library used on the Client.
- **Yup**: The schema validation library used with React Hook Form on the Client.

---

## Requirements

### Requirement 1: User Registration

**User Story:** As a Guest, I want to create an account, so that I can make bookings and manage my reservations.

#### Acceptance Criteria

1. WHEN a Guest submits a registration form with a unique email, password, firstName, and lastName, THE AuthService SHALL create a new User record with the USER role and return a JWT and the user object.
2. WHEN a Guest submits a registration form with an email that already exists in the database, THE API SHALL return HTTP 400 with a descriptive error message indicating the email is already in use.
3. WHEN a Guest submits a registration form with a password shorter than 8 characters, THE API SHALL return HTTP 400 with a descriptive validation error.
4. WHEN a Guest submits a registration form with a missing required field (email, password, firstName, or lastName), THE API SHALL return HTTP 400 with a descriptive validation error identifying the missing field.
5. WHEN registration succeeds, THE AuthService SHALL hash the password using bcrypt before persisting it to the database.
6. WHEN registration succeeds, THE Client SHALL store the JWT in localStorage, update the AuthContext with the user object, and redirect the User to the home page.
7. THE Client registration form SHALL validate all fields using React Hook Form and Yup before submitting to the API, displaying inline error messages for each invalid field.

---

### Requirement 2: User Login and Session Persistence

**User Story:** As a registered User, I want to log in and have my session remembered, so that I do not have to re-authenticate on every visit.

#### Acceptance Criteria

1. WHEN a User submits valid credentials (email and password), THE AuthService SHALL return a JWT with a 7-day expiry and the user object.
2. WHEN a User submits an incorrect password or a non-existent email, THE API SHALL return HTTP 401 with a generic error message that does not reveal which field is incorrect.
3. WHEN the Client initialises, THE AuthContext SHALL read the JWT from localStorage and call `GET /api/auth/me` to validate the token and restore the authenticated session.
4. IF the JWT stored in localStorage is expired or invalid, THEN THE AuthContext SHALL remove the token from localStorage and set the authenticated state to false.
5. WHEN a User logs out, THE Client SHALL call `GET /api/auth/logout`, remove the JWT and user object from localStorage, clear the AuthContext state, and redirect the User to the home page.
6. WHEN an API request returns HTTP 401, THE Client axios interceptor SHALL remove the JWT from localStorage and redirect the User to the login page.
7. THE Client login form SHALL validate email format and password presence using React Hook Form and Yup before submitting to the API.

---

### Requirement 3: Role-Based Access Control

**User Story:** As a system operator, I want access to be restricted by role, so that Users cannot perform Admin actions and unauthenticated Guests cannot access protected resources.

#### Acceptance Criteria

1. WHEN a request reaches a protected API endpoint without a valid JWT, THE API `protect` middleware SHALL return HTTP 401.
2. WHEN a User with the USER role attempts to access an Admin-only API endpoint, THE API `restrictTo` middleware SHALL return HTTP 403.
3. WHEN a Guest navigates to a protected Client route (bookings, profile), THE ProtectedRoute component SHALL redirect the Guest to the login page.
4. WHEN a User with the USER role navigates to the `/dashboard` route, THE ProtectedRoute component SHALL redirect the User to the home page.
5. THE API SHALL accept the JWT from either the `Authorization: Bearer <token>` header or the `jwt` HttpOnly cookie.

---

### Requirement 4: User Profile Management

**User Story:** As a User, I want to view and update my profile information, so that my contact details remain current.

#### Acceptance Criteria

1. WHEN an authenticated User requests `GET /api/auth/me`, THE API SHALL return the User's id, email, firstName, lastName, phone, and role.
2. WHEN an authenticated User submits a profile update with valid firstName, lastName, and/or phone, THE API SHALL persist the changes and return the updated User object.
3. WHEN an authenticated User submits a profile update with an invalid phone format, THE API SHALL return HTTP 400 with a descriptive validation error.
4. THE Client profile page SHALL display the current user data pre-populated in an editable form and show a success notification upon successful update.

---

### Requirement 5: Hotel Listing and Search

**User Story:** As a Guest or User, I want to browse and search hotels by location, so that I can find accommodation that suits my destination.

#### Acceptance Criteria

1. WHEN a request is made to `GET /api/hotels`, THE HotelService SHALL return a paginated list of hotels with their id, name, location, address, description, amenities, images, avgRating, and minimum room price.
2. WHEN a `location` query parameter is provided, THE HotelService SHALL filter hotels whose name, location, or address contains the search term (case-insensitive).
3. WHEN `page` and `limit` query parameters are provided, THE HotelService SHALL return the correct subset of results and include pagination metadata (page, limit, total, pages).
4. IF no hotels match the search criteria, THEN THE API SHALL return HTTP 200 with an empty hotels array and pagination metadata reflecting zero total results.
5. THE Client hotel list page SHALL display a search input for location, render a loading skeleton while data is fetching, and display an empty-state message when no results are returned.
6. THE Client hotel list page SHALL use TanStack Query to fetch and cache hotel data, re-fetching when the location search term changes.

---

### Requirement 6: Hotel Detail Page

**User Story:** As a Guest or User, I want to view full details of a hotel including its rooms and reviews, so that I can make an informed booking decision.

#### Acceptance Criteria

1. WHEN a request is made to `GET /api/hotels/:id`, THE HotelService SHALL return the hotel with all fields, its rooms array, its reviews array (including reviewer first and last name), and the computed avgRating.
2. IF the hotel id does not exist, THEN THE API SHALL return HTTP 404 with a descriptive error message.
3. WHEN `checkIn`, `checkOut`, and `guests` query parameters are provided to `GET /api/hotels/:hotelId/rooms`, THE RoomService SHALL return each room annotated with an `isAvailable` boolean indicating whether the room has no Overlap with active bookings (PENDING or CONFIRMED status) in the requested Availability Window.
4. THE Client hotel detail page SHALL display hotel images, amenities, description, avgRating, and a list of rooms with their availability status when dates and guest count are provided.
5. THE Client hotel detail page SHALL include a date range picker and guest count input that, when changed, re-fetch room availability from the API.

---

### Requirement 7: Room Management (Admin)

**User Story:** As an Admin, I want to create, update, and delete rooms for a hotel, so that the room inventory stays accurate.

#### Acceptance Criteria

1. WHEN an Admin submits a valid room creation request to `POST /api/hotels/:hotelId/rooms`, THE RoomService SHALL create the room linked to the specified hotel and return the created room object.
2. WHEN an Admin submits a room update to `PATCH /api/rooms/:id`, THE RoomService SHALL update the specified fields and return the updated room object.
3. WHEN an Admin requests `DELETE /api/rooms/:id`, THE RoomService SHALL delete the room and cascade-delete associated bookings per the Prisma schema's `onDelete: Cascade` rule.
4. WHEN a non-Admin attempts to create, update, or delete a room, THE API SHALL return HTTP 403.
5. WHEN a room creation request is missing required fields (hotelId, roomType, price, capacity), THE API SHALL return HTTP 400 with a descriptive validation error.

---

### Requirement 8: Hotel Management (Admin)

**User Story:** As an Admin, I want to create, update, and delete hotels, so that the hotel catalogue remains up to date.

#### Acceptance Criteria

1. WHEN an Admin submits a valid hotel creation request to `POST /api/hotels`, THE HotelService SHALL create the hotel and return the created hotel object.
2. WHEN an Admin submits a hotel update to `PATCH /api/hotels/:id`, THE HotelService SHALL update the specified fields and return the updated hotel object.
3. WHEN an Admin requests `DELETE /api/hotels/:id`, THE HotelService SHALL delete the hotel and cascade-delete its rooms, bookings, and reviews per the Prisma schema's `onDelete: Cascade` rule.
4. WHEN a non-Admin attempts to create, update, or delete a hotel, THE API SHALL return HTTP 403.
5. WHEN a hotel creation request is missing required fields (name, location, address, description), THE API SHALL return HTTP 400 with a descriptive validation error.
6. WHEN an Admin uploads hotel or room images, THE API SHALL upload the files to Cloudinary and store the returned secure URLs in the images array of the hotel or room record.

---

### Requirement 9: Booking Creation

**User Story:** As a User, I want to book an available room for specific dates, so that I can secure my accommodation.

#### Acceptance Criteria

1. WHEN an authenticated User submits a valid booking request (hotelId, roomId, checkIn, checkOut, guests), THE BookingService SHALL verify the room belongs to the hotel, verify the guest count does not exceed room capacity, verify there is no Overlap with existing PENDING or CONFIRMED bookings for that room, calculate the totalPrice as `numberOfNights × room.price`, create the Booking with status CONFIRMED, and return the created Booking object.
2. WHEN the requested checkIn date is earlier than today's date (midnight), THE API SHALL return HTTP 400 with the message "Check-in date cannot be in the past".
3. WHEN the requested checkOut date is not strictly after the checkIn date, THE API SHALL return HTTP 400 with the message "Check-out date must be after check-in date".
4. WHEN the requested guest count exceeds the room's capacity, THE API SHALL return HTTP 400 with a message stating the maximum capacity.
5. WHEN an Overlap is detected with an existing active booking for the same room, THE API SHALL return HTTP 409 with the message "Room is not available for the selected dates".
6. WHEN a booking is successfully created, THE BookingService SHALL attempt to send a booking confirmation email via the EmailService; email delivery failure SHALL NOT cause the booking creation to fail.
7. WHEN a booking is successfully created, THE BookingService SHALL attempt to send a booking confirmation push notification via the NotificationService; push notification failure SHALL NOT cause the booking creation to fail.
8. THE Client booking page SHALL display a price summary (nights × price per night = total) that updates reactively when the User changes dates.
9. THE Client booking page SHALL use React Hook Form with Yup validation to prevent submission of invalid date ranges or guest counts before calling the API.

---

### Requirement 10: Availability and Conflict Prevention

**User Story:** As a User, I want the system to prevent double bookings, so that I am guaranteed the room I reserved.

#### Acceptance Criteria

1. THE BookingService SHALL use the Overlap predicate `(existingCheckIn < newCheckOut) AND (existingCheckOut > newCheckIn)` to detect conflicts, considering only bookings with status PENDING or CONFIRMED.
2. WHEN two concurrent booking requests for the same room and overlapping dates are received simultaneously, THE BookingService SHALL ensure only one booking is created by performing the availability check and booking creation within a single Prisma transaction or by relying on a database-level unique constraint.
3. WHEN checking availability for a room, THE RoomService `checkRoomAvailability` function SHALL accept an optional `excludeBookingId` parameter to allow re-checking availability while excluding the booking being modified.
4. THE Client room availability display SHALL reflect the server-side availability state and SHALL NOT allow a User to submit a booking for a room marked as unavailable.

---

### Requirement 11: Booking Management — User Side

**User Story:** As a User, I want to view all my bookings and cancel upcoming ones, so that I can manage my travel plans.

#### Acceptance Criteria

1. WHEN an authenticated User requests `GET /api/bookings/my`, THE BookingService SHALL return all bookings belonging to that User, ordered by creation date descending, including hotel name, location, images, room type, price, capacity, and review status.
2. WHEN an authenticated User requests `GET /api/bookings/:id`, THE BookingService SHALL return the full booking detail only if the booking belongs to that User; otherwise THE API SHALL return HTTP 404.
3. WHEN an authenticated User requests cancellation of a booking via `DELETE /api/bookings/:id`, THE BookingService SHALL verify the booking belongs to the User, verify the booking status is not already CANCELLED or COMPLETED, verify the checkIn date has not yet passed, update the status to CANCELLED, and return the updated Booking object.
4. IF the booking is already CANCELLED, THEN THE API SHALL return HTTP 400 with the message "Booking is already cancelled".
5. IF the booking status is COMPLETED, THEN THE API SHALL return HTTP 400 with the message "Cannot cancel a completed booking".
6. IF the booking's checkIn date is in the past, THEN THE API SHALL return HTTP 400 with the message "Cannot cancel a booking that has already started".
7. WHEN a booking is successfully cancelled, THE BookingService SHALL attempt to send a cancellation email via the EmailService; email delivery failure SHALL NOT cause the cancellation to fail.
8. WHEN a booking is successfully cancelled, THE BookingService SHALL attempt to send a cancellation push notification via the NotificationService; push notification failure SHALL NOT cause the cancellation to fail.
9. THE Client bookings page SHALL display each booking's hotel name, room type, check-in/check-out dates, total price, status badge, and a cancel button that is visible only for CONFIRMED bookings with a future check-in date.

---

### Requirement 12: Booking Status Lifecycle

**User Story:** As a system operator, I want bookings to automatically transition to COMPLETED status after the check-out date, so that the booking history is accurate and reviews can be submitted.

#### Acceptance Criteria

1. THE ReminderJob SHALL run a scheduled task daily at 09:00 server time that queries all CONFIRMED bookings whose checkOut date is in the past and updates their status to COMPLETED.
2. WHEN a booking's status is updated to COMPLETED by the ReminderJob, THE System SHALL NOT send any email or push notification for the status change.
3. THE ReminderJob SHALL also query all CONFIRMED bookings whose checkIn date is exactly one calendar day in the future and send a check-in reminder email via the EmailService for each.
4. WHEN the ReminderJob encounters an email delivery failure for an individual booking, THE ReminderJob SHALL log the error and continue processing the remaining bookings.

---

### Requirement 13: Reviews and Ratings

**User Story:** As a User, I want to leave a review for a hotel after my stay, so that I can share my experience with other travellers.

#### Acceptance Criteria

1. WHEN an authenticated User submits a review (hotelId, bookingId, rating, optional comment), THE ReviewService SHALL verify the booking belongs to the User, verify the booking status is COMPLETED and the checkOut date is in the past, verify no review already exists for that bookingId, create the Review record, recalculate the hotel's avgRating as the mean of all review ratings rounded to one decimal place, persist the updated rating to the Hotel record, and return the created Review.
2. WHEN a User attempts to submit a review for a booking that is not COMPLETED or whose checkOut is not in the past, THE API SHALL return HTTP 403 with the message "Booking not eligible for review".
3. WHEN a User attempts to submit a second review for the same booking, THE API SHALL return HTTP 403 with the message "Already reviewed".
4. WHEN a User submits a review with a rating outside the range 1–5, THE API SHALL return HTTP 400 with a descriptive validation error.
5. WHEN an authenticated User updates their own review via `PATCH /api/reviews/:id`, THE ReviewService SHALL update the rating and/or comment, recalculate the hotel's avgRating, and return the updated Review.
6. WHEN an authenticated User deletes their own review via `DELETE /api/reviews/:id`, THE ReviewService SHALL delete the Review, recalculate the hotel's avgRating, and return HTTP 204.
7. WHEN a User attempts to update or delete a review that does not belong to them, THE API SHALL return HTTP 404.
8. THE Client hotel detail page SHALL display the review form only when the User has a COMPLETED booking for that hotel with no existing review, as determined by `GET /api/bookings/:id/can-review`.
9. THE Client SHALL display the average rating and total review count prominently on both the hotel list card and the hotel detail page.

---

### Requirement 14: Email Notifications

**User Story:** As a User, I want to receive transactional emails for booking events, so that I have a written record of my reservations.

#### Acceptance Criteria

1. WHEN a booking is confirmed, THE EmailService SHALL send a booking confirmation email to the User's registered email address containing the hotel name, room type, check-in date, check-out date, guest count, and total price.
2. WHEN a booking is cancelled, THE EmailService SHALL send a booking cancellation email to the User's registered email address containing the hotel name, room type, check-in date, and check-out date.
3. WHEN the ReminderJob identifies a booking with a check-in date one calendar day in the future, THE EmailService SHALL send a check-in reminder email to the User's registered email address containing the hotel name, room type, check-in date, and check-out date.
4. IF the SMTP server is unavailable or returns an error, THEN THE EmailService SHALL log the error with the recipient address and subject, and THE calling service SHALL continue normal operation without propagating the email error.
5. THE EmailService SHALL use the SMTP credentials configured via the `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `FROM_NAME`, and `FROM_EMAIL` environment variables.

---

### Requirement 15: Push Notifications via Firebase Cloud Messaging

**User Story:** As a User, I want to receive push notifications for booking events on my browser or device, so that I am informed in real time even when I am not viewing the application.

#### Acceptance Criteria

1. WHEN a User grants notification permission in the browser, THE Client SHALL request an FCM_Token from Firebase and send it to `POST /api/notifications/register-token` along with the authenticated User's JWT.
2. WHEN the NotificationService receives a valid FCM_Token registration request, THE NotificationService SHALL store the FCM_Token associated with the User's id, replacing any previously stored token for that User.
3. WHEN a booking is confirmed, THE NotificationService SHALL send a push notification to the FCM_Token registered for the booking's User with the title "Booking Confirmed" and a body containing the hotel name and check-in date.
4. WHEN a booking is cancelled, THE NotificationService SHALL send a push notification to the FCM_Token registered for the booking's User with the title "Booking Cancelled" and a body containing the hotel name.
5. WHEN the ReminderJob identifies a booking with a check-in date one calendar day in the future, THE NotificationService SHALL send a push notification to the FCM_Token registered for the booking's User with the title "Check-in Tomorrow" and a body containing the hotel name and check-in date.
6. IF no FCM_Token is registered for a User, THEN THE NotificationService SHALL skip the push notification without returning an error.
7. IF the FCM service returns an error for a specific token (e.g., token expired or unregistered), THEN THE NotificationService SHALL log the error and remove the invalid token from storage.
8. THE NotificationService SHALL use the Firebase Admin SDK configured via the `FIREBASE_SERVICE_ACCOUNT_KEY` environment variable.

---

### Requirement 16: Image Upload via Cloudinary

**User Story:** As an Admin, I want to upload images for hotels and rooms, so that guests can see accurate visual representations of the accommodation.

#### Acceptance Criteria

1. WHEN an Admin submits a multipart form request to upload hotel images, THE API SHALL use Multer to parse the uploaded files and upload each file to Cloudinary, returning the secure URLs.
2. WHEN an Admin submits a multipart form request to upload room images, THE API SHALL use Multer to parse the uploaded files and upload each file to Cloudinary, returning the secure URLs.
3. WHEN a Cloudinary upload fails, THE API SHALL return HTTP 500 with a descriptive error message and SHALL NOT persist a partial hotel or room record.
4. THE API SHALL accept image files in JPEG, PNG, and WebP formats and SHALL reject other file types with HTTP 400.
5. THE API SHALL enforce a maximum file size of 5 MB per image and SHALL return HTTP 400 if the limit is exceeded.

---

### Requirement 17: Admin Dashboard and Analytics

**User Story:** As an Admin, I want a dashboard showing key metrics, so that I can monitor the system's performance and occupancy.

#### Acceptance Criteria

1. WHEN an Admin requests `GET /api/analytics/dashboard`, THE API SHALL return total bookings count, total revenue (sum of totalPrice for CONFIRMED and COMPLETED bookings), total users count, total hotels count, and a breakdown of bookings by status.
2. WHEN an Admin requests `GET /api/analytics/dashboard` with a `period` query parameter of `week`, `month`, or `year`, THE API SHALL filter the metrics to the specified time period.
3. WHEN an Admin requests `GET /api/analytics/hotel/:hotelId`, THE API SHALL return booking count, total revenue, average rating, and occupancy rate for the specified hotel.
4. WHEN a non-Admin requests any analytics endpoint, THE API SHALL return HTTP 403.
5. THE Client admin dashboard SHALL display the metrics using Recharts charts and SHALL use TanStack Query to fetch and cache the analytics data.

---

### Requirement 18: AI Recommendations and Chatbot

**User Story:** As a User, I want personalised hotel recommendations and a conversational assistant, so that I can discover suitable hotels more efficiently.

#### Acceptance Criteria

1. WHEN a User submits preferences to `POST /api/ai/recommendations`, THE API SHALL return a ranked list of hotel recommendations based on the provided preferences.
2. WHEN a User submits a message to `POST /api/chatbot/chat` with a sessionId, THE API SHALL return a contextually relevant response and persist the conversation history for that sessionId.
3. WHEN a User requests `GET /api/chatbot/history/:sessionId`, THE API SHALL return the conversation history for that session.
4. WHEN a User requests `DELETE /api/chatbot/history/:sessionId`, THE API SHALL delete the conversation history for that session and return HTTP 200.
5. THE Client chatbot component SHALL be accessible from all pages, maintain session state across navigation, and display a loading indicator while awaiting a response.

---

### Requirement 19: Search and Availability System

**User Story:** As a Guest or User, I want to search for available rooms by location, date range, and guest count from the home page, so that I can quickly find suitable options.

#### Acceptance Criteria

1. WHEN a Guest or User submits a search with location, checkIn, checkOut, and guests from the home page search form, THE Client SHALL navigate to the hotel list page with the search parameters encoded in the URL query string.
2. WHEN the hotel list page loads with checkIn, checkOut, and guests query parameters, THE Client SHALL pass these parameters to `GET /api/hotels` and display only hotels that have at least one available room for the requested Availability Window and guest count.
3. WHEN a User selects a hotel from the search results and views the hotel detail page, THE Client SHALL pre-populate the date range picker and guest count with the values from the URL query string.
4. THE Client search form SHALL validate that checkIn is not in the past, checkOut is after checkIn, and guest count is at least 1, displaying inline error messages for each violation before navigating.
5. WHEN the `guests` filter is applied to `GET /api/hotels/:hotelId/rooms`, THE RoomService SHALL return only rooms whose capacity is greater than or equal to the requested guest count.

---

### Requirement 20: State Management and Data Fetching

**User Story:** As a developer, I want a consistent data-fetching and state management pattern, so that the Client is maintainable and performant.

#### Acceptance Criteria

1. THE Client SHALL use TanStack Query for all server state (hotels, rooms, bookings, reviews, analytics), with appropriate `queryKey` arrays that include relevant parameters (e.g., hotel id, search filters, page number).
2. THE Client SHALL use React Context API (AuthContext, ThemeContext) for global UI state that does not require server synchronisation.
3. WHEN a booking is created or cancelled, THE Client SHALL invalidate the relevant TanStack Query caches (bookings list, hotel availability) so that subsequent renders reflect the updated state.
4. THE Client SHALL display a loading skeleton or spinner for all data-fetching states and an error message with a retry option for all error states.
5. THE Client hotel list page SHALL implement pagination controls that update the `page` query parameter and trigger a new TanStack Query fetch.

---

### Requirement 21: Error Handling and Validation

**User Story:** As a developer, I want consistent error handling across the API and Client, so that failures are surfaced clearly and the system remains stable.

#### Acceptance Criteria

1. THE API global error handler SHALL return a JSON response with `status`, `message`, and (in development) `stack` fields for all unhandled errors.
2. WHEN a Joi validation middleware rejects a request, THE API SHALL return HTTP 400 with a `message` field listing all validation errors.
3. WHEN a Prisma unique constraint violation occurs (e.g., duplicate email), THE API error handler SHALL return HTTP 400 with a user-friendly message rather than exposing the raw Prisma error.
4. WHEN a Prisma record-not-found error occurs, THE API error handler SHALL return HTTP 404 with a descriptive message.
5. THE Client SHALL display user-friendly error messages for all API error responses, using toast notifications or inline error states as appropriate to the context.
6. THE Client SHALL NOT expose raw API error objects or stack traces to the end user.

---

### Requirement 22: Security

**User Story:** As a system operator, I want the API to be protected against common web vulnerabilities, so that user data and system integrity are maintained.

#### Acceptance Criteria

1. THE API SHALL apply the `helmet` middleware to set secure HTTP headers on all responses.
2. THE API SHALL apply a rate limiter of 100 requests per 15-minute window per IP address to all `/api/*` routes.
3. THE API SHALL enforce a request body size limit of 10 KB for JSON payloads.
4. WHEN a User requests their own bookings or profile, THE API SHALL verify the resource belongs to the requesting User before returning data.
5. WHEN a User attempts to cancel another User's booking, THE API SHALL return HTTP 404 (not HTTP 403) to avoid leaking the existence of the resource.
6. THE AuthService SHALL hash passwords using bcrypt with a minimum cost factor of 10 before persisting them.
7. THE API SHALL store JWTs in HttpOnly cookies in addition to returning them in the response body, to support both cookie-based and header-based authentication flows.

---

### Requirement 23: Performance and Pagination

**User Story:** As a developer, I want the API to handle large datasets efficiently, so that response times remain acceptable as data grows.

#### Acceptance Criteria

1. THE HotelService `getAllHotels` function SHALL use Prisma's `skip` and `take` parameters to implement offset-based pagination, defaulting to page 1 with a limit of 10.
2. THE ReviewService `getHotelReviews` function SHALL use Prisma's `skip` and `take` parameters to implement offset-based pagination, defaulting to page 1 with a limit of 10.
3. THE API SHALL use Prisma's `select` and `include` clauses to fetch only the fields required by each endpoint, avoiding over-fetching of related data.
4. THE Client SHALL implement lazy loading for hotel images using the native `loading="lazy"` attribute or an equivalent React pattern.
5. WHEN the Client hotel list page renders more than one page of results, THE Client SHALL display pagination controls allowing the User to navigate between pages without a full page reload.

---

### Requirement 24: Notification Token Management

**User Story:** As a system operator, I want FCM tokens to be stored and managed per user, so that push notifications are delivered reliably.

#### Acceptance Criteria

1. THE System SHALL store FCM_Tokens in a dedicated database table (or field on the User model) that associates each token with a User id and a creation timestamp.
2. WHEN a User registers a new FCM_Token, THE NotificationService SHALL upsert the token record, replacing any existing token for that User.
3. WHEN the FCM service reports a token as invalid or unregistered, THE NotificationService SHALL delete the corresponding token record from the database.
4. THE `POST /api/notifications/register-token` endpoint SHALL require authentication via the `protect` middleware and SHALL return HTTP 400 if the token field is missing or empty.
