# HRIS Backend API

A comprehensive Human Resource Information System backend built with Node.js, Express.js, and PostgreSQL.

## Features

- **Authentication & Authorization**: JWT-based auth with role-based access control
- **Employee Management**: Complete employee lifecycle management
- **Attendance Tracking**: Clock in/out with location and photo support
- **Leave Management**: Leave requests with approval workflow
- **Announcements**: Company-wide communication system
- **Document Management**: Employee document storage
- **Payroll System**: Salary calculation and records
- **Division Management**: Organizational structure

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT
- **Validation**: express-validator
- **Security**: Helmet, CORS, Rate limiting

## Installation

1. **Clone and setup**:
   ```bash
   cd backend
   npm install
   ```

2. **Environment Setup**:
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. **Database Setup**:
   ```bash
   # Create PostgreSQL database
   createdb hris_db
   
   # Import schema
   psql -d hris_db -f database_schema.sql
   ```

4. **Start the server**:
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Employees
- `GET /api/employees` - Get all employees
- `GET /api/employees/:id` - Get employee by ID
- `GET /api/employees/profile/me` - Get current user's employee record
- `POST /api/employees` - Create employee (admin only)
- `PUT /api/employees/:id` - Update employee

### Attendance
- `GET /api/attendance` - Get attendance records
- `GET /api/attendance/today/:employeeId` - Get today's attendance
- `POST /api/attendance/clock-in` - Clock in
- `POST /api/attendance/clock-out` - Clock out
- `GET /api/attendance/stats/:employeeId` - Get attendance statistics

### Leave Management
- `GET /api/leave` - Get leave requests
- `POST /api/leave` - Create leave request
- `PUT /api/leave/:id/status` - Approve/reject leave request
- `GET /api/leave/balance/:employeeId` - Get leave balance

### Announcements
- `GET /api/announcements` - Get announcements
- `POST /api/announcements` - Create announcement (admin/manager)
- `PUT /api/announcements/:id` - Update announcement
- `DELETE /api/announcements/:id` - Delete announcement

### Divisions
- `GET /api/divisions` - Get all divisions
- `POST /api/divisions` - Create division (admin only)

## Database Schema

The system uses PostgreSQL with the following main tables:

- **users**: Authentication data
- **profiles**: User profile information
- **employees**: Employee records
- **divisions**: Company divisions
- **attendance_records**: Daily attendance
- **leave_requests**: Leave management
- **announcements**: Communications
- **documents**: File storage
- **payroll_components**: Salary components
- **salary_records**: Payroll data

## Security Features

- JWT authentication
- Role-based access control
- Password hashing with bcrypt
- Rate limiting
- CORS protection
- Helmet security headers
- Input validation and sanitization

## Role Permissions

- **Admin**: Full system access
- **Manager**: Employee management, leave approval, announcements
- **Employee**: Own data access, leave requests, attendance

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run tests
npm test

# Database migration
npm run migrate
```

## Environment Variables

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hris_db
DB_USER=your_db_user
DB_PASSWORD=your_db_password
JWT_SECRET=your_jwt_secret
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

## API Response Format

```json
{
  "success": true,
  "data": {},
  "message": "Success message"
}
```

Error responses:
```json
{
  "error": "Error message",
  "details": []
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License