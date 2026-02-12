import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const UserLayout = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check status and redirect to status page if not accepted
  if (user.role === 'user' && user.status && user.status !== 'accepted') {
      return <Navigate to="/status" replace />;
  }

  // Optional: Redirect admin to admin dashboard if they try to access user layout
  if (user.role === 'admin') {
      return <Navigate to="/admin" replace />;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col relative z-0">
        <Navbar />
        <main className="flex-1 p-6 ml-64 overflow-auto">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default UserLayout;
