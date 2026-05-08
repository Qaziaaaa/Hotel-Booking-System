# Hotel Booking System — Design Document

## Overview

The Hotel Booking System is a full-stack web application that enables guests to search hotels, check room availability, make and manage bookings, and leave reviews. Administrators manage hotel and room inventory through a dedicated dashboard. The system is built on a React/Vite frontend and a Node.js/Express/Prisma/PostgreSQL backend, with integrations for Nodemailer (email), Firebase Cloud Messaging (push notifications), and Cloudinary (image storage).

### Key Design Goals

- **Correctness**: Booking conflict prevention via atomic database transactions; strict validation at both API and client layers.
- **Security**: JWT authentication (Bearer header + HttpOnly cookie), bcrypt password hashing (cost ≥ 10), Helmet headers, rate limiting, and resource-ownership checks.
- **Resilience**: Email and push notification failures are fire-and-forget — they never cause booking operations to fail.
- **Performance**: Offset-based pagination, Prisma `select`/`include` to avoid over-fetching, TanStack Query caching on the client.
- **Maintainability**: Clear service-layer separation, consistent error handling via `AppError` + global error handler, React Context for UI state and TanStack Query for server state.

---

## Architecture

### System Component Diagram

```mermaid
graph TB
    subgraph Client["Client (React + Vite)"]
        UI[Pages & Components]
        AC[AuthContext]
        TC[ThemeContext]
        TQ[TanStack Query Cache]
        AX[Axios Instance + Interceptors]
        UI --> AC
        UI --> TC
        UI --> TQ
        TQ --> AX
    end

    subgraph Server["Server (Node.js + Express)"]
        MW[Middleware: Helmet, CORS, Rate Limit, Cookie Parser]
        RT[Routes]
        CT[Controllers]
        SV[Services]
        JB[Cron Job: ReminderJob]
        MW --> RT --> CT --> SV
    end

    subgraph Data["Data Layer"]
        PR[Prisma ORM]
        PG[(PostgreSQL)]
        PR --> PG
    end

    subgraph External["External Services"]
        CL[Cloudinary]
        NM[Nodemailer / SMTP]
        FB[Firebase Admin SDK / FCM]
        HF[Hugging Face API]
    end

    AX -->|REST / JSON| MW
    SV --> PR
    SV -->|image upload| CL
    SV -->|transactional email| NM
    SV -->|push notification| FB
    SV -->|AI recommendations| HF
    JB --> PR
    JB --> NM
    JB --> FB
```

### Request Lifecycle

1. Client sends HTTP request with `Authorization: Bearer <token>` header (or `jwt` HttpOnly cookie).
2. Express middleware chain: Helmet → CORS → Rate Limiter → Body Parser → Cookie Parser → Morgan (dev).
3. Route handler applies `protect` (JWT verification) and optionally `restrictTo('ADMIN')`.
4. Controller calls the appropriate Service function.
5. Service interacts with Prisma ORM; side-effects (email, push) are attempted in try/catch blocks.
6. Controller returns a JSON response; errors propagate to the global error handler.

---

## Database Schema

The Prisma schema defines six models. The `FcmToken` model is new and must be added to support Requirement 24.

### Prisma Schema (Complete)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  firstName String
  lastName  String
  phone     String?
  role      Role     @default(USER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  bookings  Booking[]
  reviews   Review[]
  fcmTokens FcmToken[]

  @@map("users")
}

model Hotel {
  id          String   @id @default(uuid())
  name        String
  location    String
  address     String
  description String
  amenities   String[]
  images      String[]
  rating      Float    @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  rooms    Room[]
  bookings Booking[]
  reviews  Review[]

  @@map("hotels")
}

model Room {
  id          String   @id @default(uuid())
  hotelId     String
  roomType    String
  price       Float
  capacity    Int
  amenities   String[]
  images      String[]
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  hotel    Hotel     @relation(fields: [hotelId], references: [id], onDelete: Cascade)
  bookings Booking[]

  @@map("rooms")
}

model Booking {
  id              String        @id @default(uuid())
  userId          String
  hotelId         String
  roomId          String
  checkIn         DateTime
  checkOut        DateTime
  guests          Int
  totalPrice      Float
  status          BookingStatus @default(CONFIRMED)
  specialRequests String?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  user   User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  hotel  Hotel   @relation(fields: [hotelId], references: [id], onDelete: Cascade)
  room   Room    @relation(fields: [roomId], references: [id], onDelete: Cascade)
  review Review?

  @@map("bookings")
}

model Review {
  id        String   @id @default(uuid())
  userId    String
  hotelId   String
  bookingId String   @unique
  rating    Int
  comment   String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  hotel   Hotel   @relation(fields: [hotelId], references: [id], onDelete: Cascade)
  booking Booking @relation(fields: [bookingId], references: [id], onDelete: Cascade)

  @@unique([userId, hotelId, bookingId])
  @@map("reviews")
}

// New model required by Requirement 24
model FcmToken {
  id        String   @id @default(uuid())
  userId    String   @unique   // one token per user (upsert replaces)
  token     String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("fcm_tokens")
}

enum Role {
  USER
  ADMIN
}

enum BookingStatus {
  PENDING
  CONFIRMED
  CANCELLED
  COMPLETED
}
```

### Entity Relationship Diagram

```mermaid
erDiagram
    User ||--o{ Booking : "makes"
    User ||--o{ Review : "writes"
    User ||--o| FcmToken : "has"
    Hotel ||--o{ Room : "contains"
    Hotel ||--o{ Booking : "receives"
    Hotel ||--o{ Review : "has"
    Room ||--o{ Booking : "reserved by"
    Booking ||--o| Review : "generates"

    User {
        uuid id PK
        string email UK
        string password
        string firstName
        string lastName
        string phone
        Role role
        datetime createdAt
        datetime updatedAt
    }

    Hotel {
        uuid id PK
        string name
        string location
        string address
        string description
        string[] amenities
        string[] images
        float rating
        datetime createdAt
        datetime updatedAt
    }

    Room {
        uuid id PK
        uuid hotelId FK
        string roomType
        float price
        int capacity
        string[] amenities
        string[] images
        string description
        datetime createdAt
        datetime updatedAt
    }

    Booking {
        uuid id PK
        uuid userId FK
        uuid hotelId FK
        uuid roomId FK
        datetime checkIn
        datetime checkOut
        int guests
        float totalPrice
        BookingStatus status
        string specialRequests
        datetime createdAt
        datetime updatedAt
    }

    Review {
        uuid id PK
        uuid userId FK
        uuid hotelId FK
        uuid bookingId FK UK
        int rating
        string comment
        datetime createdAt
        datetime updatedAt
    }

    FcmToken {
        uuid id PK
        uuid userId FK UK
        string token
        datetime createdAt
        datetime updatedAt
    }
```

### Schema Design Decisions

- **`Booking.status` defaults to `CONFIRMED`** (not `PENDING`) because the current `createBooking` service sets status to `CONFIRMED` immediately after the availability check. The `PENDING` status is reserved for future payment-gateway integration.
- **`FcmToken.userId` is `@unique`** — one token per user. The `upsert` pattern in `NotificationService` replaces the old token when a new one is registered (Requirement 24.2).
- **Cascade deletes** propagate from Hotel → Room → Booking → Review, and from User → Booking/Review/FcmToken, ensuring referential integrity without orphaned records.
- **`Review.bookingId` is `@unique`** — enforces one review per booking at the database level, complementing the application-level check.

---

## 4. API Design

All endpoints are prefixed with `/api`. Authentication uses `Authorization: Bearer <token>` header or the `jwt` HttpOnly cookie. The `protect` middleware validates the JWT; `restrictTo('ADMIN')` enforces role-based access.

### 4.1 Auth Routes — `/api/auth`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | Public | Register a new user |
| POST | `/auth/login` | Public | Log in and receive a JWT |
| GET | `/auth/logout` | Public | Clear the `jwt` cookie |
| GET | `/auth/me` | `protect` | Return the authenticated user |
| PATCH | `/auth/me` | `protect` | Update profile fields |

**POST /auth/register**
- Request body: `{ email: string, password: string (min 8), firstName: string, lastName: string, phone?: string }`
- Response `201`: `{ status: "success", data: { user: { id, email, firstName, lastName, role }, token: string } }`
- Error `409`: email already registered

**POST /auth/login**
- Request body: `{ email: string, password: string }`
- Response `200`: `{ status: "success", data: { user: { id, email, firstName, lastName, role }, token: string } }`
- Error `401`: generic "Invalid email or password" (does not reveal which field is wrong)

**GET /auth/logout**
- Clears the `jwt` HttpOnly cookie
- Response `200`: `{ status: "success", message: "Logged out successfully" }`

**GET /auth/me**
- Response `200`: `{ status: "success", data: { user: { id, email, firstName, lastName, phone, role, createdAt } } }`

**PATCH /auth/me**
- Request body: `{ firstName?: string, lastName?: string, phone?: string }`
- Response `200`: `{ status: "success", data: { user: { id, email, firstName, lastName, phone, role } } }`

---

### 4.2 Hotel Routes — `/api/hotels`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/hotels` | Public | Paginated hotel list with optional search |
| POST | `/hotels` | `protect` + ADMIN | Create a hotel |
| GET | `/hotels/:id` | Public | Hotel detail with rooms and reviews |
| PATCH | `/hotels/:id` | `protect` + ADMIN | Update hotel fields |
| DELETE | `/hotels/:id` | `protect` + ADMIN | Delete hotel (cascades) |

**GET /hotels**
- Query params: `location?: string`, `page?: number (default 1)`, `limit?: number (default 10)`, `checkIn?: ISO date`, `checkOut?: ISO date`, `guests?: number`
- Response `200`:
```json
{
  "status": "success",
  "data": {
    "hotels": [{ "id", "name", "location", "address", "description", "amenities", "images", "rating", "avgRating", "rooms": [...] }],
    "pagination": { "page", "limit", "total", "pages" }
  }
}
```

**POST /hotels**
- Request body: `{ name: string, location: string, address: string, description: string, amenities?: string[], images?: string[] }`
- Response `201`: `{ status: "success", data: { hotel: {...} } }`

**GET /hotels/:id**
- Response `200`: hotel object with `rooms[]`, `reviews[]` (including `user.firstName`, `user.lastName`), and computed `avgRating`
- Error `404`: hotel not found

**PATCH /hotels/:id**
- Request body: any subset of hotel fields
- Response `200`: updated hotel object

**DELETE /hotels/:id**
- Response `204`: no body

---

### 4.3 Room Routes — `/api/hotels/:hotelId/rooms` and `/api/rooms`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/hotels/:hotelId/rooms` | Public | Rooms for a hotel with availability |
| POST | `/hotels/:hotelId/rooms` | `protect` + ADMIN | Create a room |
| GET | `/rooms/:id` | Public | Single room detail |
| PATCH | `/rooms/:id` | `protect` + ADMIN | Update room fields |
| DELETE | `/rooms/:id` | `protect` + ADMIN | Delete room (cascades) |

**GET /hotels/:hotelId/rooms**
- Query params: `checkIn?: ISO date`, `checkOut?: ISO date`, `guests?: number`
- Response `200`: array of room objects each annotated with `isAvailable: boolean`
- When `checkIn`/`checkOut` are omitted, all rooms return `isAvailable: true`

**POST /hotels/:hotelId/rooms**
- Request body: `{ roomType: string, price: number, capacity: number, amenities?: string[], images?: string[], description?: string }`
- Response `201`: created room object

**GET /rooms/:id**
- Response `200`: room with hotel info and upcoming active bookings (for blocked-date display)

**PATCH /rooms/:id**
- Request body: any subset of room fields
- Response `200`: updated room object

**DELETE /rooms/:id**
- Response `204`: no body

---

### 4.4 Booking Routes — `/api/bookings`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/bookings` | `protect` | Create a booking |
| GET | `/bookings/my` | `protect` | All bookings for the authenticated user |
| GET | `/bookings/:id` | `protect` | Single booking (owner only) |
| DELETE | `/bookings/:id` | `protect` | Cancel a booking |
| GET | `/bookings/:id/can-review` | `protect` | Check review eligibility |

**POST /bookings**
- Request body: `{ hotelId: string, roomId: string, checkIn: ISO date, checkOut: ISO date, guests: number, specialRequests?: string }`
- Response `201`: booking object with hotel, room, and user info
- Errors: `400` (past date, invalid range, over capacity), `404` (room not found), `409` (date conflict)

**GET /bookings/my**
- Response `200`: array of bookings ordered by `createdAt` desc, each including hotel (id, name, location, images), room (id, roomType, price, capacity), and review (id, rating) if present

**GET /bookings/:id**
- Response `200`: full booking with hotel, room, and review
- Error `404`: not found or not owned by requesting user

**DELETE /bookings/:id**
- Cancels the booking (sets status to CANCELLED)
- Response `200`: updated booking object
- Errors: `400` (already cancelled, already completed, check-in in the past)

**GET /bookings/:id/can-review**
- Response `200`: `{ canReview: boolean, booking?: object, reason?: string }`

---

### 4.5 Review Routes — `/api/hotels/:hotelId/reviews` and `/api/reviews`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/hotels/:hotelId/reviews` | Public | Paginated reviews for a hotel |
| POST | `/hotels/:hotelId/reviews` | `protect` | Create a review |
| GET | `/reviews/my/reviews` | `protect` | All reviews by the authenticated user |
| PATCH | `/reviews/:id` | `protect` | Update own review |
| DELETE | `/reviews/:id` | `protect` | Delete own review |

**GET /hotels/:hotelId/reviews**
- Query params: `page?: number`, `limit?: number`
- Response `200`: `{ reviews: [...], avgRating: number, totalReviews: number, pagination: {...} }`

**POST /hotels/:hotelId/reviews**
- Request body: `{ bookingId: string, rating: number (1-5), comment?: string }`
- Response `201`: review object with user name and hotel name
- Errors: `403` (booking not eligible, already reviewed), `400` (rating out of range)

**PATCH /reviews/:id**
- Request body: `{ rating?: number, comment?: string }`
- Response `200`: updated review object
- Error `404`: review not found or not owned by user

**DELETE /reviews/:id**
- Response `204`: no body
- Error `404`: review not found or not owned by user

---

### 4.6 Analytics Routes — `/api/analytics`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/analytics/dashboard` | `protect` + ADMIN | System-wide metrics |
| GET | `/analytics/hotel/:hotelId` | `protect` + ADMIN | Per-hotel metrics |

**GET /analytics/dashboard**
- Query params: `period?: 'week' | 'month' | 'year'`
- Response `200`: `{ totalBookings, totalRevenue, totalUsers, totalHotels, bookingsByStatus: { CONFIRMED, CANCELLED, COMPLETED, PENDING } }`

**GET /analytics/hotel/:hotelId**
- Response `200`: `{ bookingCount, totalRevenue, avgRating, occupancyRate }`

---

### 4.7 Notification Routes — `/api/notifications`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/notifications/register-token` | `protect` | Register or replace FCM token |

**POST /notifications/register-token**
- Request body: `{ token: string }`
- Upserts the `FcmToken` record for the authenticated user
- Response `200`: `{ status: "success", message: "Token registered" }`

---

### 4.8 AI Routes — `/api/ai`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/ai/recommendations` | `protect` | Get ranked hotel recommendations |

**POST /ai/recommendations**
- Request body: `{ preferences: object }`
- Response `200`: `{ recommendations: Hotel[] }` — hotels ranked by preference match

---

### 4.9 Chatbot Routes — `/api/chatbot`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/chatbot/chat` | `protect` | Send a message and get a response |
| GET | `/chatbot/history/:sessionId` | `protect` | Retrieve conversation history |
| DELETE | `/chatbot/history/:sessionId` | `protect` | Clear conversation history |

**POST /chatbot/chat**
- Request body: `{ message: string, sessionId: string }`
- Response `200`: `{ response: string, sessionId: string }`

**GET /chatbot/history/:sessionId**
- Response `200`: `{ history: [{ role: 'user'|'assistant', content: string, timestamp }] }`

**DELETE /chatbot/history/:sessionId**
- Response `200`: `{ status: "success" }`

---

## 5. Service Layer Design

All services live in `server/server/services/`. They interact with Prisma directly and throw `AppError` instances for expected failures. Side-effects (email, push notifications) are always wrapped in `try/catch` so failures are logged but never propagate.

### 5.1 AuthService (`authService.js`)

**`register({ email, password, firstName, lastName, phone })`**
- Checks for existing user by email; throws `AppError('Email already registered', 409)` if found
- Hashes password with `bcrypt.hash(password, 12)` (SALT_ROUNDS = 12)
- Creates User with role `USER`; returns `{ user (without password), token }`

**`login({ email, password })`**
- Looks up user by email; throws `AppError('Invalid email or password', 401)` if not found (generic message — does not reveal which field is wrong)
- Compares password with `bcrypt.compare`; throws same `401` on mismatch
- Returns `{ user (without password), token }`

**`getMe(userId)`**
- Fetches user by id with `select` that excludes `password`
- Returns `{ id, email, firstName, lastName, phone, role, createdAt }`

---

### 5.2 HotelService (`hotelService.js`)

**`getAllHotels({ location?, page, limit })`**
- Builds a Prisma `where` clause with `OR` on `name`, `location`, `address` using `{ contains: location, mode: 'insensitive' }` when `location` is provided
- Fetches hotels with `rooms` and `reviews` (ratings only) via `Promise.all([findMany, count])`
- Computes `avgRating` in JavaScript: `reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length` (0 if no reviews)
- Returns `{ hotels: hotelsWithAvgRating[], pagination: { page, limit, total, pages } }`

**`getHotelById(id)`**
- Fetches hotel with full `rooms[]`, `reviews[]` (including `user.firstName`, `user.lastName`), and `_count.reviews`
- Throws `AppError('Hotel not found', 404)` if not found
- Computes and attaches `avgRating`; returns hotel object

**`createHotel(data)`** → created hotel with rooms and reviews

**`updateHotel(id, data)`** → updated hotel with rooms

**`deleteHotel(id)`** → cascades to rooms, bookings, and reviews via Prisma `onDelete: Cascade`

---

### 5.3 RoomService (`roomService.js`)

**`getRoomsByHotel(hotelId, { checkIn?, checkOut?, guests? })`**
- Filters by `hotelId`; adds `capacity: { gte: guests }` when `guests` is provided
- Includes `bookings` where status is `PENDING` or `CONFIRMED` and dates overlap the requested window
- Annotates each room with `isAvailable: boolean` using the overlap predicate:
  `checkInDate < bookingEnd && checkOutDate > bookingStart`
- When no dates are provided, all rooms return `isAvailable: true`

**`checkRoomAvailability(roomId, checkIn, checkOut, excludeBookingId?)`**
- Queries for conflicting bookings: `status IN ['PENDING','CONFIRMED']` AND `checkIn < checkOutDate` AND `checkOut > checkInDate`
- Excludes `excludeBookingId` when provided (used when modifying an existing booking)
- Returns `true` if no conflicts found, `false` otherwise

**`createRoom(data)`**, **`updateRoom(id, data)`**, **`deleteRoom(id)`**, **`getRoomById(id)`** — standard CRUD; `deleteRoom` cascades to bookings via schema

---

### 5.4 BookingService (`bookingService.js`)

**`createBooking(data, user)`**
1. Validates `checkIn >= today midnight`; throws `AppError('Check-in date cannot be in the past', 400)`
2. Validates `checkOut > checkIn`; throws `AppError('Check-out date must be after check-in date', 400)`
3. Fetches room with hotel; throws `AppError('Room not found or does not belong to this hotel', 404)` if missing
4. Validates `guests <= room.capacity`; throws `AppError('This room can only accommodate N guests', 400)`
5. Calls `checkRoomAvailability(roomId, checkIn, checkOut)`; throws `AppError('Room is not available for the selected dates', 409)` on conflict
6. Calculates `nights = Math.round(|checkOut - checkIn| / 86400000)`, `totalPrice = nights × room.price`
7. Creates booking with `status: 'CONFIRMED'`
8. Attempts `sendBookingConfirmation` in `try/catch` — failure is logged, not re-thrown
9. *(Gap)* Should also call `NotificationService.sendBookingConfirmedNotification` in `try/catch`
10. Returns booking with user, hotel, and room info

**`getUserBookings(userId)`**
- Returns all bookings for the user ordered by `createdAt desc`
- Includes hotel (id, name, location, images), room (id, roomType, price, capacity), and review (id, rating)

**`getBookingById(id, userId)`**
- Uses `findFirst({ where: { id, userId } })` to enforce ownership
- Throws `AppError('Booking not found', 404)` if not found or not owned

**`cancelBooking(id, userId)`**
1. Fetches booking with `findFirst({ where: { id, userId } })`; throws `404` if not found
2. Throws `AppError('Booking is already cancelled', 400)` if `status === 'CANCELLED'`
3. Throws `AppError('Cannot cancel a completed booking', 400)` if `status === 'COMPLETED'`
4. Throws `AppError('Cannot cancel a booking that has already started', 400)` if `checkIn < now`
5. Updates status to `CANCELLED`
6. Attempts `sendBookingCancellation` in `try/catch`
7. *(Gap)* Should also call `NotificationService.sendBookingCancelledNotification` in `try/catch`
8. Returns updated booking

**`canReviewBooking(bookingId, userId)`**
- Queries for booking where `{ id: bookingId, userId, status: 'COMPLETED', checkOut: { lt: now } }`
- Returns `{ canReview: false, reason: 'Booking not eligible for review' }` if not found
- Returns `{ canReview: false, reason: 'Already reviewed' }` if `booking.review` exists
- Returns `{ canReview: true, booking }` otherwise

---

### 5.5 ReviewService (`reviewService.js`)

**`createReview(data, userId)`**
1. Calls `canReviewBooking(bookingId, userId)`; throws `AppError(reason, 403)` if `!canReview`
2. Verifies `booking.hotelId === hotelId`; throws `AppError('Booking does not belong to this hotel', 400)`
3. Creates review record
4. Calls private `updateHotelRating(hotelId)`
5. Returns review with user name and hotel name

**`updateReview(id, userId, data)`**
- Fetches review with `findFirst({ where: { id, userId } })`; throws `AppError('Review not found', 404)` if not owned
- Updates rating and/or comment; calls `updateHotelRating`; returns updated review

**`deleteReview(id, userId)`**
- Fetches review with `findFirst({ where: { id, userId } })`; throws `AppError('Review not found', 404)` if not owned
- Deletes review; calls `updateHotelRating`; returns `true`

**`updateHotelRating(hotelId)` (private)**
- Fetches all ratings for the hotel: `findMany({ where: { hotelId }, select: { rating: true } })`
- Computes mean: `sum / count` (0 if no reviews)
- Rounds to 1 decimal: `Math.round(avg * 10) / 10`
- Updates `Hotel.rating` via `prisma.hotel.update`

---

### 5.6 NotificationService (`notificationService.js`) — TO BE CREATED

Path: `server/server/services/notificationService.js`

**`registerToken(userId, token)`**
- Upserts `FcmToken` by `userId`: creates if absent, updates `token` if present
- Uses `prisma.fcmToken.upsert({ where: { userId }, create: { userId, token }, update: { token } })`

**`sendNotification(userId, { title, body })`**
- Looks up `FcmToken` for `userId`; returns silently if none found (Requirement 15.6)
- Calls `firebase.messaging().send({ token, notification: { title, body } })`
- On FCM error: logs the error and calls `prisma.fcmToken.delete({ where: { userId } })` to remove the invalid token (Requirement 15.7)

**`sendBookingConfirmedNotification(booking)`**
- Calls `sendNotification(booking.userId, { title: 'Booking Confirmed', body: '${hotelName} — Check-in: ${checkIn}' })`

**`sendBookingCancelledNotification(booking)`**
- Calls `sendNotification(booking.userId, { title: 'Booking Cancelled', body: '${hotelName}' })`

**`sendReminderNotification(booking)`**
- Calls `sendNotification(booking.userId, { title: 'Check-in Tomorrow', body: '${hotelName} — Check-in: ${checkIn}' })`

---

### 5.7 ReminderJob (`jobs/reminderEmails.js`)

- Cron schedule: `'0 9 * * *'` (daily at 09:00 server time)
- Starts automatically when `NODE_ENV === 'production'` or `ENABLE_CRON_JOBS === 'true'`

**Current behaviour:**
1. Computes `tomorrow` (midnight) and `dayAfterTomorrow`
2. Queries CONFIRMED bookings with `checkIn in [tomorrow, dayAfterTomorrow)`
3. Sends reminder email per booking via `sendReminderEmail`; logs and continues on per-booking failure

**Missing behaviour (gaps to fill):**
- **Gap 1 (Req 12.1)**: Query CONFIRMED bookings with `checkOut < now` and bulk-update their status to `COMPLETED`
- **Gap 2 (Req 15.5)**: After sending reminder email, also call `NotificationService.sendReminderNotification(booking)` in `try/catch`

---

## 6. Frontend Architecture

### 6.1 Routing

Defined in `client/src/App.jsx` using React Router v6. All routes are nested under `MainLayout` (Navbar + Footer + Outlet).

```
/                    → HomePage              (public)
/login               → LoginPage             (public)
/register            → RegisterPage          (public)
/hotels              → HotelListPage         (public)
/hotels/:id          → HotelDetailPage       (public)
/book/:hotelId/:roomId → BookingPage         (ProtectedRoute)
/my-bookings         → MyBookingsPage        (ProtectedRoute)
/profile             → ProfilePage           (ProtectedRoute)
/dashboard           → DashboardPage         (ProtectedRoute adminOnly)
*                    → NotFoundPage
```

`ProtectedRoute` redirects unauthenticated users to `/login`. When `adminOnly` is set, non-ADMIN users are redirected to `/`.

The `Chatbot` component is rendered outside the route tree so it persists across all navigations.

---

### 6.2 State Management

**AuthContext** (`client/src/context/AuthContext.jsx`)

Provides: `{ user, isAuthenticated, isLoading, login(), register(), logout() }`

Initialisation flow:
1. On mount, reads JWT from `localStorage`
2. If token exists, calls `GET /api/auth/me` to validate and restore session
3. On failure, removes token from `localStorage` and sets `isAuthenticated: false`

`login()` and `register()` store both `token` and `user` in `localStorage` and update context state. `logout()` calls `GET /api/auth/logout`, clears `localStorage`, and resets state.

**ThemeContext** (`client/src/context/ThemeContext.jsx`)

Provides: `{ theme, toggleTheme }` — persists the selected theme to `localStorage`.

**TanStack Query**

Used for all server state. Query keys follow a consistent pattern:

| Data | Query Key |
|------|-----------|
| Hotel list | `['hotels', { location, page, limit, checkIn, checkOut, guests }]` |
| Hotel detail | `['hotel', id]` |
| Rooms for hotel | `['rooms', hotelId, { checkIn, checkOut, guests }]` |
| User bookings | `['bookings']` |
| Single booking | `['booking', id]` |
| Hotel reviews | `['reviews', hotelId, page]` |
| Analytics | `['analytics', period]` |

Mutations for `createBooking` and `cancelBooking` invalidate `['bookings']` and `['rooms', hotelId]` caches.

---

### 6.3 Axios Instance (`client/src/services/api.js`)

```javascript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,  // sends HttpOnly cookie
});
```

**Request interceptor**: reads `localStorage.getItem('token')` and attaches `Authorization: Bearer <token>` header.

**Response interceptor**: on HTTP 401, clears `localStorage` (`token` and `user`) and redirects to `/login` via `window.location.href`.

---

### 6.4 API Service Modules

All exported from `client/src/services/api.js`:

| Module | Methods |
|--------|---------|
| `authAPI` | `register(data)`, `login(data)`, `logout()`, `getMe()` |
| `hotelsAPI` | `getAll(params)`, `getById(id)` |
| `roomsAPI` | `getByHotel(hotelId, params)`, `getById(id)` |
| `bookingsAPI` | `getMyBookings()`, `getById(id)`, `create(data)`, `cancel(id)`, `canReview(id)` |
| `reviewsAPI` | `getByHotel(hotelId, params)`, `getMyReviews()`, `create(data)`, `update(id, data)`, `delete(id)` |
| `aiAPI` | `getRecommendations(data)`, `getPersonalizedHotels(data)`, `getSentiment(hotelId)` |
| `chatbotAPI` | `chat(message, sessionId)`, `getHistory(sessionId)`, `clearHistory(sessionId)` |
| `analyticsAPI` | `getDashboardStats(period)`, `getUserStats()`, `getHotelStats(hotelId)` |

---

## 7. Component Design

### 7.1 Pages

**HomePage** (`pages/HomePage.jsx`)
- Hero section with `SearchForm`
- Featured hotels grid fetched via TanStack Query (`['hotels', {}]`)
- On search submit, navigates to `/hotels?location=...&checkIn=...&checkOut=...&guests=...`

**HotelListPage** (`pages/hotels/HotelListPage.jsx`)
- Reads `location`, `checkIn`, `checkOut`, `guests`, `page` from URL search params
- Fetches hotels via TanStack Query with those params as the query key
- Renders `HotelCard` grid, pagination controls, loading skeleton, and empty-state message

**HotelDetailPage** (`pages/hotels/HotelDetailPage.jsx`)
- Fetches hotel by `:id` via TanStack Query (`['hotel', id]`)
- Renders image gallery, amenities list, description, avgRating, and review count
- Renders `RoomCard` list; re-fetches room availability when date/guest inputs change
- Shows `ReviewModal` trigger when `canReview` is true for any of the user's bookings at this hotel

**BookingPage** (`pages/bookings/BookingPage.jsx`)
- Pre-fills `checkIn`, `checkOut`, `guests` from URL params (`:hotelId/:roomId`)
- `BookingForm` with React Hook Form + Yup; price summary updates reactively
- On submit, calls `bookingsAPI.create`; on success, navigates to `/my-bookings`

**MyBookingsPage** (`pages/bookings/MyBookingsPage.jsx`)
- Fetches user bookings via TanStack Query (`['bookings']`)
- Renders `BookingCard` list with hotel name, room type, dates, total price, status badge
- Cancel button visible only for CONFIRMED bookings with future check-in; calls `bookingsAPI.cancel` then invalidates cache
- Review button visible for COMPLETED bookings without an existing review

**ProfilePage** (`pages/user/ProfilePage.jsx`)
- Pre-fills form with `AuthContext.user` data
- Submits `PATCH /api/auth/me`; shows success notification on update

**DashboardPage** (`pages/admin/DashboardPage.jsx`)
- Fetches analytics via TanStack Query (`['analytics', period]`)
- Renders stat cards (total bookings, revenue, users, hotels)
- Recharts bar chart for bookings by status; line chart for revenue over time
- Period selector (week / month / year) updates query key and re-fetches

**LoginPage / RegisterPage** (`pages/auth/`)
- React Hook Form + Yup validation
- On success, calls `AuthContext.login()` / `AuthContext.register()` and redirects to `/`

---

### 7.2 Shared Components

**Navbar** (`components/Navbar.jsx`)
- Reads `{ user, isAuthenticated, logout }` from `AuthContext`
- Shows login/register links for guests; shows profile, bookings, and logout for users
- Shows dashboard link for ADMIN users
- Includes `ThemeToggle`

**Footer** (`components/Footer.jsx`) — static links

**ProtectedRoute** (`components/ProtectedRoute.jsx`)
- Reads `{ isAuthenticated, isLoading, user }` from `AuthContext`
- Shows spinner while `isLoading`
- Redirects to `/login` if not authenticated
- Redirects to `/` if `adminOnly` and `user.role !== 'ADMIN'`

**Chatbot** (`components/Chatbot.jsx`)
- Floating button fixed to bottom-right corner; visible on all pages
- Maintains `sessionId` in `useState` (generated once per mount)
- Chat panel with message history, input field, and send button
- Shows loading indicator while awaiting response
- Calls `chatbotAPI.chat(message, sessionId)` on send

**AIRecommendations** (`components/AIRecommendations.jsx`)
- Preference form (location preference, budget, amenities)
- Calls `aiAPI.getRecommendations(preferences)` on submit
- Renders ranked hotel cards

**ReviewModal** (`components/ReviewModal.jsx`)
- Modal with star rating selector (1–5) and optional comment textarea
- Submits to `reviewsAPI.create({ hotelId, bookingId, rating, comment })`
- On success, invalidates `['hotel', hotelId]` and `['reviews', hotelId]` caches

**ThemeToggle** (`components/ThemeToggle.jsx`)
- Calls `ThemeContext.toggleTheme()` on click; shows sun/moon icon based on current theme

---

### 7.3 Forms (React Hook Form + Yup)

**SearchForm**
- Fields: `location (string)`, `checkIn (date)`, `checkOut (date)`, `guests (number)`
- Validation: `checkIn` not in the past; `checkOut > checkIn`; `guests >= 1`

**BookingForm**
- Fields: `checkIn`, `checkOut`, `guests`, `specialRequests?`
- Validation: same date rules as SearchForm; additionally `guests <= room.capacity`

**LoginForm**
- Fields: `email`, `password`
- Validation: valid email format; password required

**RegisterForm**
- Fields: `email`, `password`, `firstName`, `lastName`, `phone?`
- Validation: valid email; `password.length >= 8`; firstName and lastName required

**ReviewForm**
- Fields: `rating (1–5 integer)`, `comment?`
- Validation: rating required and in range 1–5

**ProfileForm**
- Fields: `firstName`, `lastName`, `phone?`
- Validation: firstName and lastName required

---

## 8. Correctness Properties

These properties define invariants that must hold at all times in a correctly operating system. They are the basis for the property-based test suite in Section 9.

**P1 — No Double Booking**
For any room R and any two bookings B1 and B2 on R where both have status CONFIRMED or PENDING, their date ranges must not overlap:
`NOT (B1.checkIn < B2.checkOut AND B1.checkOut > B2.checkIn)`

**P2 — Price Calculation Correctness**
For any booking B:
`B.totalPrice = floor((B.checkOut.getTime() - B.checkIn.getTime()) / 86400000) * room.price`
The number of nights is always a positive integer.

**P3 — Date Ordering Invariant**
For every booking B in the system:
`B.checkIn < B.checkOut` (strict inequality)

**P4 — Capacity Constraint**
For every booking B:
`B.guests <= B.room.capacity`

**P5 — Review Eligibility**
A review R can only exist if:
- `R.booking.status === 'COMPLETED'`
- `R.booking.checkOut < now()`
- No other review exists with the same `bookingId` (`Review.bookingId` is `@unique`)

**P6 — Rating Bounds**
For every review R:
`1 <= R.rating <= 5` (integer)

**P7 — Hotel Rating Consistency**
`Hotel.rating = round(mean(reviews[].rating) * 10) / 10`
When `reviews` is empty, `Hotel.rating = 0`.

**P8 — Cancellation Eligibility**
A booking can only be cancelled if:
- `booking.status === 'CONFIRMED'`
- `booking.checkIn > now()`

**P9 — Availability Monotonicity**
If `checkRoomAvailability(roomId, A, B)` returns `false`, then for any sub-range `[C, D]` where `C >= A` and `D <= B`, it must also return `false`.
(A conflicting booking that blocks a wider window also blocks any narrower window within it.)

**P10 — FCM Token Uniqueness**
At most one `FcmToken` record exists per `userId` at any time. Registering a new token for a user replaces the previous one.

---

## 9. Property-Based Testing Strategy

**Test framework**: Vitest + fast-check

Install: `npm install --save-dev vitest @vitest/coverage-v8 fast-check`

Test files are co-located under `server/tests/`.

---

### P1 — No Double Booking (`server/tests/bookingService.test.js`)

```javascript
import fc from 'fast-check';
import { describe, it, expect } from 'vitest';

describe('P1: No double booking', () => {
  it('rejects a second booking when date ranges overlap', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          checkIn: fc.date({ min: new Date(), max: new Date(Date.now() + 365 * 86400000) }),
          nights: fc.integer({ min: 1, max: 30 }),
        }),
        fc.record({
          offsetDays: fc.integer({ min: -5, max: 5 }),  // overlap when abs(offset) < nights
          nights: fc.integer({ min: 1, max: 30 }),
        }),
        async (b1Input, b2Input) => {
          const b1CheckIn = b1Input.checkIn;
          const b1CheckOut = new Date(b1CheckIn.getTime() + b1Input.nights * 86400000);
          const b2CheckIn = new Date(b1CheckIn.getTime() + b2Input.offsetDays * 86400000);
          const b2CheckOut = new Date(b2CheckIn.getTime() + b2Input.nights * 86400000);

          const overlaps =
            b1CheckIn < b2CheckOut && b1CheckOut > b2CheckIn &&
            b2CheckIn >= new Date();  // must be future

          if (overlaps) {
            // Second booking must be rejected with 409
            await expect(createBooking({ ...b2Input, checkIn: b2CheckIn, checkOut: b2CheckOut }, testUser))
              .rejects.toMatchObject({ statusCode: 409 });
          } else if (b2CheckIn >= new Date() && b2CheckOut > b2CheckIn) {
            // Non-overlapping future booking must succeed
            await expect(createBooking({ ...b2Input, checkIn: b2CheckIn, checkOut: b2CheckOut }, testUser))
              .resolves.toBeDefined();
          }
        }
      )
    );
  });
});
```

---

### P2 — Price Calculation Correctness (`server/tests/bookingService.test.js`)

```javascript
describe('P2: Price calculation correctness', () => {
  it('totalPrice always equals nights * room.price', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 365 }),   // nights
        fc.float({ min: 10, max: 10000, noNaN: true }),  // price per night
        (nights, pricePerNight) => {
          const checkIn = new Date();
          const checkOut = new Date(checkIn.getTime() + nights * 86400000);
          const calculatedNights = Math.round(
            Math.abs((checkOut.getTime() - checkIn.getTime()) / 86400000)
          );
          const totalPrice = calculatedNights * pricePerNight;

          expect(calculatedNights).toBe(nights);
          expect(totalPrice).toBeCloseTo(nights * pricePerNight, 5);
        }
      )
    );
  });
});
```

---

### P7 — Hotel Rating Consistency (`server/tests/reviewService.test.js`)

```javascript
describe('P7: Hotel rating consistency', () => {
  it('Hotel.rating equals mean of review ratings rounded to 1 decimal', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 1, max: 5 }), { minLength: 0, maxLength: 100 }),
        (ratings) => {
          const expected =
            ratings.length === 0
              ? 0
              : Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10;

          const actual = computeHotelRating(ratings);  // extracted pure function from updateHotelRating
          expect(actual).toBe(expected);
        }
      )
    );
  });
});
```

---

### P3, P4, P6 — Input Validation Properties

These properties verify that invalid inputs are always rejected before reaching the service layer. Use Yup schema validation tests with fast-check:

```javascript
describe('P3: Date ordering invariant', () => {
  it('rejects checkOut <= checkIn', () => {
    fc.assert(
      fc.property(
        fc.date(),
        fc.integer({ min: -365, max: 0 }),  // non-positive offset = invalid
        (checkIn, offsetDays) => {
          const checkOut = new Date(checkIn.getTime() + offsetDays * 86400000);
          expect(() => bookingSchema.validateSync({ checkIn, checkOut })).toThrow();
        }
      )
    );
  });
});

describe('P4: Capacity constraint', () => {
  it('rejects guests > room.capacity', async () => {
    fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10 }),   // capacity
        fc.integer({ min: 1, max: 10 }),   // extra guests above capacity
        async (capacity, extra) => {
          const guests = capacity + extra;
          await expect(
            createBooking({ ...validBookingData, guests }, testUser, { capacity })
          ).rejects.toMatchObject({ statusCode: 400 });
        }
      )
    );
  });
});

describe('P6: Rating bounds', () => {
  it('rejects ratings outside 1-5', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.integer({ max: 0 }),           // below minimum
          fc.integer({ min: 6 })            // above maximum
        ),
        (rating) => {
          expect(() => reviewSchema.validateSync({ rating })).toThrow();
        }
      )
    );
  });
});
```

---

### P8 — Cancellation Eligibility (`server/tests/bookingService.test.js`)

```javascript
describe('P8: Cancellation eligibility', () => {
  it('rejects cancellation of past-checkIn bookings', async () => {
    fc.assert(
      fc.asyncProperty(
        fc.date({ max: new Date() }),  // checkIn in the past
        async (pastCheckIn) => {
          await expect(cancelBooking(bookingId, userId, { checkIn: pastCheckIn }))
            .rejects.toMatchObject({ statusCode: 400 });
        }
      )
    );
  });
});
```

---

### P9 — Availability Monotonicity (`server/tests/roomService.test.js`)

```javascript
describe('P9: Availability monotonicity', () => {
  it('a sub-range is unavailable when the full range is unavailable', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.date({ min: new Date() }),
        fc.integer({ min: 1, max: 30 }),   // full range nights
        fc.float({ min: 0.1, max: 0.9 }),  // sub-range start fraction
        fc.float({ min: 0.1, max: 0.9 }),  // sub-range end fraction
        async (start, nights, startFrac, endFrac) => {
          const end = new Date(start.getTime() + nights * 86400000);
          const subStart = new Date(start.getTime() + startFrac * nights * 86400000);
          const subEnd = new Date(start.getTime() + endFrac * nights * 86400000);
          if (subEnd <= subStart) return;  // skip degenerate case

          const fullAvailable = await checkRoomAvailability(testRoomId, start, end);
          if (!fullAvailable) {
            const subAvailable = await checkRoomAvailability(testRoomId, subStart, subEnd);
            expect(subAvailable).toBe(false);
          }
        }
      )
    );
  });
});
```

---

### P10 — FCM Token Uniqueness (`server/tests/notificationService.test.js`)

```javascript
describe('P10: FCM token uniqueness', () => {
  it('only one FcmToken record exists per user after multiple registrations', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.string({ minLength: 10, maxLength: 200 }), { minLength: 1, maxLength: 10 }),
        async (tokens) => {
          for (const token of tokens) {
            await registerToken(testUserId, token);
          }
          const count = await prisma.fcmToken.count({ where: { userId: testUserId } });
          expect(count).toBe(1);
          const record = await prisma.fcmToken.findUnique({ where: { userId: testUserId } });
          expect(record.token).toBe(tokens[tokens.length - 1]);  // last token wins
        }
      )
    );
  });
});
```

---

### Test File Summary

| File | Properties Covered |
|------|--------------------|
| `server/tests/bookingService.test.js` | P1, P2, P3, P4, P8 |
| `server/tests/reviewService.test.js` | P5, P6, P7 |
| `server/tests/roomService.test.js` | P9 |
| `server/tests/notificationService.test.js` | P10 |

---

## 10. Environment Configuration

### 10.1 Server (`server/.env`)

```
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/hotel_booking

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=7d

# SMTP (Nodemailer)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
FROM_NAME=Hotel Booking
FROM_EMAIL=noreply@hotelbooking.com

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Firebase Admin SDK (JSON string of service account key)
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"...","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"..."}

# Cron Jobs
ENABLE_CRON_JOBS=true

# Environment
NODE_ENV=production
PORT=5000
```

**Notes:**
- `FIREBASE_SERVICE_ACCOUNT_KEY` must be a valid JSON string. Parse it with `JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)` when initialising the Firebase Admin SDK.
- `JWT_SECRET` should be at least 32 characters of random entropy in production.
- `SMTP_PORT=587` uses STARTTLS (`secure: false`). Use `465` with `secure: true` for SSL.

---

### 10.2 Client (`client/.env`)

```
# API base URL
VITE_API_URL=http://localhost:5000/api

# Firebase Web SDK
VITE_FIREBASE_API_KEY=your-web-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
VITE_FIREBASE_VAPID_KEY=your-vapid-key-for-web-push
```

**Notes:**
- `VITE_FIREBASE_VAPID_KEY` is required for Web Push (FCM). Generate it in the Firebase Console under Project Settings → Cloud Messaging → Web Push certificates.
- All `VITE_` prefixed variables are bundled into the client build and are publicly visible. Do not put secrets here.

---

## 11. Gaps and Implementation Notes

### 11.1 Already Implemented (Working Skeleton)

The following features are fully implemented and functional:

- **Auth**: `register`, `login`, `logout`, `getMe`; `protect` middleware (Bearer + cookie); `restrictTo` middleware
- **Hotels**: full CRUD, case-insensitive location search with pagination, `avgRating` computed in JS
- **Rooms**: full CRUD, availability check with overlap predicate (`checkIn < bookingEnd && checkOut > bookingStart`), `isAvailable` annotation, `excludeBookingId` support
- **Bookings**: `createBooking` (date validation, capacity check, availability check, price calculation, email), `getUserBookings`, `getBookingById` (ownership check), `cancelBooking` (status/date guards, email), `canReviewBooking`
- **Reviews**: `createReview` (eligibility check via `canReviewBooking`), `updateReview`, `deleteReview`, `getHotelReviews`, `getUserReviews`, `updateHotelRating` (mean rounded to 1 decimal)
- **Email**: `sendBookingConfirmation`, `sendBookingCancellation`, `sendReminderEmail` via Nodemailer
- **ReminderJob**: daily cron at 09:00, sends reminder emails for next-day check-ins, per-booking error isolation
- **Analytics**: dashboard metrics (totals, revenue, bookings by status), hotel-specific metrics, period filtering
- **AI / Chatbot**: recommendation endpoint, chat endpoint with session history, history retrieval and deletion
- **Frontend routing**: all routes defined in `App.jsx` with `ProtectedRoute` and `adminOnly` guard
- **AuthContext**: JWT read from `localStorage` on init, `GET /api/auth/me` validation, `login`/`register`/`logout` methods
- **ThemeContext**: theme toggle with `localStorage` persistence
- **Axios instance**: `baseURL`, request interceptor (Bearer token), response interceptor (401 → redirect to `/login`), `withCredentials: true`
- **All page scaffolding**: `HomePage`, `HotelListPage`, `HotelDetailPage`, `BookingPage`, `MyBookingsPage`, `ProfilePage`, `DashboardPage`, `LoginPage`, `RegisterPage`
- **All shared components**: `Navbar`, `Footer`, `ProtectedRoute`, `Chatbot`, `AIRecommendations`, `ReviewModal`, `ThemeToggle`

---

### 11.2 Gaps to Fill

The following items are required by the specification but not yet implemented:

| # | Gap | Requirement(s) | Location |
|---|-----|----------------|----------|
| 1 | **NotificationService** does not exist | Req 15 | Create `server/server/services/notificationService.js` |
| 2 | **FcmToken Prisma model** not in schema | Req 15.1–15.2 | Add to `server/prisma/schema.prisma` + run migration |
| 3 | **POST /api/notifications/register-token** not implemented | Req 15.1 | Create route + controller |
| 4 | **BookingService** missing push notification calls after email sends | Req 9.7, 11.8 | Add `NotificationService.sendBookingConfirmedNotification` and `sendBookingCancelledNotification` calls in `try/catch` |
| 5 | **ReminderJob** missing COMPLETED status update | Req 12.1 | Query CONFIRMED bookings with `checkOut < now` and bulk-update to COMPLETED |
| 6 | **ReminderJob** missing push notification calls | Req 15.5 | Call `NotificationService.sendReminderNotification` per booking in `try/catch` |
| 7 | **PATCH /api/auth/me** not in `authRoutes.js` | Req 4.2 | Add route + controller method + service function |
| 8 | **Client FCM integration** not implemented | Req 15.1 | Request browser notification permission, call `getToken(messaging, { vapidKey })`, POST to `/api/notifications/register-token` |
| 9 | **TanStack Query** not wired to client pages | Req 20.1 | Migrate direct `api.*` calls to `useQuery`/`useMutation` hooks with correct query keys |
| 10 | **React Hook Form + Yup** not wired to forms | Req 1.7, 2.7, 9.9 | Wire validation schemas to `SearchForm`, `BookingForm`, `LoginForm`, `RegisterForm`, `ReviewForm`, `ProfileForm` |
| 11 | **Admin hotel/room management UI** missing | Req 7, 8 | Add hotel/room CRUD forms to `DashboardPage` |
| 12 | **Cloudinary upload middleware** not wired | Req 16 | Wire Multer + Cloudinary upload stream to `POST /api/hotels` and `POST /api/hotels/:hotelId/rooms` |
| 13 | **Test suite** does not exist | — | Set up Vitest + fast-check; create test files per Section 9 |

---

### 11.3 Implementation Priority

Suggested order based on dependency and risk:

1. **FcmToken schema migration** (unblocks NotificationService)
2. **NotificationService** (unblocks gaps 4, 6)
3. **Notification route + controller** (completes Req 15.1–15.2)
4. **BookingService push notification calls** (completes Req 9.7, 11.8)
5. **ReminderJob COMPLETED update** (completes Req 12.1)
6. **ReminderJob push notification calls** (completes Req 15.5)
7. **PATCH /api/auth/me** (completes Req 4.2)
8. **Client FCM integration** (completes Req 15.1 client side)
9. **TanStack Query migration** (completes Req 20.1)
10. **React Hook Form + Yup wiring** (completes Req 1.7, 2.7, 9.9)
11. **Cloudinary upload middleware** (completes Req 16)
12. **Admin hotel/room management UI** (completes Req 7–8 admin UI)
13. **Test suite setup** (validates all correctness properties)

