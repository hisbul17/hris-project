-- HRIS Database Schema for PostgreSQL
-- Complete schema with all tables, relationships, and sample data

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
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
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Profiles table (user information)
CREATE TABLE profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    avatar_url TEXT,
    role user_role DEFAULT 'employee',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Divisions table
CREATE TABLE divisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    manager_id UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Employees table
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    profile_id UUID REFERENCES users(id) ON DELETE SET NULL,
    position VARCHAR(255) NOT NULL,
    division_id UUID REFERENCES divisions(id) ON DELETE SET NULL,
    join_date DATE NOT NULL,
    employment_status employment_status DEFAULT 'active',
    salary_base DECIMAL(15,2),
    address TEXT,
    emergency_contact VARCHAR(255),
    emergency_phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Add foreign key for division manager
ALTER TABLE divisions ADD CONSTRAINT fk_division_manager 
    FOREIGN KEY (manager_id) REFERENCES employees(id) ON DELETE SET NULL;

-- Attendance records table
CREATE TABLE attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    clock_in TIMESTAMP,
    clock_out TIMESTAMP,
    clock_in_location VARCHAR(255),
    clock_out_location VARCHAR(255),
    clock_in_photo TEXT,
    clock_out_photo TEXT,
    status attendance_status DEFAULT 'present',
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
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
    approved_at TIMESTAMP,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
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
    published_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Documents table
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    document_type VARCHAR(100) NOT NULL,
    file_url TEXT NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Payroll components table
CREATE TABLE payroll_components (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    component_type VARCHAR(50) NOT NULL, -- 'allowance', 'deduction', 'tax'
    is_percentage BOOLEAN DEFAULT false,
    percentage DECIMAL(5,2),
    amount DECIMAL(15,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Salary records table
CREATE TABLE salary_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    period_month INTEGER NOT NULL,
    period_year INTEGER NOT NULL,
    base_salary DECIMAL(15,2) NOT NULL,
    allowances JSONB,
    deductions JSONB,
    tax_amount DECIMAL(15,2),
    gross_salary DECIMAL(15,2) NOT NULL,
    net_salary DECIMAL(15,2) NOT NULL,
    processed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(employee_id, period_month, period_year)
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_employees_employee_id ON employees(employee_id);
CREATE INDEX idx_employees_profile_id ON employees(profile_id);
CREATE INDEX idx_attendance_employee_date ON attendance_records(employee_id, date);
CREATE INDEX idx_leave_requests_employee ON leave_requests(employee_id);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);
CREATE INDEX idx_announcements_published ON announcements(is_published, published_at);
CREATE INDEX idx_documents_employee ON documents(employee_id);
CREATE INDEX idx_salary_records_employee_period ON salary_records(employee_id, period_year, period_month);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_divisions_updated_at BEFORE UPDATE ON divisions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON attendance_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leave_requests_updated_at BEFORE UPDATE ON leave_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data

-- Sample divisions
INSERT INTO divisions (id, name, description) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'Human Resources', 'Manages employee relations and policies'),
    ('550e8400-e29b-41d4-a716-446655440002', 'Technology', 'Software development and IT infrastructure'),
    ('550e8400-e29b-41d4-a716-446655440003', 'Marketing', 'Brand management and customer acquisition'),
    ('550e8400-e29b-41d4-a716-446655440004', 'Finance', 'Financial planning and accounting'),
    ('550e8400-e29b-41d4-a716-446655440005', 'Operations', 'Business operations and logistics');

-- Sample users and profiles
INSERT INTO users (id, email, password_hash, is_active) VALUES
    ('550e8400-e29b-41d4-a716-446655440010', 'admin@company.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', true), -- password: admin123
    ('550e8400-e29b-41d4-a716-446655440011', 'sarah@company.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', true), -- password: admin123
    ('550e8400-e29b-41d4-a716-446655440012', 'michael@company.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', true),
    ('550e8400-e29b-41d4-a716-446655440013', 'emily@company.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', true),
    ('550e8400-e29b-41d4-a716-446655440014', 'david@company.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', true);

INSERT INTO profiles (user_id, full_name, phone, role, avatar_url) VALUES
    ('550e8400-e29b-41d4-a716-446655440010', 'System Administrator', '+1-555-0100', 'admin', 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?w=100&h=100&fit=crop&crop=face'),
    ('550e8400-e29b-41d4-a716-446655440011', 'Sarah Johnson', '+1-555-0101', 'manager', 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?w=100&h=100&fit=crop&crop=face'),
    ('550e8400-e29b-41d4-a716-446655440012', 'Michael Chen', '+1-555-0102', 'manager', 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?w=100&h=100&fit=crop&crop=face'),
    ('550e8400-e29b-41d4-a716-446655440013', 'Emily Rodriguez', '+1-555-0103', 'employee', 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?w=100&h=100&fit=crop&crop=face'),
    ('550e8400-e29b-41d4-a716-446655440014', 'David Kim', '+1-555-0104', 'employee', 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?w=100&h=100&fit=crop&crop=face');

-- Sample employees
INSERT INTO employees (id, employee_id, profile_id, position, division_id, join_date, salary_base) VALUES
    ('550e8400-e29b-41d4-a716-446655440020', 'EMP001', '550e8400-e29b-41d4-a716-446655440011', 'HR Manager', '550e8400-e29b-41d4-a716-446655440001', '2022-01-15', 75000.00),
    ('550e8400-e29b-41d4-a716-446655440021', 'EMP002', '550e8400-e29b-41d4-a716-446655440012', 'Engineering Manager', '550e8400-e29b-41d4-a716-446655440002', '2021-03-10', 95000.00),
    ('550e8400-e29b-41d4-a716-446655440022', 'EMP003', '550e8400-e29b-41d4-a716-446655440013', 'Software Developer', '550e8400-e29b-41d4-a716-446655440002', '2022-06-01', 65000.00),
    ('550e8400-e29b-41d4-a716-446655440023', 'EMP004', '550e8400-e29b-41d4-a716-446655440014', 'Product Designer', '550e8400-e29b-41d4-a716-446655440002', '2022-08-15', 60000.00);

-- Update division managers
UPDATE divisions SET manager_id = '550e8400-e29b-41d4-a716-446655440020' WHERE id = '550e8400-e29b-41d4-a716-446655440001';
UPDATE divisions SET manager_id = '550e8400-e29b-41d4-a716-446655440021' WHERE id = '550e8400-e29b-41d4-a716-446655440002';

-- Sample attendance records
INSERT INTO attendance_records (employee_id, date, clock_in, clock_out, status, clock_in_location) VALUES
    ('550e8400-e29b-41d4-a716-446655440022', CURRENT_DATE - INTERVAL '1 day', CURRENT_DATE - INTERVAL '1 day' + TIME '08:30:00', CURRENT_DATE - INTERVAL '1 day' + TIME '17:15:00', 'present', 'Office Main Building'),
    ('550e8400-e29b-41d4-a716-446655440022', CURRENT_DATE - INTERVAL '2 days', CURRENT_DATE - INTERVAL '2 days' + TIME '09:15:00', CURRENT_DATE - INTERVAL '2 days' + TIME '17:30:00', 'late', 'Office Main Building'),
    ('550e8400-e29b-41d4-a716-446655440023', CURRENT_DATE - INTERVAL '1 day', CURRENT_DATE - INTERVAL '1 day' + TIME '08:00:00', CURRENT_DATE - INTERVAL '1 day' + TIME '16:00:00', 'present', 'Office Main Building');

-- Sample leave requests
INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, days_requested, reason, status, approver_id) VALUES
    ('550e8400-e29b-41d4-a716-446655440022', 'annual', CURRENT_DATE + INTERVAL '7 days', CURRENT_DATE + INTERVAL '9 days', 3, 'Family vacation', 'pending', NULL),
    ('550e8400-e29b-41d4-a716-446655440023', 'sick', CURRENT_DATE - INTERVAL '2 days', CURRENT_DATE - INTERVAL '1 day', 2, 'Flu symptoms', 'approved', '550e8400-e29b-41d4-a716-446655440021');

-- Sample announcements
INSERT INTO announcements (title, content, announcement_type, target_roles, published_by, is_published, published_at) VALUES
    ('New Health Insurance Policy', 'We are pleased to announce updates to our health insurance coverage, effective next month.', 'general', ARRAY['admin', 'manager', 'employee']::user_role[], '550e8400-e29b-41d4-a716-446655440011', true, NOW() - INTERVAL '2 days'),
    ('System Maintenance Schedule', 'HRIS system will undergo maintenance this weekend from 2 AM to 4 AM.', 'urgent', ARRAY['admin', 'manager', 'employee']::user_role[], '550e8400-e29b-41d4-a716-446655440011', true, NOW() - INTERVAL '1 day'),
    ('Team Building Event', 'Annual team building event scheduled for next month. Registration opens next week.', 'event', ARRAY['admin', 'manager', 'employee']::user_role[], '550e8400-e29b-41d4-a716-446655440011', true, NOW() - INTERVAL '3 days');

-- Sample payroll components
INSERT INTO payroll_components (name, component_type, is_percentage, percentage, amount) VALUES
    ('Basic Allowance', 'allowance', false, NULL, 500.00),
    ('Transport Allowance', 'allowance', false, NULL, 300.00),
    ('Health Insurance', 'deduction', true, 5.00, NULL),
    ('Income Tax', 'tax', true, 15.00, NULL),
    ('Pension Fund', 'deduction', true, 3.00, NULL);

-- Create views for common queries
CREATE VIEW employee_details AS
SELECT 
    e.id,
    e.employee_id,
    p.full_name,
    p.phone,
    p.avatar_url,
    e.position,
    d.name as division_name,
    e.join_date,
    e.employment_status,
    e.salary_base,
    u.email
FROM employees e
LEFT JOIN profiles p ON e.profile_id = p.user_id
LEFT JOIN divisions d ON e.division_id = d.id
LEFT JOIN users u ON e.profile_id = u.id;

CREATE VIEW attendance_summary AS
SELECT 
    e.employee_id,
    p.full_name,
    COUNT(a.id) as total_records,
    COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_days,
    COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late_days,
    COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_days
FROM employees e
LEFT JOIN profiles p ON e.profile_id = p.user_id
LEFT JOIN attendance_records a ON e.id = a.employee_id
WHERE a.date >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY e.id, e.employee_id, p.full_name;

-- Grant permissions (adjust as needed)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO hris_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO hris_user;

COMMIT;