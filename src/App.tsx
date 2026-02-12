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
import UserPaymentDetail from './pages/user/UserPaymentDetail';
import UserPayments from './pages/user/UserPayments';
import UserCreators from './pages/user/UserCreators';
import UserSongs from './pages/user/UserSongs';
import UserAccount from './pages/user/UserAccount';
import UserReportList from './pages/user/UserReportList';
import UserAnalytics from './pages/user/UserAnalytics';
import UnderConstruction from './components/UnderConstruction';
import Maintenance from './pages/Maintenance';
import UserStatus from './pages/UserStatus';
import api from './services/api';

function App() {
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings');
        if (res.data) {
          // SEO Title
          if (res.data.seo_title) {
            document.title = res.data.seo_title;
          } else if (res.data.company_name) {
            document.title = res.data.company_name;
          }

          // SEO Description
          if (res.data.seo_description) {
            let metaDesc = document.querySelector("meta[name='description']");
            if (!metaDesc) {
                metaDesc = document.createElement('meta');
                metaDesc.setAttribute('name', 'description');
                document.head.appendChild(metaDesc);
            }
            metaDesc.setAttribute('content', res.data.seo_description);
          }
          
          // Social Cards (Open Graph & Twitter)
          const updateMetaTag = (attributeName: string, attributeValue: string, content: string) => {
             let element = document.querySelector(`meta[${attributeName}='${attributeValue}']`);
             if (!element) {
                 element = document.createElement('meta');
                 element.setAttribute(attributeName, attributeValue);
                 document.head.appendChild(element);
             }
             element.setAttribute('content', content);
          };

          const title = res.data.seo_title || res.data.company_name || document.title;
          const description = res.data.seo_description || '';
          
          // Open Graph / Facebook
          updateMetaTag('property', 'og:type', 'website');
          updateMetaTag('property', 'og:url', window.location.href);
          updateMetaTag('property', 'og:title', title);
          updateMetaTag('property', 'og:description', description);
          
          // Twitter
          updateMetaTag('name', 'twitter:card', 'summary_large_image');
          updateMetaTag('property', 'twitter:url', window.location.href);
          updateMetaTag('name', 'twitter:title', title);
          updateMetaTag('name', 'twitter:description', description);

          // Social Image
          let imageUrl = '';
          const origin = window.location.origin;
          
          if (res.data.social_image) {
              const socialPath = res.data.social_image.replace(/\\/g, '/');
              if (socialPath.startsWith('http')) {
                  imageUrl = socialPath;
              } else {
                   // Ensure it starts with /
                   const cleanPath = socialPath.startsWith('/') ? socialPath : `/${socialPath}`;
                   imageUrl = `${origin}${cleanPath}`;
              }
          } else if (res.data.app_icon) {
               // Fallback to app icon
               const iconPath = res.data.app_icon.replace(/\\/g, '/');
               if (iconPath.startsWith('http')) {
                   imageUrl = iconPath;
               } else {
                   // Match the logic used for favicon link below
                   const cleanPath = iconPath.startsWith('uploads/') ? `/${iconPath}` : `/uploads/${iconPath}`;
                   imageUrl = `${origin}${cleanPath}`;
               }
          }

          if (imageUrl) {
              updateMetaTag('property', 'og:image', imageUrl);
              updateMetaTag('name', 'twitter:image', imageUrl);
          }

          
          if (res.data.app_icon) {
            const link: any = document.querySelector("link[rel*='icon']") || document.createElement('link');
            link.type = 'image/x-icon';
            link.rel = 'shortcut icon';
            
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
      <Route path="/status" element={<UserStatus />} />
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
        <Route path="analytics" element={<UserAnalytics />} />
        <Route path="reports" element={<UserReportList />} />
        <Route path="payments" element={<UserPayments />} />
        <Route path="payments/:userId" element={<UserPaymentDetail />} />
        
        <Route path="contracts" element={<UnderConstruction title="Kontrak" />} />
        <Route path="account" element={<UserAccount />} />
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
