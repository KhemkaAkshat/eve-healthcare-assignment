# EVE Healthcare Backend Assignment

Backend service for diagnostic test bookings and simulated payments, built using Node.js, Express, PostgreSQL and Sequelize.

## Tech Stack

- Node.js
- Express.js
- PostgreSQL
- Sequelize
- JWT
- bcrypt
- Zod
- Jest
- Supertest

## Setup

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd eve-healthcare-assignment
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
PORT=5000
DB_URL=your_postgresql_connection_string
JWT_SECRET=your_jwt_secret
```

The PostgreSQL database used during development was hosted on Neon.

### 4. Run database migrations

```bash
npx sequelize-cli db:migrate
```

### 5. Start the server

For development:

```bash
npm run dev
```

Or:

```bash
npm start
```

The API will run on:

```text
http://localhost:5000
```

Health check:

```text
GET /health
```

## API Flow

The basic application flow is:

1. Register a user using `/api/auth/signup`
2. Login using `/api/auth/login`
3. Use the returned JWT token for protected endpoints
4. Create/retrieve diagnostic centres
5. Create/retrieve diagnostic tests
6. Create a booking
7. Create a simulated payment for the booking
8. Process payment webhooks using `/api/payments/webhook`

## Main Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/signup` | Register user |
| POST | `/api/auth/login` | Login |
| POST | `/api/centres` | Create diagnostic centre |
| GET | `/api/centres` | Get centres |
| GET | `/api/centres/:id` | Get centre |
| POST | `/api/tests` | Create diagnostic test |
| GET | `/api/tests` | Get tests |
| GET | `/api/tests/:id` | Get test |
| POST | `/api/bookings` | Create booking |
| GET | `/api/bookings` | Get user's bookings |
| GET | `/api/bookings/:id` | Get a booking |
| POST | `/api/payments` | Create simulated payment |
| POST | `/api/payments/webhook` | Process payment webhook |

Protected endpoints require:

```http
Authorization: Bearer <jwt-token>
```

## Database

The main tables are:

- `users`
- `diagnostic_centres`
- `diagnostic_tests`
- `bookings`
- `payments`
- `webhook_events`

The main relationships are:

- User → Bookings
- Diagnostic Centre → Tests
- Diagnostic Centre → Bookings
- Diagnostic Test → Bookings
- Booking → Payment
- Payment → Webhook Events

## Testing

Run the test suite using:

```bash
npm test
```

The tests cover authentication, bookings, payments, authorization, validation and webhook idempotency.

## Assumptions

- Payments are simulated; no real payment gateway is used.
- Payment success/failure is randomly simulated.
- A booking can have only one payment.
- Appointment time must be in the future.
- A diagnostic test belongs to one diagnostic centre.
- The booking stores the test price at the time of booking.
- Webhook `eventId` is used to prevent duplicate webhook processing.
- No separate admin role is implemented because it was not specified in the assignment.
- Booking cancellation is included as a possible booking status, but a cancellation API is not implemented.

## Migration Commands

Check migration status:

```bash
npx sequelize-cli db:migrate:status
```

Run migrations:

```bash
npx sequelize-cli db:migrate
```

Undo the latest migration:

```bash
npx sequelize-cli db:migrate:undo
```

## Project Structure

```text
src/
├── config/
├── controllers/
├── middleware/
├── migrations/
├── models/
├── routes/
├── services/
├── seeders/
├── utils/
├── validations/
└── server.js

tests/
├── auth.test.js
├── booking.test.js
└── payment.test.js
```
