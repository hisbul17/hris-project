/*
  # Seed Initial Data for HRIS

  1. Sample Data
    - Create sample divisions
    - Create sample payroll components
    - Create sample announcements (for demo purposes)

  2. Note
    - User profiles and employees will be created when users sign up
    - The application handles user registration and profile creation
*/

-- Insert sample divisions
INSERT INTO divisions (id, name, description) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Human Resources', 'Manages employee relations and company policies'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Technology', 'Software development and IT infrastructure'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Marketing', 'Brand management and customer acquisition'),
  ('550e8400-e29b-41d4-a716-446655440004', 'Finance', 'Financial planning and accounting'),
  ('550e8400-e29b-41d4-a716-446655440005', 'Operations', 'Business operations and logistics')
ON CONFLICT (id) DO NOTHING;

-- Insert sample payroll components
INSERT INTO payroll_components (name, component_type, is_percentage, amount, percentage) VALUES
  ('Transport Allowance', 'allowance', false, 500000, 0),
  ('Meal Allowance', 'allowance', false, 300000, 0),
  ('Health Insurance', 'deduction', true, 0, 5.0),
  ('Pension Fund', 'deduction', true, 0, 2.0),
  ('Income Tax', 'tax', true, 0, 15.0),
  ('Performance Bonus', 'allowance', true, 0, 10.0)
ON CONFLICT DO NOTHING;

-- Insert sample announcements (for demo purposes)
INSERT INTO announcements (
  title, 
  content, 
  announcement_type, 
  target_roles, 
  is_published, 
  published_at
) VALUES
  (
    'Welcome to HRIS System',
    'We are excited to introduce our new Human Resource Information System. This platform will help streamline HR processes and improve employee experience.',
    'general',
    ARRAY['admin', 'manager', 'employee']::user_role[],
    true,
    now()
  ),
  (
    'System Maintenance Notice',
    'The HRIS system will undergo scheduled maintenance this weekend from 2 AM to 4 AM. Please plan accordingly.',
    'urgent',
    ARRAY['admin', 'manager', 'employee']::user_role[],
    true,
    now()
  ),
  (
    'New Employee Onboarding Process',
    'We have updated our employee onboarding process. All new hires will now go through a comprehensive digital onboarding experience.',
    'general',
    ARRAY['admin', 'manager']::user_role[],
    true,
    now()
  )
ON CONFLICT DO NOTHING;