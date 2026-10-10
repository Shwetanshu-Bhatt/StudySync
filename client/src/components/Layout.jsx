import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';

const Layout = ({ children }) => {
  const { pathname } = useLocation();
  const isAuthPage = pathname === '/login' || pathname === '/signup';

  return (
    <div className="study-app min-h-screen">
      {!isAuthPage && <Navbar />}
      <main className={isAuthPage ? 'study-main study-main-auth' : 'study-main pt-16 lg:pt-20'}>
        {children}
      </main>
    </div>
  );
};

export default Layout;
