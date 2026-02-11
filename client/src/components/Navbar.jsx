import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard', roles: ['student', 'teacher', 'admin'] },
    { path: '/browse-notes', label: 'Browse Notes', roles: ['student', 'teacher', 'admin'] },
    { path: '/upload-notes', label: 'Upload Notes', roles: ['teacher', 'admin'] },
    { path: '/subjects', label: 'Subjects', roles: ['student', 'teacher', 'admin'] }
  ];

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="text-2xl font-bold text-blue-600">
            StudySync
          </Link>

          {isAuthenticated && (
            <div className="hidden md:flex items-center gap-6">
              {navLinks
                .filter((link) => link.roles.includes(user.role))
                .map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className="text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
            </div>
          )}

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <span className="text-gray-600">
                  {user.name} ({user.role})
                </span>
                <button
                  onClick={handleLogout}
                  className="btn btn-secondary text-sm"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-600 hover:text-blue-600">
                  Login
                </Link>
                <Link to="/signup" className="btn btn-primary text-sm">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
