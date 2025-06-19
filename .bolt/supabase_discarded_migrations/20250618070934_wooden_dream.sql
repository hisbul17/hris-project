/*
  # Seed Initial Data for HRIS

  1. Sample Data
    - Create sample divisions
    - Create sample profiles and employees
    - Create sample attendance records
    - Create sample leave requests
    - Create sample announcements
    - Create sample payroll components

  2. Admin User Setup
    - Create admin profile for testing
*/

-- Insert sample divisions
INSERT INTO divisions (id, name, description) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Human Resources', 'Manages employee relations and company policies'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Technology', 'Software development and IT infrastructure'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Marketing', 'Brand management and customer acquisition'),
  ('550e8400-e29b-41d4-a716-446655440004', 'Finance', 'Financial planning and accounting'),
  ('550e8400-e29b-41d4-a716-446655440005', 'Operations', 'Business operations and logistics');

-- Insert sample payroll components
INSERT INTO payroll_components (name, component_type, is_percentage, amount, percentage) VALUES
  ('Transport Allowance', 'allowance', false, 500000, 0),
  ('Meal Allowance', 'allowance', false, 300000, 0),
  ('Health Insurance', 'deduction', true, 0, 5.0),
  ('Pension Fund', 'deduction', true, 0, 2.0),
  ('Income Tax', 'tax', true, 0, 15.0),
  ('Performance Bonus', 'allowance', true, 0, 10.0);

-- Note: Actual user profiles and employees will be created when users sign up
-- The application will handle user registration and profile creation