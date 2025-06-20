# HRIS Self-Hosted Application

A comprehensive Human Resource Information System built with **Express.js**, **PostgreSQL**, and **React** - completely self-hosted without any cloud dependencies.

## 🏗️ Architecture

- **Backend**: Node.js + Express.js + PostgreSQL
- **Frontend**: React + TypeScript + Tailwind CSS
- **Authentication**: Session-based with express-session
- **Database**: PostgreSQL with native pg client
- **No Cloud Dependencies**: 100% self-hosted solution

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### 1. Database Setup
```bash
# Create PostgreSQL database
createdb hris_db

# Import schema and sample data
psql -d hris_db -f database_schema.sql
```

### 2. Backend Setup
```bash
cd backend
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database credentials
```

### 3. Frontend Setup
```bash
# Install frontend dependencies
npm install
```

### 4. Run the Application
```bash
# Option 1: Run both frontend and backend together
npm start

# Option 2: Run separately
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
npm run dev
```

## 🔐 Default Login Credentials

After importing the database schema:

- **Admin**: admin@company.com / admin123
- **Manager**: sarah@company.com / admin123
- **Employee**: emily@company.com / admin123

## 📁 Project Structure

```
├── backend/                 # Express.js API server
│   ├── config/             # Database configuration
│   ├── middleware/         # Auth & error handling
│   ├── routes/            # API endpoints
│   └── server.js          # Main server file
├── src/                   # React frontend
│   ├── components/        # UI components
│   ├── contexts/         # React contexts
│   ├── services/         # API service classes
│   └── lib/              # Utilities
├── database_schema.sql    # PostgreSQL schema
└── package.json          # Frontend dependencies
```

## 🛠️ Environment Configuration

### Backend (.env)
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hris_db
DB_USER=your_username
DB_PASSWORD=your_password
SESSION_SECRET=your_session_secret
PORT=3001
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3001/api
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### Employees
- `GET /api/employees` - List employees
- `GET /api/employees/:id` - Get employee details
- `POST /api/employees` - Create employee (admin)
- `PUT /api/employees/:id` - Update employee

### Attendance
- `GET /api/attendance` - Get attendance records
- `POST /api/attendance/clock-in` - Clock in
- `POST /api/attendance/clock-out` - Clock out
- `GET /api/attendance/stats/:id` - Attendance statistics

### Leave Management
- `GET /api/leave` - Get leave requests
- `POST /api/leave` - Create leave request
- `PUT /api/leave/:id/status` - Approve/reject leave

### Announcements
- `GET /api/announcements` - Get announcements
- `POST /api/announcements` - Create announcement
- `PUT /api/announcements/:id` - Update announcement

## 🎯 Features

✅ **Session-based Authentication** - No JWT, pure session cookies
✅ **Role-based Access Control** - Admin, Manager, Employee roles
✅ **Employee Management** - Complete CRUD operations
✅ **Attendance Tracking** - Clock in/out with location
✅ **Leave Management** - Request and approval workflow
✅ **Announcements** - Company-wide communication
✅ **Dashboard** - Real-time metrics and insights
✅ **Responsive Design** - Works on all devices
✅ **Self-hosted** - No cloud dependencies

## 🔒 Security Features

- Session-based authentication with secure cookies
- Password hashing with bcrypt
- Rate limiting on API endpoints
- CORS protection
- Helmet security headers
- Input validation and sanitization
- SQL injection protection

## 🗄️ Database Schema

The application uses a comprehensive PostgreSQL schema with:
- **profiles** - User authentication and profile data
- **employees** - Employee records and details
- **divisions** - Company organizational structure
- **attendance_records** - Daily attendance tracking
- **leave_requests** - Leave management system
- **announcements** - Communication system
- **documents** - File management
- **payroll_components** - Salary calculation components
- **salary_records** - Payroll data

## 🚀 Deployment

### Production Setup
1. Set up PostgreSQL server
2. Configure environment variables for production
3. Build frontend: `npm run build`
4. Deploy backend to your server
5. Serve frontend static files

### Docker Deployment (Optional)
```bash
# Build and run with Docker Compose
docker-compose up -d
```

## 🛠️ Development

### Adding New Features
1. Create API endpoints in `backend/routes/`
2. Add service methods in `src/services/`
3. Create React components in `src/components/`
4. Update database schema if needed

### Database Migrations
```bash
# Connect to database
psql -d hris_db

# Run your migration SQL
\i your_migration.sql
```

## 📊 Monitoring

- Health check endpoint: `GET /health`
- Database connection monitoring
- Session store in PostgreSQL
- Request logging with Morgan

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - feel free to use this project for your organization.

---

**🎯 This is a complete, production-ready HRIS system that runs entirely on your own infrastructure!**