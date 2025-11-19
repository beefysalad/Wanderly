# Wanderly - Group Trip Planning Platform

**The all-in-one platform for seamless group trip planning**

Wanderly is a modern web application designed to simplify group trip planning. No more juggling between different tools or losing track of important details. Everything your group needs is right here, organized and accessible to everyone.

## Features

### Core Functionality

- **Group Management**

  - Create and manage travel groups
  - Invite members via email
  - Unique 6-character group codes for easy sharing
  - Guest view mode with read-only access via group codes

- **Trip Planning**

  - Create multiple trips within groups
  - Set trip dates, locations, and status (planning, finalized, ongoing, cancelled)
  - Visual calendar and schedule views
  - Track trip progress and completion

- **Activity Scheduling**

  - Add activities with dates, times, and notes
  - Mark activities as done
  - Calendar overview and detailed schedule views
  - Export schedules as PNG images or ICS files for calendar apps

- **Expense Tracking**

  - Track expenses with categories (accommodation, food, transportation, activities, other)
  - Split expenses among group members
  - Mark payments as received
  - Payment history and logs
  - QR code upload for payment methods (via Cloudinary)
  - Support for multiple payment methods (Cash, Bank Transfer, Maya, GCash)

- **Guest Access**

  - Share group code with non-members
  - Read-only view of trips, activities, and expenses
  - Real-time updates via polling
  - Privacy-focused (blurred email addresses)

- **Export & Integration**
  - Export trip schedules as PNG images
  - Export to ICS format for calendar apps (Google Calendar, Apple Calendar, Outlook)
  - Download QR codes for payment methods

## Tech Stack

### Frontend

- **Next.js 15.5.6** - React framework with App Router
- **React 19.1.0** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling
- **TanStack Query** - Data fetching and caching
- **React Hook Form** - Form management
- **Zod** - Schema validation
- **Lucide React** - Icons

### Backend

- **Next.js API Routes** - Serverless API endpoints
- **Prisma 6.19.0** - ORM and database toolkit
- **PostgreSQL** - Database
- **Firebase Authentication** - User authentication
- **Firebase Admin SDK** - Server-side Firebase operations

### Services

- **Cloudinary** - Image upload and storage for QR codes
- **Axios** - HTTP client

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database
- Firebase project with Authentication enabled
- Cloudinary account (for QR code uploads)

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd travelscheduleapp
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:
   Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/travelscheduleapp"

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin (Server-side)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_PRIVATE_KEY=your_private_key

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Socket.IO Server
NEXT_PUBLIC_SOCKET_URL=http://localhost:8080
SOCKET_API_KEY=your-secret-api-key
```

4. Set up the database:

```bash
# Generate Prisma Client
npm run db:generate

# Run migrations
npm run db:migrate
```

5. Start the development server:

```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production (includes Prisma generation and migrations)
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate Prisma Client
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio (database GUI)

## Project Structure

```
travelscheduleapp/
├── src/
│   ├── app/
│   │   ├── api/              # API routes
│   │   │   ├── groups/       # Group management endpoints
│   │   │   ├── trips/        # Trip and activity endpoints
│   │   │   ├── upload/       # Image upload endpoints
│   │   │   └── sync/         # User sync endpoints
│   │   ├── components/
│   │   │   ├── pages/        # Page components
│   │   │   └── shared/       # Shared components (modals, header, footer)
│   │   ├── dashboard/        # Dashboard page
│   │   ├── group/            # Group pages
│   │   ├── guest/            # Guest view pages
│   │   └── profile/          # User profile page
│   ├── hooks/                # Custom React hooks
│   └── shared/
│       └── types/            # TypeScript type definitions
├── lib/                      # Utility libraries
│   ├── auth/                 # Authentication utilities
│   ├── utils/                # Helper functions
│   └── prisma.ts             # Prisma client
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── migrations/          # Database migrations
└── components/               # UI components
```

## Key Features Explained

### Group Management

- Create groups with unique 6-character codes
- Add members via email
- Leave groups
- View group members and details

### Trip Planning

- Create trips within groups
- Set start/end dates and locations
- Track trip status
- Delete trips

### Activity Scheduling

- Add activities with:
  - Title and description
  - Date and optional time range
  - Notes
  - Completion status
- View activities in calendar or schedule format
- Edit and delete activities
- Mark activities as done/undone

### Expense Tracking

- Create expenses with:
  - Amount and description
  - Category (accommodation, food, transportation, activities, other)
  - Payment method (cash, bank, maya, gcash)
  - Account details and QR codes
  - Split among selected members
- Track who paid and who owes
- Mark payments as received
- View payment history
- Filter by settled/unsettled expenses

### Guest Access

- Share group code for read-only access
- View trips, activities, and expenses
- Real-time updates (30-second polling)
- Privacy protection (blurred emails)

### Export Features

- **PNG Export**: Export trip schedule as high-quality image
- **ICS Export**: Export to calendar format for import into calendar apps

## Authentication

The app uses Firebase Authentication for user management. Users can:

- Sign up with email/password
- Sign in with existing accounts
- Automatic user sync to database on first login

## Database Schema

The application uses Prisma ORM with PostgreSQL. Key models include:

- **User** - User accounts
- **Group** - Travel groups
- **GroupMember** - Many-to-many relationship between users and groups
- **Trip** - Trips within groups
- **Activity** - Activities within trips
- **Expense** - Expenses for trips
- **ExpenseSplit** - Expense splitting relationships
- **PaymentLog** - Payment history

## API Routes

### Groups

- `GET /api/groups` - List user's groups
- `POST /api/groups` - Create a group
- `GET /api/groups/[groupId]` - Get group details
- `POST /api/groups/join` - Join a group by code
- `POST /api/groups/[groupId]/leave` - Leave a group
- `GET /api/groups/[groupId]/guest` - Get group (guest access)
- `POST /api/groups/validate-code` - Validate group code

### Trips

- `POST /api/groups/[groupId]/trips` - Create a trip
- `DELETE /api/groups/[groupId]/trips/[tripId]` - Delete a trip

### Activities

- `POST /api/trips/[tripId]/activities` - Create an activity
- `PATCH /api/trips/[tripId]/activities/[activityId]` - Update an activity
- `DELETE /api/trips/[tripId]/activities/[activityId]` - Delete an activity

### Expenses

- `GET /api/trips/[tripId]/expenses` - List expenses
- `POST /api/trips/[tripId]/expenses` - Create an expense
- `GET /api/trips/[tripId]/expenses/[expenseId]` - Get expense details
- `PATCH /api/trips/[tripId]/expenses/[expenseId]` - Update an expense
- `DELETE /api/trips/[tripId]/expenses/[expenseId]` - Delete an expense
- `POST /api/trips/[tripId]/expenses/[expenseId]/payments` - Mark payment

### Payment Logs

- `GET /api/trips/[tripId]/payment-logs` - Get payment history
- `POST /api/trips/[tripId]/payment-logs` - Create payment log

### Upload

- `POST /api/upload/image` - Upload image to Cloudinary

## Development

### Code Style

- TypeScript for type safety
- ESLint for code quality
- Consistent component structure
- Modular architecture

### State Management

- TanStack Query for server state
- React hooks for local state
- Optimistic updates for better UX

## Deployment

The application is configured for deployment on platforms like Vercel:

1. Set up environment variables in your deployment platform
2. Ensure PostgreSQL database is accessible
3. Configure Firebase project
4. Set up Cloudinary account
5. Run `npm run build` to build the application
6. Deploy using your platform's deployment process

## License

This project is private and proprietary.

## Support

For issues or questions, please contact the development team.
