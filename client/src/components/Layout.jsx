import Navbar from './Navbar';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#0f0a1a]">
      <Navbar />
      <main className="pt-16 lg:pt-20">
        {children}
      </main>
    </div>
  );
};

export default Layout;
