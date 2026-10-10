import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const navLinks = [
  { path: '/dashboard', label: 'Workspace', icon: 'home', roles: ['student', 'teacher', 'admin'] },
  { path: '/browse-notes', label: 'Materials', icon: 'book', roles: ['student', 'teacher', 'admin'] },
  { path: '/upload-notes', label: 'Share', icon: 'upload', roles: ['teacher', 'admin'] },
  { path: '/courses', label: 'Courses', icon: 'bookmark', roles: ['teacher', 'admin'] },
  { path: '/subjects', label: 'Subjects', icon: 'folder', roles: ['teacher', 'admin'] },
  { path: '/friends', label: 'Community', icon: 'users', roles: ['student', 'teacher', 'admin'] },
  { path: '/chat', label: 'Study rooms', icon: 'message', roles: ['student', 'teacher', 'admin'] },
  { path: '/manage-teachers', label: 'Admin', icon: 'shield', roles: ['admin'] }
];

const iconPaths = {
  home: 'M3 11.5 12 4l9 7.5M5.5 10v10h13V10M9.5 20v-6h5v6',
  book: 'M4 6.5c3.5-1.4 6.4-.8 9 1.5v13c-2.6-2.3-5.5-2.9-9-1.5v-13ZM20 6.5c-3.5-1.4-6.4-.8-9 1.5v13c2.6-2.3 5.5-2.9 9-1.5v-13Z',
  upload: 'M12 16V4m0 0 4.5 4.5M12 4 7.5 8.5M5 15v4h14v-4',
  bookmark: 'M6 4h12v17l-6-4-6 4V4Z',
  folder: 'M3.5 8h7l2.5 2.5h7.5v10h-17V8ZM3.5 8V6h7l2 2',
  users: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 20c0-4 2.7-6 8-6s8 2 8 6M19 5a3.5 3.5 0 0 1 0 6.7m1 2.7c2.5.7 3.8 2.2 4 4.6',
  message: 'M4 5.5h16v12H10l-5 3v-3H4v-12ZM8 10h8m-8 4h5',
  shield: 'M12 3.5 19 6v5.5c0 4.5-2.8 7.5-7 9-4.2-1.5-7-4.5-7-9V6l7-2.5ZM9 12l2 2 4-4'
};

const NavbarIcon = ({ name, className = '' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={iconPaths[name]} />
  </svg>
);

const Navbar = () => {
  const { user, setUser, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || null);

  useEffect(() => {
    setAvatarUrl(user?.avatar || null);
  }, [user]);

  useEffect(() => {
    const fetchUser = async () => {
      if (!isAuthenticated) return;
      try {
        const res = await api.get('/users/me');
        if (res.data.user?.avatar) {
          setAvatarUrl(res.data.user.avatar);
          setUser(res.data.user);
          localStorage.setItem('user', JSON.stringify(res.data.user));
        }
      } catch {
        // Keep the cached profile details when refresh is unavailable.
      }
    };
    fetchUser();
  }, [isAuthenticated, setUser]);

  useEffect(() => {
    setMobileMenuOpen(false);
    setProfileDropdownOpen(false);
  }, [location]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredLinks = navLinks.filter((link) => link.roles.includes(user?.role));
  const isActive = (path) => location.pathname === path;

  const renderLinks = (mobile = false) => filteredLinks.map((link) => (
    <Link
      key={link.path}
      to={link.path}
      aria-current={isActive(link.path) ? 'page' : undefined}
      className={`${mobile ? 'study-mobile-link' : 'study-nav-link'}${isActive(link.path) ? ' is-active' : ''}`}
    >
      <NavbarIcon name={link.icon} />
      <span>{link.label}</span>
    </Link>
  ));

  return (
    <nav className="study-navbar fixed inset-x-0 top-0 z-50">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:h-20 lg:px-8">
        <Link to="/dashboard" className="study-brand" aria-label="StudySync workspace">
          <img className="study-brand-mark" src="/studySync.svg" alt="" />
          <span className="study-brand-copy">
            <strong>StudySync</strong>
          </span>
        </Link>

        {isAuthenticated && <div className="study-nav-links hidden xl:flex">{renderLinks()}</div>}

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <div className="relative">
                <button
                  className="study-profile-trigger"
                  type="button"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  aria-expanded={profileDropdownOpen}
                  aria-haspopup="menu"
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="study-profile-avatar" />
                  ) : (
                    <span className="study-profile-avatar grid place-items-center bg-primary-800 text-xs font-semibold text-white">
                      {user?.name?.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <span className="hidden sm:block">{user?.name?.split(' ')[0]}</span>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="m7 10 5 5 5-5" />
                  </svg>
                </button>

                {profileDropdownOpen && (
                  <div className="study-profile-menu absolute right-0 mt-2 w-60 overflow-hidden" role="menu">
                    <div className="border-b border-white/10 px-4 py-3">
                      <p className="text-sm font-semibold text-white">{user?.name}</p>
                      <p className="text-xs capitalize text-slate-500">{user?.role}</p>
                    </div>
                    <Link to="/profile" role="menuitem" className="study-profile-menu-link">My profile <span aria-hidden="true">↗</span></Link>
                    <button type="button" role="menuitem" className="study-profile-menu-link" onClick={handleLogout}>Sign out <span aria-hidden="true">↗</span></button>
                  </div>
                )}
              </div>

              <button
                className="study-menu-toggle xl:hidden grid h-10 w-10 place-items-center"
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-expanded={mobileMenuOpen}
                aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              >
                {mobileMenuOpen ? (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="m6 6 12 12M18 6 6 18" /></svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="M4 7h16M4 12h16M4 17h16" /></svg>
                )}
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link className="study-signin-link" to="/login">Sign in</Link>
              <Link className="study-signup-link" to="/signup">Get started <span aria-hidden="true">↗</span></Link>
            </div>
          )}
        </div>
      </div>

      {isAuthenticated && mobileMenuOpen && (
        <div className="study-mobile-menu fixed inset-x-0 bottom-0 top-16 z-40 overflow-y-auto lg:top-20 xl:hidden">
          <div className="mx-auto max-w-3xl px-5 py-5">
            <div className="mb-5 flex items-center gap-3 border-b border-[var(--line)] pb-5">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="study-profile-avatar h-11 w-11" />
              ) : (
                <span className="study-profile-avatar grid h-11 w-11 place-items-center bg-primary-800 font-semibold text-white">{user?.name?.charAt(0).toUpperCase()}</span>
              )}
              <div>
                <p className="font-semibold text-white">{user?.name}</p>
                <p className="text-xs capitalize text-slate-500">{user?.role}</p>
              </div>
              <Link to="/profile" className="ml-auto study-mobile-profile">Profile ↗</Link>
            </div>
            <div className="grid gap-1">{renderLinks(true)}</div>
            <button type="button" className="study-mobile-signout" onClick={handleLogout}>Sign out <span aria-hidden="true">↗</span></button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
