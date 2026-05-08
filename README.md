# Hotel Booking System

A full-stack hotel booking platform where users can search hotels, check room availability, make and manage reservations, and leave reviews. Admins manage hotel inventory through a dedicated dashboard.

---

## Tech Stack

### Frontend
| Tool | Purpose |
|------|---------|
| React 18 + Vite | UI framework and build tool |
| React Router v6 | Client-side routing |
| TanStack Query v5 | Server state management and caching |
| Axios | HTTP client with interceptors |
| React Hook Form + Yup | Form state and validation |
| Tailwind CSS | Utility-first styling |
| Recharts | Analytics charts (admin dashboard) |
| Lucide React | Icon library |
| Day.js | Date formatting |

### Backend
| Tool | Purpose |
|------|---------|
| Node.js + Express | REST API server |
| Prisma ORM | Database access layer |
| PostgreSQL | Relational database |
| JWT + bcrypt | Authentication and password hashing |
| Nodemailer | Transactional emails |
| Cloudinary | Hotel and room image storage |
| Firebase Admin SDK | Push notifications (FCM) |
| Multer | Multipart file upload parsing |
| Helmet + express-rate-limit | Security headers and rate limiting |
| node-cron | Scheduled jobs (reminders, status updates) |
| Joi | Request body validation |

---

## Project Structure

```
hotel-booking-system/
├── client/                        # React + Vite frontend
│   ├── src/
│   │   ├── components/            # Shared UI components
│   │   │   ├── AIRecommendations.jsx
│   │   │   ├── Chatbot.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   ├── ReviewModal.jsx
│   │   │   └── ThemeToggle.jsx
│   │   ├── context/
│   │   │   ├── AuthContext.jsx    # JWT session state
│   │   │   └── ThemeContext.jsx   # Dark/light mode
│   │   ├── layouts/
│   │   │   └── MainLayout.jsx     # Navbar + Footer wrapper
│   │   ├── pages/
│   │   │   ├── admin/DashboardPage.jsx
│   │   │   ├── auth/LoginPage.jsx
│   │   │   ├── auth/RegisterPage.jsx
│   │   │   ├── bookings/BookingPage.jsx
│   │   │   ├── bookings/MyBookingsPage.jsx
│   │   │   ├── hotels/HotelDetailPage.jsx
│   │   │   ├── hotels/HotelListPage.jsx
│   │   │   ├── user/ProfilePage.jsx
│   │   │   ├── HomePage.jsx
│   │   │   └── NotFoundPage.jsx
│   │   ├── services/
│   │   │   └── api.js             # Axios instance + API modules
│   │   ├── App.jsx                # Route definitions
│   │   ├── main.jsx               # Entry point
│   │   └── index.css              # Global styles
│   ├── .env.example               # Client env template
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── server/                        # Node.js + Express backend
│   ├── server/
│   │   ├── config/
│   │   │   ├── cloudinary.js      # Cloudinary SDK init
│   │   │   └── database.js        # Prisma client singleton
│   │   ├── controllers/           # Request/response handlers
│   │   │   ├── aiController.js
│   │   │   ├── analyticsController.js
│   │   │   ├── authController.js
│   │   │   ├── bookingController.js
│   │   │   ├── chatbotController.js
│   │   │   ├── hotelController.js
│   │   │   ├── reviewController.js
│   │   │   └── roomController.js
│   │   ├── jobs/
│   │   │   └── reminderEmails.js  # Daily cron: reminders + COMPLETED status
│   │   ├── middleware/
│   │   │   ├── auth.js            # protect / restrictTo / optionalAuth
│   │   │   ├── errorHandler.js    # Global error handler
│   │   │   └── validate.js        # Joi request validation
│   │   ├── routes/
│   │   │   ├── aiRoutes.js
│   │   │   ├── analyticsRoutes.js
│   │   │   ├── authRoutes.js
│   │   │   ├── bookingRoutes.js
│   │   │   ├── chatbotRoutes.js
│   │   │   ├── hotelRoutes.js
│   │   │   ├── reviewRoutes.js
│   │   │   └── roomRoutes.js
│   │   ├── services/              # Business logic layer
│   │   │   ├── aiRecommendationService.js
│   │   │   ├── analyticsService.js
│   │   │   ├── authService.js
│   │   │   ├── bookingService.js
│   │   │   ├── chatbotService.js
│   │   │   ├── hotelService.js
│   │   │   ├── reviewService.js
│   │   │   └── roomService.js
│   │   └── utils/
│   │       ├── AppError.js        # Operational error class
│   │       ├── catchAsync.js      # Async error wrapper
│   │       └── email.js           # Nodemailer email helpers
│   ├── prisma/
│   │   ├── schema.prisma          # Database schema
│   │   └── seed.js                # Sample data seeder
│   ├── .env.example               # Server env template
│   ├── app.js                     # Express app setup
│   ├── package.json
│   └── server.js                  # Entry point
│
├── .gitignore
└── README.md
```

---

## Features

### Core
- **Authentication** — JWT register/login/logout, session persistence via `localStorage`, HttpOnly cookie support, role-based access (USER / ADMIN)
- **Hotel Browsing** — paginated hotel list, case-insensitive location search, hotel detail with images and amenities
- **Room Availability** — real-time availability check using overlap predicate, filter by guest count
- **Booking System** — date validation, capacity check, double-booking prevention via atomic conflict check, price calculation (`nights × room.price`)
- **Booking Management** — view all bookings, cancel with eligibility rules, automatic COMPLETED status via cron
- **Reviews & Ratings** — post-stay reviews only, 1–5 star rating, duplicate prevention, hotel average rating recalculation
- **Email Notifications** — booking confirmation, cancellation, and check-in reminder emails via Nodemailer
- **Push Notifications** — Firebase Cloud Messaging for booking events and reminders
- **Dark Mode** — system-aware theme toggle persisted to `localStorage`

### Advanced
- **AI Recommendations** — personalised hotel suggestions via Hugging Face API
- **Booking Chatbot** — conversational assistant with session history
- **Admin Dashboard** — analytics with Recharts (revenue, bookings by status, occupancy)
- **Image Upload** — Cloudinary integration for hotel and room images

---

## Prerequisites

- **Node.js** v18+
- **PostgreSQL** v14+
- **npm** v9+
- A **Cloudinary** account (free tier works)
- An **SMTP** provider (Gmail App Password, Mailtrap, etc.)
- A **Firebase** project with Cloud Messaging enabled (for push notifications)

---

## Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/your-username/hotel-booking-system.git
cd hotel-booking-system
```

### 2. Backend setup

```bash
cd server
npm install
cp .env.example .env
```

Edit `server/.env` and fill in your credentials (see [Environment Variables](#environment-variables) below).

```bash
# Run database migrations
npx prisma migrate dev --name init

# Seed sample data (hotels, rooms, admin user)
node prisma/seed.js

# Start the dev server
npm run dev
```

The API will be available at **http://localhost:5000**

### 3. Frontend setup

```bash
cd client
npm install
cp .env.example .env
```

Edit `client/.env` — at minimum set `VITE_API_URL=http://localhost:5000/api`.

```bash
npm run dev
```

The app will be available at **http://localhost:5173**

---

## Environment Variables

### Server (`server/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | Secret key for signing JWTs (min 32 chars) |
| `JWT_EXPIRES_IN` | ✅ | Token expiry e.g. `7d` |
| `PORT` | ✅ | Server port (default `5000`) |
| `NODE_ENV` | ✅ | `development` or `production` |
| `CLIENT_URL` | ✅ | Frontend origin for CORS (e.g. `http://localhost:5173`) |
| `CLOUDINARY_CLOUD_NAME` | ✅ | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | ✅ | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | ✅ | Cloudinary API secret |
| `SMTP_HOST` | ✅ | SMTP server host |
| `SMTP_PORT` | ✅ | SMTP port (`587` for STARTTLS) |
| `SMTP_USER` | ✅ | SMTP username / email |
| `SMTP_PASS` | ✅ | SMTP password / app password |
| `FROM_EMAIL` | ✅ | Sender email address |
| `FROM_NAME` | ✅ | Sender display name |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | ⚠️ | Firebase Admin SDK service account JSON (single-line string) |
| `ENABLE_CRON_JOBS` | ⚠️ | Set to `true` to enable the daily reminder cron |
| `HUGGING_FACE_API_KEY` | ⚠️ | Required for AI recommendations feature |

> ⚠️ = required only for that specific feature

### Client (`client/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | ✅ | Backend API base URL |
| `VITE_FIREBASE_API_KEY` | ⚠️ | Firebase Web SDK API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | ⚠️ | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | ⚠️ | Firebase project ID |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | ⚠️ | FCM sender ID |
| `VITE_FIREBASE_APP_ID` | ⚠️ | Firebase app ID |
| `VITE_FIREBASE_VAPID_KEY` | ⚠️ | VAPID key for Web Push |

---

## Default Seed Accounts

After running `node prisma/seed.js`:

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@hotelbooking.com` | `admin123456` |
| User | `user@example.com` | `password123` |

---

## API Reference

### Auth — `/api/auth`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | Public | Register new user |
| POST | `/login` | Public | Login, returns JWT |
| GET | `/logout` | Public | Clear session cookie |
| GET | `/me` | 🔒 | Get current user |
| PATCH | `/me` | 🔒 | Update profile |

### Hotels — `/api/hotels`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Public | Paginated list with search (`?location=&page=&limit=&checkIn=&checkOut=&guests=`) |
| GET | `/:id` | Public | Hotel detail with rooms and reviews |
| POST | `/` | 🔒 Admin | Create hotel |
| PATCH | `/:id` | 🔒 Admin | Update hotel |
| DELETE | `/:id` | 🔒 Admin | Delete hotel |

### Rooms — `/api/hotels/:hotelId/rooms` and `/api/rooms`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/hotels/:hotelId/rooms` | Public | Rooms with availability (`?checkIn=&checkOut=&guests=`) |
| POST | `/hotels/:hotelId/rooms` | 🔒 Admin | Create room |
| GET | `/rooms/:id` | Public | Room detail |
| PATCH | `/rooms/:id` | 🔒 Admin | Update room |
| DELETE | `/rooms/:id` | 🔒 Admin | Delete room |

### Bookings — `/api/bookings`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/` | 🔒 | Create booking |
| GET | `/my` | 🔒 | User's bookings |
| GET | `/:id` | 🔒 | Booking detail (owner only) |
| DELETE | `/:id` | 🔒 | Cancel booking |
| GET | `/:id/can-review` | 🔒 | Check review eligibility |

### Reviews — `/api/hotels/:hotelId/reviews` and `/api/reviews`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/hotels/:hotelId/reviews` | Public | Paginated reviews |
| POST | `/hotels/:hotelId/reviews` | 🔒 | Create review (post-stay only) |
| GET | `/reviews/my/reviews` | 🔒 | User's reviews |
| PATCH | `/reviews/:id` | 🔒 | Update own review |
| DELETE | `/reviews/:id` | 🔒 | Delete own review |

### Notifications — `/api/notifications`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register-token` | 🔒 | Register FCM push token |

### Analytics — `/api/analytics` (Admin only)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/dashboard` | 🔒 Admin | System metrics (`?period=week\|month\|year`) |
| GET | `/hotel/:hotelId` | 🔒 Admin | Per-hotel metrics |

### AI — `/api/ai`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/recommendations` | 🔒 | Personalised hotel recommendations |

### Chatbot — `/api/chatbot`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/chat` | 🔒 | Send message, get response |
| GET | `/history/:sessionId` | 🔒 | Conversation history |
| DELETE | `/history/:sessionId` | 🔒 | Clear history |

---

## Scripts

### Backend (`server/`)
```bash
npm run dev          # Start with nodemon (hot reload)
npm start            # Start production server
npm run db:generate  # Regenerate Prisma client
npm run db:migrate   # Run pending migrations
npm run db:push      # Push schema without migration file
npm run db:seed      # Seed sample data
npm run db:studio    # Open Prisma Studio (GUI)
```

### Frontend (`client/`)
```bash
npm run dev          # Start Vite dev server
npm run build        # Production build → dist/
npm run preview      # Preview production build locally
npm run lint         # ESLint check
```

---

## Production Deployment

1. Set all environment variables on your hosting platform
2. Run database migrations: `cd server && npx prisma migrate deploy`
3. Build the frontend: `cd client && npm run build`
4. Serve `client/dist/` as static files (Nginx, Vercel, Netlify, etc.)
5. Start the backend: `cd server && npm start`
6. Set `ENABLE_CRON_JOBS=true` on the server to activate daily reminders

> The backend serves only the API. The frontend build is a static SPA that can be deployed independently to any CDN.

---

## License

ISC
