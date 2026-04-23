# Parking App — Project Overview

## Project Description

A full-stack parking reservation web app with interactive map UI, built as a React frontend + Spring Boot backend monorepo. Users can register, manage vehicles, browse parking areas on a map, buy tickets, make reservations, and send support messages.

---

## Frontend

### Tech Stack

| Category | Technology |
|---|---|
| Framework | React 18.3.1 + TypeScript |
| Build Tool | Vite 6.3.5 |
| Routing | React Router 7.13.0 |
| Styling | TailwindCSS 4.1.12 |
| UI Components | Shadcn/UI (Radix UI primitives) |
| Icons | Lucide React 0.487.0 |
| Maps | Mapbox GL 3.1.2 + react-map-gl 7.1.7 |
| HTTP Client | Axios |
| Forms | React Hook Form 7.55.0 |
| Notifications | Sonner 2.0.3 |

### Folder Structure

```
frontend/src/
├── app/
│   ├── components/
│   │   ├── figma/              # ImageWithFallback
│   │   ├── ui/                 # Shadcn/Radix UI components (30+)
│   │   └── ProtectedRoute.tsx  # Auth guard — redirects to /login
│   ├── contexts/
│   │   └── AuthContext.tsx      # Auth state (user, token, login, logout)
│   ├── lib/
│   │   ├── api.ts              # Axios instance with JWT interceptors
│   │   ├── authService.ts      # register, login, getMe
│   │   ├── vehicleService.ts   # CRUD vehicles
│   │   ├── parkingService.ts   # parking areas, slots, nearby
│   │   ├── ticketService.ts    # buy, extend, end tickets + payments
│   │   ├── reservationService.ts # CRUD reservations + convert to ticket
│   │   └── messageService.ts   # send, list, thread messages
│   ├── pages/
│   │   ├── Login.tsx           # Login page
│   │   ├── Register.tsx        # Registration page
│   │   ├── MapView.tsx         # Map + parking area discovery
│   │   ├── Profile.tsx         # Vehicle management (CRUD)
│   │   ├── Tickets.tsx         # Active sessions + payment history
│   │   ├── Payment.tsx         # Checkout flow (real API)
│   │   ├── Reservations.tsx    # Future bookings + convert to ticket
│   │   ├── Messages.tsx        # Threaded support messages
│   │   ├── Root.tsx            # Layout wrapper + navigation + logout
│   │   └── NotFound.tsx        # 404 page
│   ├── data/
│   │   └── mockData.ts         # Legacy mock data (no longer imported by pages)
│   ├── types/
│   │   └── index.ts            # Re-exports types from lib/ services
│   ├── routes.tsx
│   └── App.tsx
├── styles/
│   ├── index.css
│   ├── fonts.css
│   ├── tailwind.css
│   └── theme.css
└── main.tsx
```

### Pages & Routes

| Route | Page | Auth | Description |
|---|---|---|---|
| `/login` | Login | No | Email + password sign in |
| `/register` | Register | No | Create account, auto-login |
| `/` | MapView | Yes | Interactive Mapbox map, real parking area data, buy ticket |
| `/profile` | Profile | Yes | Vehicle CRUD (add, edit, delete) |
| `/tickets` | Tickets | Yes | Active sessions with countdowns, extend/end, payment history |
| `/payment/:lotId` | Payment | Yes | Duration, vehicle, payment method → real ticket purchase |
| `/reservations` | Reservations | Yes | Create future bookings, cancel, convert to active ticket |
| `/messages` | Messages | Yes | Threaded support messages, new message, reply |
| `/*` | NotFound | Yes | 404 fallback |

### Architecture

- **Auth:** `AuthContext` (React Context) stores `{ user, token, login, logout }`. Token in localStorage. JWT expiry checked client-side before network requests.
- **API Layer:** Axios instance (`lib/api.ts`) auto-attaches Bearer token, redirects to `/login` on 401.
- **Protected Routes:** `ProtectedRoute` component wraps all authenticated routes, shows spinner during auth loading.
- **State:** Local `useState` per page + `AuthContext` for user. No Redux/Zustand needed.

### Path Alias

`@` resolves to `/src` (configured in `vite.config.ts`)

---

## Backend

### Tech Stack

| Category | Technology |
|---|---|
| Language | Java 25 |
| Framework | Spring Boot 4.0.4 |
| Build Tool | Gradle 9.4.0 |
| Database | H2 in-memory (dev) |
| ORM | Spring Data JPA + Hibernate |
| Security | Spring Security + JWT (JJWT 0.12.5) |
| Spatial | Hibernate Spatial + JTS (GeoTools) |
| Scheduling | Spring `@Scheduled` (ticket auto-expiry) |
| Boilerplate | Lombok |
| Validation | Spring Boot Validation |

### Folder Structure

```
backend/src/main/java/com/parkingapp/
├── ParkingAppApplication.java       # Entry point (@EnableScheduling)
├── controllers/
│   ├── UserController.java
│   ├── VehicleController.java
│   ├── ParkingAreaController.java
│   ├── TicketController.java
│   ├── ReservationController.java
│   └── MessageController.java
├── domain/
│   ├── User.java
│   ├── Vehicle.java
│   ├── ParkingArea.java
│   ├── ParkingSlot.java
│   ├── Ticket.java
│   ├── Payment.java
│   ├── Reservation.java
│   ├── Message.java
│   └── enums/
│       ├── VehicleCategory.java       # A, B, C1
│       ├── ParkingSlotStatus.java     # AVAILABLE, OCCUPIED, RESERVED, MAINTENANCE
│       ├── SizeCategory.java          # COMPACT, STANDARD, LARGE
│       ├── TicketStatus.java          # ACTIVE, COMPLETED, CANCELLED
│       ├── PaymentMethod.java         # CARD, WALLET
│       ├── PaymentStatus.java         # COMPLETED, REFUNDED
│       └── ReservationStatus.java     # PENDING, CONFIRMED, CANCELLED, CONVERTED
├── repository/
│   ├── UserRepository.java
│   ├── VehicleRepository.java
│   ├── ParkingAreaRepository.java
│   ├── ParkingSlotRepository.java
│   ├── TicketRepository.java
│   ├── PaymentRepository.java
│   ├── ReservationRepository.java
│   └── MessageRepository.java
├── service/
│   ├── UserService.java
│   ├── VehicleService.java
│   ├── ParkingAreaService.java
│   ├── TicketService.java
│   ├── ReservationService.java
│   ├── MessageService.java
│   ├── CustomUserDetailsService.java
│   └── TicketExpiryScheduler.java     # @Scheduled every 60s
├── security/
│   ├── SecurityConfig.java            # CORS + JWT filter + auth rules
│   ├── JwtTokenProvider.java
│   └── JwtAuthenticationFilter.java
└── exceptions/
    └── GlobalExceptionHandler.java
```

### Entities

#### User — table `users`
| Field | Type | Constraints |
|---|---|---|
| `id` | UUID | PK, auto-generated |
| `email` | String | Unique, Not Null |
| `passwordHash` | String | Not Null (BCrypt) |
| `createdAt` | LocalDateTime | Not Null, auto-set |
| `vehicles` | List\<Vehicle\> | OneToMany, cascade ALL, orphanRemoval |

#### Vehicle — table `vehicles`
| Field | Type | Constraints |
|---|---|---|
| `id` | UUID | PK |
| `licensePlate` | String | Unique, Not Null |
| `vehicleCategory` | VehicleCategory | Not Null (A, B, C1) |
| `electric` | boolean | Not Null |
| `user` | User | FK, ManyToOne (LAZY) |

#### ParkingArea — table `parking_areas`
| Field | Type | Constraints |
|---|---|---|
| `id` | UUID | PK |
| `name` | String | Not Null |
| `address` | String | Not Null |
| `capacity` | Integer | Not Null |
| `location` | Point (JTS) | Not Null, spatial index, WGS-84 SRID 4326 |
| `hourlyRate` | Double | Not Null |
| `parkingSlots` | List\<ParkingSlot\> | OneToMany, cascade ALL, orphanRemoval |

#### ParkingSlot — table `parking_slots`
| Field | Type | Constraints |
|---|---|---|
| `id` | UUID | PK |
| `slotIdentifier` | String | Unique, Not Null |
| `status` | ParkingSlotStatus | Not Null, indexed |
| `sizeCategory` | SizeCategory | Not Null |
| `hasEvCharging` | boolean | Not Null |
| `parkingArea` | ParkingArea | FK, ManyToOne (LAZY), indexed |

#### Ticket — table `tickets`
| Field | Type | Constraints |
|---|---|---|
| `id` | UUID | PK |
| `user` | User | FK, ManyToOne (LAZY) |
| `vehicle` | Vehicle | FK, ManyToOne (LAZY) |
| `parkingSlot` | ParkingSlot | FK, ManyToOne (LAZY) |
| `parkingArea` | ParkingArea | FK, ManyToOne (LAZY) |
| `startTime` | LocalDateTime | Not Null |
| `endTime` | LocalDateTime | Not Null |
| `durationMinutes` | Integer | Not Null |
| `status` | TicketStatus | Not Null |
| `totalCost` | BigDecimal | Not Null |
| `createdAt` | LocalDateTime | Not Null, auto-set |

#### Payment — table `payments`
| Field | Type | Constraints |
|---|---|---|
| `id` | UUID | PK |
| `ticket` | Ticket | FK, ManyToOne (LAZY) |
| `user` | User | FK, ManyToOne (LAZY) |
| `amount` | BigDecimal | Not Null |
| `paymentMethod` | PaymentMethod | Not Null |
| `status` | PaymentStatus | Not Null |
| `transactionId` | String | Unique, Not Null |
| `createdAt` | LocalDateTime | Not Null, auto-set |

#### Reservation — table `reservations`
| Field | Type | Constraints |
|---|---|---|
| `id` | UUID | PK |
| `user` | User | FK, ManyToOne (LAZY) |
| `vehicle` | Vehicle | FK, ManyToOne (LAZY) |
| `parkingArea` | ParkingArea | FK, ManyToOne (LAZY) |
| `scheduledStart` | LocalDateTime | Not Null |
| `scheduledEnd` | LocalDateTime | Not Null |
| `status` | ReservationStatus | Not Null |
| `createdAt` | LocalDateTime | Not Null, auto-set |

#### Message — table `messages`
| Field | Type | Constraints |
|---|---|---|
| `id` | UUID | PK |
| `sender` | User | FK, ManyToOne (LAZY) |
| `senderName` | String | Not Null |
| `subject` | String | Not Null |
| `body` | String (TEXT) | Not Null |
| `threadId` | String | Not Null (groups conversation) |
| `read` | boolean | Not Null |
| `fromSupport` | boolean | Not Null |
| `createdAt` | LocalDateTime | Not Null, auto-set |

### API Endpoints

Base URL: `http://localhost:4000/api/v1`

#### Users
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/users/register` | No | Register new user |
| POST | `/users/login` | No | Login → returns JWT |
| GET | `/users/me` | Yes | Get current user info |

#### Vehicles
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/vehicles/user/{userId}` | Yes | Add vehicle |
| GET | `/vehicles/user/{userId}` | Yes | Get user's vehicles |
| GET | `/vehicles/{id}` | Yes | Get single vehicle |
| PUT | `/vehicles/{id}?userId={userId}` | Yes | Update vehicle (ownership check) |
| DELETE | `/vehicles/{id}?userId={userId}` | Yes | Delete vehicle (ownership check) |

#### Parking Areas
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/parking-areas` | Yes | Create parking area |
| GET | `/parking-areas` | Yes | Get all parking areas |
| GET | `/parking-areas/{id}` | Yes | Get area by ID |
| GET | `/parking-areas/nearby?lat=&lon=&radius=` | Yes | Find nearby (radius in meters) |
| GET | `/parking-areas/{id}/available-slots?size=` | Yes | Available slots (optional SizeCategory) |
| GET | `/parking-areas/{id}/slots` | Yes | All slots in area |

#### Tickets & Payments
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/tickets` | Yes | Buy ticket (finds slot, creates payment) |
| GET | `/tickets/user/{userId}` | Yes | All user tickets |
| GET | `/tickets/user/{userId}/active` | Yes | Active tickets only |
| PUT | `/tickets/{id}/end` | Yes | End session early, free slot |
| PUT | `/tickets/{id}/extend` | Yes | Extend session + create extension payment |
| GET | `/tickets/payments/user/{userId}` | Yes | Payment history |

#### Reservations
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/reservations` | Yes | Create reservation |
| GET | `/reservations/user/{userId}` | Yes | User's reservations |
| DELETE | `/reservations/{id}` | Yes | Cancel reservation |
| POST | `/reservations/{id}/convert` | Yes | Convert to active ticket |

#### Messages
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/messages` | Yes | Send message (new thread or reply) |
| GET | `/messages/user/{userId}` | Yes | User's messages |
| GET | `/messages/thread/{threadId}` | Yes | Thread messages |
| PUT | `/messages/{id}/read` | Yes | Mark as read |

### Security & Authentication

1. **Register** — POST `/users/register` → BCrypt password → store user
2. **Login** — POST `/users/login` → authenticate → JWT token (HS256, 24h)
3. **Requests** — `Authorization: Bearer {jwt}` header
4. **CORS** — configured for `http://localhost:5173` in SecurityConfig
5. **Auto-expiry** — `TicketExpiryScheduler` runs every 60s, completes expired tickets, frees slots

**Public endpoints:** `/users/register`, `/users/login`, `/h2-console/**`, `/error`

### Exception Handling

| Exception | HTTP Status | Response |
|---|---|---|
| `BadCredentialsException` | 401 | Invalid email or password |
| `IllegalStateException` | 409 | Conflict (no slots, ownership, state) |
| `IllegalArgumentException` | 400 | Bad Request |
| `Exception` (catch-all) | 500 | Internal Server Error |

### Database & Seed Data

- H2 in-memory: `jdbc:h2:mem:testdb` (port 4000)
- `data.sql` seeds 5 parking areas in Cluj-Napoca with 44 parking slots total
- Schema auto-created by Hibernate `ddl-auto: update`

---

## Environment Variables

| Variable | Used In | Purpose |
|---|---|---|
| `VITE_MAPBOX_ACCESS_TOKEN` | Frontend MapView | Mapbox map rendering & search |

---

## Development Commands

```bash
# Frontend (port 5173)
cd frontend
npm run dev
npm run build

# Backend (port 4000)
cd backend
./gradlew bootRun

# H2 Console (dev only)
# http://localhost:4000/h2-console
# JDBC URL: jdbc:h2:mem:testdb  |  User: admin_viewer  |  Password: password
```

## API Test Files

- `backend/api-tests/tests.http` — IntelliJ HTTP Client test suite
- `backend/api-tests/http-client.env.json` — env config, baseUrl: `http://localhost:4000/api/v1`
