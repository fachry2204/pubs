import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import AdminLayout from './layouts/AdminLayout';
import UserLayout from './layouts/UserLayout';
import AdminDashboard from './pages/admin/Dashboard';
import SongList from './pages/admin/SongList';
import CreateSong from './pages/admin/CreateSong';
import Creators from './pages/admin/Creators';
import AddCreator from './pages/admin/AddCreator';
import UserDashboard from './pages/user/Dashboard';
import Settings from './pages/admin/Settings';
import ReportList from './pages/admin/ReportList';
import ImportReport from './pages/admin/ImportReport';
import Analytics from './pages/admin/Analytics';
import UserList from './pages/admin/UserList';
import Payments from './pages/admin/Payments';
import PaymentDetail from './pages/admin/PaymentDetail';
import UserCreators from './pages/user/UserCreators';
import UserSongs from './pages/user/UserSongs';
import UnderConstruction from './components/UnderConstruction';
import Maintenance from './pages/Maintenance';
import api from './services/api';

function App() {
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings');
        if (res.data) {
          if (res.data.company_name) {
            document.title = res.data.company_name;
          }
          
          if (res.data.app_icon) {
            const link: any = document.querySelector("link[rel*='icon']") || document.createElement('link');
            link.type = 'image/x-icon';
            link.rel = 'shortcut icon';
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const baseUrl = apiUrl.replace('/api', '');
            
            // Check if full url or relative
            if (res.data.app_icon.startsWith('http')) {
                link.href = res.data.app_icon;
            } else {
                const iconPath = res.data.app_icon.replace(/\\/g, '/');
                link.href = iconPath.startsWith('uploads/') ? `/${iconPath}` : `/uploads/${iconPath}`;
            }
            
            document.getElementsByTagName('head')[0].appendChild(link);
          }
        }
      } catch (error) {
        console.error('Failed to fetch settings for title/icon', error);
      }
    };

    fetchSettings();
  }, []);

  return (
    <Routes>
      <Route path="/maintenance" element={<Maintenance />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* Admin Routes */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="songs" element={<SongList />} />
        <Route path="songs/create" element={<CreateSong />} />
        <Route path="songs/edit/:id" element={<CreateSong />} />
        <Route path="creators" element={<Creators />} />
        <Route path="creators/add" element={<AddCreator />} />
        <Route path="creators/edit/:id" element={<AddCreator />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="reports" element={<ReportList />} />
        <Route path="reports/import" element={<ImportReport />} />
        <Route path="payments" element={<Payments />} />
        <Route path="payments/:userId" element={<PaymentDetail />} />
        <Route path="contracts" element={<UnderConstruction title="Kontrak User" />} />
        <Route path="users" element={<UserList />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* User Routes */}
      <Route path="/user" element={<UserLayout />}>
        <Route index element={<UserDashboard />} />
        
        {/* Lagu Saya */}
        <Route path="creators" element={<UserCreators />} />
        <Route path="songs" element={<UserSongs />} />
        
        {/* Report Saya */}
        <Route path="analytics" element={<Analytics />} />
        <Route path="reports" element={<ReportList />} />
        <Route path="payments" element={<Payments />} />
        <Route path="payments/:userId" element={<PaymentDetail />} />
        
        <Route path="contracts" element={<UnderConstruction title="Kontrak" />} />
        <Route path="account" element={<UnderConstruction title="Akun Saya" />} />
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
