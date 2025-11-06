# Flatmate Expense Tracker - Frontend

A modern, responsive web application for tracking and managing expenses among flatmates, built with Next.js, React, and TypeScript.

## Features

- **Expense Management**: Create, view, edit, and delete expenses with receipt uploads
- **Expense Splitting**: Automatically split expenses between flatmates
- **Balance Tracking**: View monthly balances and settlement suggestions
- **Meal Ratings**: Rate and review meals with comments
- **Dinner Menus**: Create and manage weekly dinner menus
- **Food Photos**: Share and view food photos
- **User Availability**: Track user availability for meals
- **Invitations**: Send and manage invitations to join the flatmate group
- **Activity Logs**: View comprehensive activity logs and audit trails
- **Authentication**: Secure login, registration, and password reset
- **Responsive Design**: Mobile-first design with Tailwind CSS

## Tech Stack

- **Framework**: Next.js 15.1.2 (App Router)
- **Language**: TypeScript
- **UI Library**: React 19
- **Styling**: Tailwind CSS
- **Charts**: Chart.js, Recharts, React Chart.js 2
- **File Upload**: React Dropzone
- **Notifications**: React Hot Toast
- **HTTP Client**: Axios
- **Date Handling**: Moment Timezone
- **Image Processing**: HTML to Image

## Project Structure

```
frontend/
├── app/                      # Next.js App Router pages
│   ├── auth/                 # Authentication pages
│   │   ├── login/           # Login page
│   │   ├── forgot-password/ # Password reset request
│   │   └── reset-password/  # Password reset with token
│   ├── expenses/            # Expense management pages
│   │   ├── add/            # Add new expense
│   │   └── [id]/           # Expense detail page
│   ├── meal-ratings/        # Meal rating pages
│   │   └── add/            # Add meal rating
│   ├── menus/              # Dinner menu pages
│   ├── food-photos/        # Food photo gallery
│   ├── invitations/        # Invitation management
│   ├── user-availability/  # User availability tracking
│   ├── activity-logs/      # Activity log viewer
│   ├── privacy-policy/      # Privacy policy page
│   ├── terms-of-service/   # Terms of service page
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home/landing page
│   └── globals.css         # Global styles
├── components/              # Reusable React components
│   ├── Header.tsx          # Application header
│   ├── Footer.tsx          # Application footer
│   ├── NavigationMenu.tsx  # Navigation menu component
│   ├── LayoutWrapper.tsx   # Layout wrapper component
│   ├── LoadingModal.tsx    # Loading modal component
│   ├── ConfirmDialog.tsx  # Confirmation dialog
│   ├── DeleteConfirmModal.tsx # Delete confirmation modal
│   └── CustomNodes.tsx    # Custom React Flow nodes
├── lib/                     # Utility libraries
│   ├── api.ts              # API client configuration
│   └── ipv4Detection.ts   # IP detection utility
├── public/                  # Static assets
│   └── img/                # Images and logos
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── tailwind.config.ts      # Tailwind CSS configuration
├── next.config.mjs         # Next.js configuration
└── postcss.config.mjs     # PostCSS configuration
```

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn package manager

## Installation

1. Clone the repository and navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` file in the frontend root directory:
```bash
cp .env.example .env.local
```

4. Configure environment variables in `.env.local`:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8004/api/v1

# Application Configuration
NEXT_PUBLIC_APP_NAME=Flatmate Expense Tracker
NEXT_PUBLIC_APP_URL=http://localhost:3004
```

## Running the Application

### Development Mode
```bash
npm run dev
```

The application will be available at `http://localhost:3004`

### Production Build
```bash
npm run build
npm start
```

### Linting
```bash
npm run lint
```

## Key Pages

### Home Page (`/`)
- Landing page with feature overview
- Call-to-action to get started
- Feature highlights

### Expenses (`/expenses`)
- View all expenses with filters
- Monthly balance overview
- Settlement suggestions
- Personal balance tracking
- Add, edit, and delete expenses

### Add Expense (`/expenses/add`)
- Create new expense
- Upload receipt images
- Split expense between flatmates
- Set expense category and date

### Meal Ratings (`/meal-ratings`)
- View meal ratings
- Add new meal ratings
- Filter by date and user

### Dinner Menus (`/menus`)
- Weekly menu view
- Create and manage menus
- View menu items and details

### Food Photos (`/food-photos`)
- Photo gallery
- Upload food photos
- View photos with descriptions

### User Availability (`/user-availability`)
- Track user availability
- View availability calendar
- Manage availability status

### Invitations (`/invitations`)
- Send invitations
- View invitation status
- Accept/reject invitations

### Activity Logs (`/activity-logs`)
- View comprehensive activity logs
- Filter by user, action, and date
- Export activity logs

## API Integration

The frontend communicates with the backend API through the `lib/api.ts` file. All API calls are centralized and include:

- Authentication endpoints
- Expense management endpoints
- Balance calculation endpoints
- Meal rating endpoints
- Menu management endpoints
- Food photo endpoints
- Invitation endpoints
- Activity log endpoints

## Authentication Flow

1. User logs in via `/auth/login`
2. JWT token is stored in localStorage
3. Token is included in API requests via Authorization header
4. Protected routes check for valid token
5. Token expiration handled with automatic logout

## State Management

- **Local State**: React hooks (useState, useEffect)
- **Local Storage**: User data and authentication tokens
- **API State**: Managed through component state and API responses

## Styling

- **Tailwind CSS**: Utility-first CSS framework
- **Responsive Design**: Mobile-first approach
- **Custom Components**: Reusable styled components
- **Gradient Themes**: Purple and blue gradient color scheme

## File Upload

- Receipt uploads use React Dropzone
- Files are uploaded to AWS S3 via backend API
- CloudFront CDN for optimized image delivery
- Support for multiple image formats

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| NEXT_PUBLIC_API_URL | Backend API base URL | Required |
| NEXT_PUBLIC_APP_NAME | Application name | Flatmate Expense Tracker |
| NEXT_PUBLIC_APP_URL | Frontend application URL | http://localhost:3004 |

## Scripts

- `npm run dev` - Start development server on port 3004
- `npm run build` - Build production bundle
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run heroku-postbuild` - Build for Heroku deployment

## Common Issues

### Port Already in Use
If port 3004 is in use, either:
1. Kill the process: `lsof -ti:3004 | xargs kill -9`
2. Change the port in `package.json` dev script

### API Connection Errors
If API calls fail:
1. Verify `NEXT_PUBLIC_API_URL` in `.env.local`
2. Check backend server is running
3. Verify CORS configuration on backend

### Build Errors
If build fails:
1. Clear `.next` directory: `rm -rf .next`
2. Clear node_modules: `rm -rf node_modules && npm install`
3. Check TypeScript errors: `npm run lint`

### Module Not Found Errors
If modules are not found:
1. Run `npm install` to ensure all dependencies are installed
2. Clear node_modules and reinstall
3. Check `package.json` for correct dependencies

## Contributing

1. Follow the existing folder structure pattern
2. Use TypeScript for all new files
3. Follow React best practices and hooks patterns
4. Use Tailwind CSS for styling
5. Add proper error handling
6. Include loading states for async operations
7. Update README for new features
8. Ensure responsive design for mobile devices

## Deployment

### Build for Production
```bash
npm run build
```

### Environment Variables
Ensure all `NEXT_PUBLIC_*` environment variables are set in your deployment platform.

### Static Export (Optional)
If needed, configure static export in `next.config.mjs` for static hosting.

## License

Private project - All rights reserved
