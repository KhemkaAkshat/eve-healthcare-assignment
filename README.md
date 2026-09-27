# EVE Healthcare Backend Assignment

A backend service for diagnostic test bookings and simulated payments, built as part of the EVE Healthcare SDE Intern Backend Assignment.

The application provides:

- User authentication using JWT
- Diagnostic centre management
- Diagnostic test management
- Diagnostic test booking
- Simulated payment processing
- Payment status handling
- Idempotent payment webhooks
- Request validation
- Database transactions
- Automated API tests

---

# 1. Tech Stack

| Technology | Purpose |
|---|---|
| Node.js | Backend runtime |
| Express.js | REST API framework |
| PostgreSQL | Relational database |
| Neon | Hosted PostgreSQL database |
| Sequelize | ORM and database migrations |
| JWT | Authentication |
| bcrypt | Password hashing |
| Zod | Request validation |
| Jest | Testing framework |
| Supertest | HTTP API testing |

---

# 2. Project Structure

```text
eve-healthcare-assignment/
├── src/
│   ├── config/
│   │   ├── database.js
│   │   └── sequelize-cli-config.js
│   ├── controllers/
│   ├── middleware/
│   ├── migrations/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── seeders/
│   ├── validations/
│   ├── utils/
│   └── server.js
├── tests/
│   ├── auth.test.js
│   ├── booking.test.js
│   └── payment.test.js
├── .env
├── .gitignore
├── .sequelizerc
├── package.json
├── package-lock.json
└── README.md
```

The application follows a controller, route, model and validation based structure. Business logic is currently kept inside the controllers to keep the assignment implementation small and easy to follow.

---

# 3. Prerequisites

Before running the project, make sure the following are installed.

### Node.js

Node.js 18+ is recommended.

Check your installation:

```bash
node --version
```

### PostgreSQL

The application uses PostgreSQL. The project was configured with a PostgreSQL database hosted on Neon.

### Git

Git is recommended for cloning and managing the repository.

Check your installation:

```bash
git --version
```

---

# 4. Installation

Clone the repository:

```bash
git clone <your-repository-url>
```

Move into the project directory:

```bash
cd eve-healthcare-assignment
```

Install dependencies:

```bash
npm install
```

---

# 5. Environment Variables

Create a `.env` file in the root directory.

```env
PORT=5000

DB_URL=postgresql://username:password@host/database?sslmode=require

JWT_SECRET=your_super_secret_key
```

### Environment variables

| Variable | Description |
|---|---|
| `PORT` | Port on which the Express server runs |
| `DB_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret key used to sign JWT tokens |

Do not commit the `.env` file to Git.

The project already includes `.env` in `.gitignore`.

---

# 6. Database Setup

The project uses Sequelize migrations for database schema management.

Run all pending migrations:

```bash
npx sequelize-cli db:migrate
```

To check the migration status:

```bash
npx sequelize-cli db:migrate:status
```

To undo the most recent migration:

```bash
npx sequelize-cli db:migrate:undo
```

The database contains the following main tables:

- `users`
- `diagnostic_centres`
- `diagnostic_tests`
- `bookings`
- `payments`
- `webhook_events`

---

# 7. Database Design

## Users

Stores registered application users.

Main fields:

- `id`
- `name`
- `email`
- `password`
- `created_at`

The password is stored as a bcrypt hash rather than plain text.

---

## Diagnostic Centres

Stores diagnostic centre information.

Main fields:

- `id`
- `name`
- `location`
- `created_at`

---

## Diagnostic Tests

Stores tests offered by diagnostic centres.

Main fields:

- `id`
- `centre_id`
- `name`
- `price`
- `created_at`

Each diagnostic test belongs to one diagnostic centre.

---

## Bookings

Stores appointments created by authenticated users.

Main fields:

- `id`
- `user_id`
- `test_id`
- `centre_id`
- `appointment_at`
- `amount`
- `status`
- `created_at`

Booking status can be:

```text
PENDING
CONFIRMED
FAILED
CANCELLED
```

The booking stores the test price as `amount` at the time of booking. This means that later changes to the diagnostic test price do not change the amount associated with an existing booking.

The booking also stores both `test_id` and `centre_id`. During booking creation, the API verifies that the selected diagnostic test actually belongs to the selected centre.

---

## Payments

Stores simulated payment information.

Main fields:

- `id`
- `booking_id`
- `payment_reference`
- `amount`
- `status`
- `created_at`

Payment status can be:

```text
SUCCESS
FAILED
```

Each booking can have at most one payment.

---

## Webhook Events

Stores processed payment webhook events.

Main fields:

- `id`
- `event_id`
- `payment_reference`
- `status`
- `created_at`

`event_id` is unique and is used to make webhook processing idempotent.

---

# 8. Entity Relationships

The main relationships are:

```text
User
  |
  | 1:N
  v
Booking
  | \
  |  \
  |   \
  v    v
Test  Diagnostic Centre
  |
  v
Diagnostic Centre

Booking
  |
  | 1:1
  v
Payment

Payment
  |
  v
Webhook Events
```

More specifically:

- One user can have many bookings.
- One diagnostic centre can have many diagnostic tests.
- One diagnostic centre can have many bookings.
- One diagnostic test can have many bookings.
- One booking can have one payment.
- A payment can have multiple webhook delivery attempts, while each unique webhook event is stored only once.

---

# 9. Running the Application

Start the development server:

```bash
npm run dev
```

Or start the application normally:

```bash
npm start
```

The server runs on:

```text
http://localhost:5000
```

A health-check endpoint is available at:

```text
GET /health
```

Example response:

```json
{
  "success": true,
  "message": "EVE Healthcare API is running"
}
```

---

# 10. Authentication

Authentication is implemented using JWT.

The flow is:

```text
Signup
   |
   v
User created
   |
   v
Login
   |
   v
JWT generated
   |
   v
JWT sent in Authorization header
   |
   v
Protected API
```

Protected endpoints require:

```http
Authorization: Bearer <token>
```

---

# 11. API Endpoints

## Authentication

### Register User

```http
POST /api/auth/signup
```

Request:

```json
{
  "name": "Akshat Khemka",
  "email": "akshat@example.com",
  "password": "password123"
}
```

Successful response:

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 1,
      "name": "Akshat Khemka",
      "email": "akshat@example.com"
    },
    "token": "<jwt-token>"
  }
}
```

Validation includes:

- Name must contain at least 2 characters.
- Email must be valid.
- Password must contain at least 8 characters.
- Duplicate email addresses are rejected.

---

### Login

```http
POST /api/auth/login
```

Request:

```json
{
  "email": "akshat@example.com",
  "password": "password123"
}
```

Successful response:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "name": "Akshat Khemka",
      "email": "akshat@example.com"
    },
    "token": "<jwt-token>"
  }
}
```

Invalid credentials return an unauthorized response.

---

# 12. Diagnostic Centre APIs

## Create Diagnostic Centre

```http
POST /api/centres
```

Authentication required.

Headers:

```http
Authorization: Bearer <token>
Content-Type: application/json
```

Request:

```json
{
  "name": "Apollo Diagnostics",
  "location": "Delhi"
}
```

A diagnostic centre must have:

- Name
- Location

---

## Get All Diagnostic Centres

```http
GET /api/centres
```

Authentication is not required.

Returns the available diagnostic centres.

---

## Get Diagnostic Centre by ID

```http
GET /api/centres/:id
```

Example:

```http
GET /api/centres/1
```

Returns the requested diagnostic centre and its available diagnostic tests.

---

# 13. Diagnostic Test APIs

## Create Diagnostic Test

```http
POST /api/tests
```

Authentication required.

Request:

```json
{
  "centreId": 1,
  "name": "Complete Blood Count",
  "price": 500
}
```

The API verifies that the specified diagnostic centre exists before creating the test.

---

## Get All Diagnostic Tests

```http
GET /api/tests
```

Authentication is not required.

---

## Get Diagnostic Test by ID

```http
GET /api/tests/:id
```

Example:

```http
GET /api/tests/1
```

The response includes information about the associated diagnostic centre.

---

# 14. Booking APIs

Bookings require authentication.

## Create Booking

```http
POST /api/bookings
```

Headers:

```http
Authorization: Bearer <token>
Content-Type: application/json
```

Request:

```json
{
  "testId": 1,
  "centreId": 1,
  "appointmentAt": "2026-10-01T10:30:00.000Z"
}
```

The API performs several validations before creating the booking:

1. The request body is validated.
2. The selected diagnostic centre must exist.
3. The selected diagnostic test must exist.
4. The diagnostic test must belong to the selected centre.
5. The appointment time must be in the future.
6. The booking amount is taken from the diagnostic test price.
7. The initial booking status is `PENDING`.

Example booking:

```json
{
  "id": 1,
  "userId": 1,
  "testId": 1,
  "centreId": 1,
  "appointmentAt": "2026-10-01T10:30:00.000Z",
  "amount": "500.00",
  "status": "PENDING"
}
```

---

## Get My Bookings

```http
GET /api/bookings
```

Authentication required.

The endpoint returns only bookings belonging to the authenticated user.

---

## Get Booking by ID

```http
GET /api/bookings/:id
```

Authentication required.

Example:

```http
GET /api/bookings/1
```

The query is restricted using both the booking ID and the authenticated user's ID.

This prevents one user from accessing another user's booking.

---

# 15. Payment APIs

Payments are simulated. No real payment gateway is used.

## Create Payment

```http
POST /api/payments
```

Authentication required.

Request:

```json
{
  "bookingId": 1
}
```

The payment service:

1. Verifies that the booking exists.
2. Verifies that the booking belongs to the authenticated user.
3. Checks whether a payment already exists for the booking.
4. Verifies that the booking is still `PENDING`.
5. Generates a unique payment reference.
6. Simulates a payment result.
7. Creates the payment record.
8. Updates the booking status.
9. Commits the transaction.

The simulated payment has two possible outcomes:

```text
SUCCESS
FAILED
```

For a successful payment:

```text
Payment status  -> SUCCESS
Booking status  -> CONFIRMED
```

For a failed payment:

```text
Payment status  -> FAILED
Booking status  -> FAILED
```

---

# 16. Payment Webhook

```http
POST /api/payments/webhook
```

The webhook does not use JWT authentication because it represents an external payment provider sending a payment event.

Request:

```json
{
  "eventId": "evt_12345",
  "paymentReference": "PAY_12345",
  "status": "SUCCESS"
}
```

The webhook verifies:

1. The request payload is valid.
2. The event has not already been processed.
3. The payment reference exists.
4. The webhook status matches the stored payment status.
5. The associated booking exists.

The booking is then updated based on the payment status.

---

# 17. Webhook Idempotency

Webhook idempotency is implemented using a unique `event_id`.

When a webhook arrives:

```text
Webhook request
      |
      v
Check event_id
      |
      +---- Already exists ----> Return already processed
      |
      v
Find payment
      |
      v
Validate payment status
      |
      v
Update booking
      |
      v
Store webhook event
```

If the exact same event is received again, the API does not process the payment again.

Example response for a repeated event:

```json
{
  "success": true,
  "message": "Webhook event already processed"
}
```

The `webhook_events.event_id` database constraint provides an additional database-level uniqueness guarantee.

---

# 18. Transactions

Database transactions are used for payment creation and webhook processing.

For payment creation:

```text
BEGIN TRANSACTION
      |
      +-- Create payment
      |
      +-- Update booking
      |
      v
COMMIT
```

If an error occurs:

```text
ROLLBACK
```

This prevents a situation where the payment is created but the booking status is not updated, or vice versa.

The same approach is used for webhook processing.

---

# 19. Validation

Request validation is implemented using Zod.

Validation is used for:

- Signup
- Login
- Diagnostic centre creation
- Diagnostic test creation
- Booking creation
- Payment creation
- Payment webhook

Invalid input returns a `400 Bad Request` response rather than allowing invalid data to reach the database.

Examples of validation handled by the API include:

- Invalid email
- Short passwords
- Missing required fields
- Invalid IDs
- Invalid prices
- Invalid appointment timestamps
- Past appointment times
- Invalid payment status
- Missing webhook event IDs

---

# 20. Authorization and Security

The API uses JWT authentication for protected endpoints.

Users can only access their own bookings.

For example, when retrieving a booking, the application uses the authenticated user ID along with the booking ID:

```text
bookingId = requested ID
AND
userId = authenticated user
```

This prevents a user from simply changing the booking ID in the URL to access another user's booking.

Passwords are hashed using bcrypt before being stored.

JWT secrets and database credentials are stored in environment variables.

---

# 21. Important Edge Cases

The implementation handles several real-world failure cases.

### Invalid request

Invalid request data returns a validation error.

### Invalid booking ID

If a booking does not exist or does not belong to the authenticated user:

```text
Booking not found
```

### Invalid diagnostic test

If the requested test does not exist:

```text
Diagnostic test not found
```

### Centre and test mismatch

If a test belongs to a different centre:

```text
Diagnostic test does not belong to the selected centre
```

### Past appointment

Appointments must be scheduled for a future time.

```text
Appointment time must be in the future
```

### Duplicate payment

A booking cannot have more than one payment.

```text
Payment already exists for this booking
```

### Failed payment

A failed simulated payment updates the booking to:

```text
FAILED
```

### Duplicate webhook

Previously processed webhook events are not processed again.

### Invalid webhook payment reference

If the payment reference does not exist:

```text
Payment not found
```

### Webhook status mismatch

The webhook status must match the stored payment status.

```text
Webhook status does not match payment status
```

---

# 22. Testing

The project uses Jest and Supertest for API testing.

Run all tests:

```bash
npm test
```

The current test suite covers:

### Authentication

- Successful signup
- Duplicate email
- Invalid signup data
- Successful login
- Invalid credentials
- Validation failures

### Bookings

- Successful booking creation
- Authentication requirement
- Invalid test ID
- Centre/test mismatch
- Past appointment
- Invalid booking data
- Listing user's bookings
- Getting user's booking
- Non-existent booking
- Unauthorized access to another user's booking

### Payments

- Successful simulated payment
- Failed simulated payment
- Duplicate payment
- Invalid booking
- Unauthorized payment attempt
- Successful webhook
- Failed webhook
- Invalid payment reference
- Webhook status mismatch
- Duplicate webhook event
- Webhook validation cases

The current test suite contains:

```text
Test Suites: 3 passed, 3 total
Tests:       36 passed, 36 total
```

---

# 23. Useful Commands

Install dependencies:

```bash
npm install
```

Run development server:

```bash
npm run dev
```

Run production-style server:

```bash
npm start
```

Run tests:

```bash
npm test
```

Run migrations:

```bash
npx sequelize-cli db:migrate
```

Check migration status:

```bash
npx sequelize-cli db:migrate:status
```

Undo the latest migration:

```bash
npx sequelize-cli db:migrate:undo
```

---

# 24. API Summary

| Method | Endpoint | Authentication | Purpose |
|---|---|---|---|
| GET | `/health` | No | Health check |
| POST | `/api/auth/signup` | No | Register user |
| POST | `/api/auth/login` | No | Login user |
| POST | `/api/centres` | Yes | Create diagnostic centre |
| GET | `/api/centres` | No | Get all centres |
| GET | `/api/centres/:id` | No | Get centre |
| POST | `/api/tests` | Yes | Create diagnostic test |
| GET | `/api/tests` | No | Get all tests |
| GET | `/api/tests/:id` | No | Get test |
| POST | `/api/bookings` | Yes | Create booking |
| GET | `/api/bookings` | Yes | Get user's bookings |
| GET | `/api/bookings/:id` | Yes | Get user's booking |
| POST | `/api/payments` | Yes | Create simulated payment |
| POST | `/api/payments/webhook` | No | Process payment webhook |

---

# 25. Example End-to-End Flow

A typical successful booking flow looks like this:

```text
1. User signs up
       |
       v
2. User logs in
       |
       v
3. JWT token is generated
       |
       v
4. Diagnostic centre is created
       |
       v
5. Diagnostic test is created
       |
       v
6. User creates a booking
       |
       v
   Booking = PENDING
       |
       v
7. User creates payment
       |
       v
8. Payment is simulated
       |
       +----------------------+
       |                      |
       v                      v
    SUCCESS                 FAILED
       |                      |
       v                      v
Booking CONFIRMED        Booking FAILED
       |
       v
9. Payment webhook can be received
       |
       v
10. Webhook event is stored
```

---

# 26. Design Decisions

## Why PostgreSQL?

PostgreSQL was selected because the assignment recommends a relational database and the application's entities have clear relationships between users, bookings, diagnostic tests, centres and payments.

---

## Why Sequelize?

Sequelize provides:

- PostgreSQL integration
- Models
- Associations
- Transactions
- Migrations
- Validation support

It also keeps database access structured within the Node.js application.

---

## Why store the booking amount?

The booking stores the diagnostic test price at the time the booking is created.

For example:

```text
Test price when booked = ₹500
```

If the test price later changes to:

```text
₹700
```

the existing booking should still represent the original transaction amount:

```text
Booking amount = ₹500
```

This prevents historical booking amounts from changing unexpectedly.

---

## Why store both test ID and centre ID in a booking?

The booking represents a specific appointment at a specific diagnostic centre for a specific diagnostic test.

The API validates that the selected test belongs to the selected centre before creating the booking.

Keeping both references also makes the booking directly associated with the centre and test involved in the transaction.

---

## Why use transactions for payments?

Payment creation changes two related pieces of state:

```text
Payment record
Booking status
```

Both changes should succeed together.

A database transaction ensures that if one operation fails, the other operation is rolled back.

---

## Why use event IDs for webhook idempotency?

Payment providers may retry webhook requests.

For example:

```text
evt_1001
evt_1001
evt_1001
```

The application should not treat these as three different payment events.

The unique `event_id` allows the application to recognize an event that has already been processed.

---

# 27. Assumptions

The implementation makes the following assumptions:

1. The payment system is simulated and does not connect to a real payment gateway.
2. Payment success/failure is randomly simulated.
3. The webhook request represents an external payment provider.
4. Webhook `eventId` is supplied by the simulated provider.
5. Users can create diagnostic centres and tests because the assignment does not define an admin role.
6. Booking cancellation is represented in the database status enum, but a cancellation endpoint is not implemented.
7. A booking can have one payment.
8. Appointment time must be in the future.
9. A diagnostic test belongs to exactly one diagnostic centre.
10. Booking amount is captured from the test price when the booking is created.

---

# 28. Future Improvements

The current implementation focuses on the required functionality while keeping the solution relatively small and testable.

Possible future improvements include:

- Role-based access control for administrators and normal users
- Separate admin APIs for managing centres and tests
- Booking cancellation endpoint
- Appointment availability and slot management
- Pagination for centre, test and booking listings
- Redis caching
- Rate limiting
- Swagger/OpenAPI documentation
- Docker and Docker Compose
- Structured application logging
- More advanced webhook retry handling
- Background job processing
- Dedicated test database
- Payment provider signature verification
- Better concurrency handling for simultaneous webhook deliveries
- CI/CD pipeline
- Production monitoring and observability

---

# 29. Assignment Requirements Covered

The implementation covers the major requirements of the assignment:

| Requirement | Implemented |
|---|---|
| User signup | Yes |
| User login | Yes |
| JWT authentication | Yes |
| Request validation | Yes |
| Diagnostic centres | Yes |
| Diagnostic tests | Yes |
| Test pricing | Yes |
| Authenticated booking | Yes |
| Booking status | Yes |
| Simulated payment | Yes |
| Payment success/failure | Yes |
| Payment webhook | Yes |
| Webhook idempotency | Yes |
| Database transactions | Yes |
| Unauthorized booking protection | Yes |
| Invalid request handling | Yes |
| Automated tests | Yes |
| PostgreSQL database | Yes |
| Sequelize migrations | Yes |
| README/documentation | Yes |

---

# 30. Conclusion

This project implements a complete backend flow for diagnostic test booking and simulated payment processing.

The main focus was on:

- Clear relational database design
- JWT-based authentication
- Input validation
- Ownership-based authorization
- Transactional payment processing
- Idempotent webhook handling
- Real-world edge cases
- Automated API testing
- Simple and maintainable project structure

The implementation intentionally avoids unnecessary complexity while covering the core requirements of the assignment.
