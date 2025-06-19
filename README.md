# HRIS - Human Resource Information System

A comprehensive full-stack HRIS application built with React, Node.js, Express, and PostgreSQL.

## 🚀 Features

### Frontend (React + TypeScript)
- **Modern UI**: Beautiful, responsive design with Tailwind CSS
- **Authentication**: Secure login/register with JWT
- **Dashboard**: Overview of key metrics and quick actions
- **Employee Management**: Complete employee directory and profiles
- **Attendance Tracking**: Clock in/out with real-time tracking
- **Leave Management**: Request and approval workflow
- **Announcements**: Company-wide communication system
- **Document Management**: Employee document storage
- **Real-time Updates**: Live data synchronization

### Backend (Node.js + Express)
- **RESTful API**: Complete API with proper error handling
- **Authentication**: JWT-based auth with role-based access control
- **Database**: PostgreSQL with optimized queries and indexes
- **Security**: Rate limiting, CORS, input validation
- **File Upload**: Document management system
- **Payroll**: Salary calculation and records

## 🛠️ Tech Stack

### Frontend
- React 18 with TypeScript
- Tailwind CSS for styling
- React Router for navigation
- Lucide React for icons
- Date-fns for date handling

### Backend
- Node.js with Express.js
- PostgreSQL database
- JWT authentication
- bcryptjs for password hashing
- express-validator for input validation
- Helmet for security headers

## 📦 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### 1. Clone and Install Dependencies
```bash
# Clone the repository
git clone <repository-url>
cd hris-web-app

# Install all dependencies (frontend + backend)
npm run setup
```

### 2. Database Setup
```bash
# Create PostgreSQL database
createdb hris_db

# Import the database schema
psql -d hris_db -f database_schema.sql
```

### 3. Environment Configuration
```bash
# Copy environment files
cp .env.example .env
cp backend/.env.example backend/.env

# Edit backend/.env with your database credentials:
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=hris_db
# DB_USER=your_username
# DB_PASSWORD=your_password
# JWT_SECRET=your_very_long_secret_key
```

### 4. Start the Application
```bash
# Start both frontend and backend simultaneously
npm run dev

# Or start them separately:
npm run dev:frontend  # Frontend on http://localhost:5173
npm run dev:backend   # Backend on http://localhost:3001
```

## 🔐 Default Login Credentials

After importing the database schema, you can use these test accounts:

### Admin Account
- **Email**: admin@company.com
- **Password**: admin123
- **Role**: Administrator

### Manager Account
- **Email**: sarah@company.com
- **Password**: admin123
- **Role**: HR Manager

### Employee Account
- **Email**: emily@company.com
- **Password**: admin123
- **Role**: Employee

## 📁 Project Structure

```
hris-web-app/
├── src/                    # Frontend source code
│   ├── components/         # React components
│   ├── pages/             # Page components
│   ├── contexts/          # React contexts
│   ├── hooks/             # Custom hooks
│   ├── lib/               # Utilities and API client
│   └── types/             # TypeScript types
├── backend/               # Backend source code
│   ├── routes/            # API routes
│   ├── middleware/        # Express middleware
│   ├── config/            # Configuration files
│   └── server.js          # Main server file
├── database_schema.sql    # PostgreSQL schema
└── package.json          # Project dependencies
```

## 🔧 Available Scripts

```bash
# Development
npm run dev              # Start both frontend and backend
npm run dev:frontend     # Start only frontend
npm run dev:backend      # Start only backend

# Production
npm run build           # Build frontend for production
npm start              # Start development servers

# Setup
npm run setup          # Install all dependencies
```

## 🌟 Key Features

### Role-Based Access Control
- **Admin**: Full system access, user management
- **Manager**: Employee management, leave approvals, announcements
- **Employee**: Personal data access, attendance, leave requests

### Real-time Features
- Live attendance tracking
- Real-time announcements
- Instant leave request updates

### Security Features
- JWT authentication
- Password hashing
- Rate limiting
- Input validation
- CORS protection

### Database Features
- Optimized PostgreSQL schema
- Proper indexes for performance
- Foreign key constraints
- Automatic timestamps
- Sample data included

## 🚀 Deployment

### Frontend Deployment
```bash
npm run build
# Deploy the 'dist' folder to your hosting service
```

### Backend Deployment
```bash
cd backend
npm install --production
npm start
```

### Environment Variables for Production
```env
NODE_ENV=production
DB_HOST=your_production_db_host
DB_NAME=your_production_db_name
JWT_SECRET=your_production_jwt_secret
FRONTEND_URL=https://your-frontend-domain.com
```

## 📊 Database Schema

The application uses a comprehensive PostgreSQL schema with:
- 11 main tables
- Proper relationships and constraints
- Optimized indexes
- Custom types and enums
- Triggers for automatic updates
- Sample data for testing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues:
1. Check the console for error messages
2. Verify database connection
3. Ensure all environment variables are set
4. Check that both frontend and backend are running

For additional help, please create an issue in the repository.