import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Clock, 
  Calendar, 
  Users, 
  FileText, 
  Bell,
  Settings,
  LogOut,
  Building2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  isCollapsed: boolean;
}

export default function Sidebar({ isCollapsed }: SidebarProps) {
  const { user, signOut } = useAuth();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Clock, label: 'Attendance', path: '/attendance' },
    { icon: Calendar, label: 'Leave Requests', path: '/leave' },
    { icon: Users, label: 'Employees', path: '/employees' },
    { icon: FileText, label: 'Documents', path: '/documents' },
    { icon: Bell, label: 'Announcements', path: '/announcements' },
  ];

  if (user?.role === 'admin') {
    menuItems.push({ icon: Settings, label: 'Settings', path: '/settings' });
  }

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className={`bg-white border-r border-gray-200 transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    } flex flex-col h-full`}>
      {/* Logo */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center">
          <Building2 className="h-8 w-8 text-blue-600" />
          {!isCollapsed && (
            <span className="ml-3 text-xl font-bold text-gray-900">HRIS</span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && <span className="ml-3">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User Profile & Logout */}
      <div className="p-4 border-t border-gray-200">
        {!isCollapsed && user && (
          <div className="flex items-center mb-3">
            <img
              src={user.avatar_url || 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?w=40&h=40&fit=crop&crop=face'}
              alt={user.full_name || 'User'}
              className="h-8 w-8 rounded-full"
            />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">
                {user.full_name || user.email}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {user.role || 'employee'}
              </p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={`flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors ${
            isCollapsed ? 'justify-center' : ''
          }`}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!isCollapsed && <span className="ml-3">Logout</span>}
        </button>
      </div>
    </div>
  );
}