-- HRIS Database Schema for PostgreSQL
-- Complete database structure for Human Resource Information System

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types/enums
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'employee');
CREATE TYPE employment_status AS ENUM ('active', 'inactive', 'terminated');
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late', 'half_day');
CREATE TYPE leave_type AS ENUM ('annual', 'sick', 'emergency', 'maternity', 'paternity', 'other');
CREATE TYPE leave_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE announcement_type AS ENUM ('general', 'urgent', 'event');

-- Users table (authentication)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User profiles table
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    avatar_url TEXT,
    role user_role DEFAULT 'employee',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Divisions/Departments table
CREATE TABLE divisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    manager_id UUID, -- Will reference employees table
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Employees table
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    profile_id UUID REFERENCES users(id) ON DELETE SET NULL,
    position VARCHAR(100) NOT NULL,
    division_id UUID REFERENCES divisions(id) ON DELETE SET NULL,
    join_date DATE NOT NULL,
    employment_status employment_status DEFAULT 'active',
    salary_base DECIMAL(12,2),
    address TEXT,
    emergency_contact VARCHAR(255),
    emergency_phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint for division manager
ALTER TABLE divisions ADD CONSTRAINT fk_division_manager 
    FOREIGN KEY (manager_id) REFERENCES employees(id) ON DELETE SET NULL;

-- Attendance records table
CREATE TABLE attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    clock_in TIMESTAMP WITH TIME ZONE,
    clock_out TIMESTAMP WITH TIME ZONE,
    clock_in_location VARCHAR(255),
    clock_out_location VARCHAR(255),
    clock_in_photo TEXT,
    clock_out_photo TEXT,
    status attendance_status DEFAULT 'present',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(employee_id, date)
);

-- Leave requests table
CREATE TABLE leave_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    leave_type leave_type NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_requested INTEGER NOT NULL,
    reason TEXT NOT NULL,
    status leave_status DEFAULT 'pending',
    approver_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Announcements table
CREATE TABLE announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    announcement_type announcement_type DEFAULT 'general',
    target_roles user_role[],
    target_divisions UUID[],
    published_by UUID REFERENCES users(id) ON DELETE SET NULL,
    is_published BOOLEAN DEFAULT false,
    published_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Documents table
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    file_url TEXT NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payroll components table (for salary calculations)
CREATE TABLE payroll_components (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    component_type VARCHAR(50) NOT NULL, -- 'allowance', 'deduction', 'tax'
    is_percentage BOOLEAN DEFAULT false,
    percentage DECIMAL(5,2),
    amount DECIMAL(12,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Salary records table
CREATE TABLE salary_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    period_month INTEGER NOT NULL CHECK (period_month >= 1 AND period_month <= 12),
    period_year INTEGER NOT NULL,
    base_salary DECIMAL(12,2) NOT NULL,
    allowances JSONB,
    deductions JSONB,
    tax_amount DECIMAL(12,2),
    gross_salary DECIMAL(12,2) NOT NULL,
    net_salary DECIMAL(12,2) NOT NULL,
    processed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(employee_id, period_month, period_year)
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_employees_profile_id ON employees(profile_id);
CREATE INDEX idx_employees_division_id ON employees(division_id);
CREATE INDEX idx_employees_employee_id ON employees(employee_id);
CREATE INDEX idx_attendance_employee_date ON attendance_records(employee_id, date);
CREATE INDEX idx_attendance_date ON attendance_records(date);
CREATE INDEX idx_leave_requests_employee_id ON leave_requests(employee_id);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);
CREATE INDEX idx_announcements_published_at ON announcements(published_at);
CREATE INDEX idx_announcements_target_roles ON announcements USING GIN(target_roles);
CREATE INDEX idx_documents_employee_id ON documents(employee_id);
CREATE INDEX idx_salary_records_employee_period ON salary_records(employee_id, period_year, period_month);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_divisions_updated_at BEFORE UPDATE ON divisions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON attendance_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leave_requests_updated_at BEFORE UPDATE ON leave_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payroll_components_updated_at BEFORE UPDATE ON payroll_components FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial data

-- Insert divisions
INSERT INTO divisions (id, name, description) VALUES
    (uuid_generate_v4(), 'Human Resources', 'Manages employee relations, recruitment, and HR policies'),
    (uuid_generate_v4(), 'Technology', 'Software development and IT infrastructure'),
    (uuid_generate_v4(), 'Marketing', 'Brand management and customer acquisition'),
    (uuid_generate_v4(), 'Finance', 'Financial planning, accounting, and budgeting'),
    (uuid_generate_v4(), 'Operations', 'Daily operations and process management');

-- Insert payroll components
INSERT INTO payroll_components (id, name, component_type, is_percentage, percentage, amount, is_active) VALUES
    (uuid_generate_v4(), 'Transport Allowance', 'allowance', false, null, 200.00, true),
    (uuid_generate_v4(), 'Meal Allowance', 'allowance', false, null, 150.00, true),
    (uuid_generate_v4(), 'Health Insurance', 'deduction', true, 5.00, null, true),
    (uuid_generate_v4(), 'Income Tax', 'tax', true, 10.00, null, true),
    (uuid_generate_v4(), 'Pension Fund', 'deduction', true, 3.00, null, true),
    (uuid_generate_v4(), 'Performance Bonus', 'allowance', true, 15.00, null, true);

-- Insert sample announcement
INSERT INTO announcements (id, title, content, announcement_type, target_roles, is_published, published_at) VALUES
    (uuid_generate_v4(), 
     'Welcome to HRIS System', 
     'Welcome to our new Human Resource Information System. This platform will help streamline HR processes and improve communication across the organization.',
     'general',
     ARRAY['admin', 'manager', 'employee']::user_role[],
     true,
     NOW());

-- Create views for common queries

-- Employee details view
CREATE VIEW employee_details AS
SELECT 
    e.id,
    e.employee_id,
    e.position,
    e.join_date,
    e.employment_status,
    e.salary_base,
    p.full_name,
    p.email,
    p.phone,
    p.avatar_url,
    p.role,
    d.name as division_name,
    d.id as division_id
FROM employees e
LEFT JOIN profiles p ON e.profile_id = p.user_id
LEFT JOIN divisions d ON e.division_id = d.id;

-- Monthly attendance summary view
CREATE VIEW monthly_attendance_summary AS
SELECT 
    e.id as employee_id,
    e.employee_id,
    p.full_name,
    EXTRACT(YEAR FROM ar.date) as year,
    EXTRACT(MONTH FROM ar.date) as month,
    COUNT(*) as total_days,
    COUNT(CASE WHEN ar.status = 'present' THEN 1 END) as present_days,
    COUNT(CASE WHEN ar.status = 'late' THEN 1 END) as late_days,
    COUNT(CASE WHEN ar.status = 'absent' THEN 1 END) as absent_days,
    AVG(
        CASE 
            WHEN ar.clock_in IS NOT NULL AND ar.clock_out IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (ar.clock_out - ar.clock_in)) / 3600
        END
    ) as avg_hours_per_day
FROM employees e
LEFT JOIN profiles p ON e.profile_id = p.user_id
LEFT JOIN attendance_records ar ON e.id = ar.employee_id
GROUP BY e.id, e.employee_id, p.full_name, EXTRACT(YEAR FROM ar.date), EXTRACT(MONTH FROM ar.date);

-- Comments for documentation
COMMENT ON TABLE users IS 'User authentication and basic account information';
COMMENT ON TABLE profiles IS 'Extended user profile information';
COMMENT ON TABLE divisions IS 'Company divisions/departments';
COMMENT ON TABLE employees IS 'Employee records with employment details';
COMMENT ON TABLE attendance_records IS 'Daily attendance tracking with clock in/out times';
COMMENT ON TABLE leave_requests IS 'Employee leave requests and approval workflow';
COMMENT ON TABLE announcements IS 'Company-wide announcements and communications';
COMMENT ON TABLE documents IS 'Employee document storage and management';
COMMENT ON TABLE payroll_components IS 'Salary calculation components (allowances, deductions, taxes)';
COMMENT ON TABLE salary_records IS 'Monthly payroll records for employees';

-- Grant permissions (adjust as needed for your environment)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO hris_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO hris_user;