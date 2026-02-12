import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { LayoutDashboard, Music, FileText, DollarSign, FileCode, Settings, Users, User, ChevronDown, ChevronRight, BookOpen } from 'lucide-react';
import clsx from 'clsx';

const Sidebar = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [publishingOpen, setPublishingOpen] = useState(true);
  const [reportOpen, setReportOpen] = useState(false);
  const [companyName, setCompanyName] = useState('Mendy'); // Default to Mendy style
  const [logo, setLogo] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings');
        if (res.data) {
          if (res.data.company_name) {
            setCompanyName(res.data.company_name);
          }
          if (res.data.logo) {
             const logoPath = res.data.logo.replace(/\\/g, '/');
             const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
             const baseUrl = apiUrl.replace('/api', '');
             const logoUrl = logoPath.startsWith('http') 
               ? logoPath 
               : `${baseUrl}/${logoPath}`;
             setLogo(logoUrl);
          }
        }
      } catch (error) {
        console.error('Failed to fetch settings', error);
      }
    };
    fetchSettings();
  }, []);

  // Admin Links with Grouping
  const adminLinks = [
    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    // Publishing Group
    { 
      label: 'Publishing', 
      icon: BookOpen,
      isGroup: true,
      isOpen: publishingOpen,
      toggle: () => setPublishingOpen(!publishingOpen),
      children: [
        { path: '/admin/creators', label: 'Data Pencipta', icon: User },
        { path: '/admin/songs', label: 'Data Lagu', icon: Music },
      ]
    },
    // Report Group
    { 
      label: 'Data Report', 
      icon: FileText,
      isGroup: true,
      isOpen: reportOpen,
      toggle: () => setReportOpen(!reportOpen),
      children: [
        { path: '/admin/analytics', label: 'Analitik', icon: FileText },
        { path: '/admin/reports', label: 'Report', icon: FileText },
        { path: '/admin/reports/import', label: 'Import', icon: FileText },
      ]
    },
    { path: '/admin/payments', label: 'Pembayaran', icon: DollarSign },
    { path: '/admin/contracts', label: 'Kontrak User', icon: FileCode },
    { path: '/admin/users', label: 'User Management', icon: Users },
    { path: '/admin/settings', label: 'Setting', icon: Settings },
  ];

  const userLinks = [
    { path: '/user', label: 'Dashboard', icon: LayoutDashboard },
    { 
        label: 'Lagu Saya', 
        icon: Music,
        isGroup: true,
        isOpen: publishingOpen, // Reuse or create separate state if needed
        toggle: () => setPublishingOpen(!publishingOpen),
        children: [
            { path: '/user/creators', label: 'Data Pencipta', icon: User },
            { path: '/user/songs', label: 'Data Lagu', icon: Music },
        ]
    },
    { 
        label: 'Report Saya', 
        icon: FileText,
        isGroup: true,
        isOpen: reportOpen, // Reuse or create separate state if needed
        toggle: () => setReportOpen(!reportOpen),
        children: [
            { path: '/user/analytics', label: 'Analitik', icon: FileText },
            { path: '/user/reports', label: 'Report Lagu', icon: FileText },
            { path: '/user/payments', label: 'Pembayaran', icon: DollarSign },
        ]
    },
    { path: '/user/contracts', label: 'Kontrak', icon: FileCode },
    { path: '/user/account', label: 'Akun Saya', icon: User },
  ];

  const links = user?.role === 'admin' ? adminLinks : userLinks;

  return (
    <div className="w-64 bg-sidebar h-screen shadow-xl flex flex-col fixed overflow-y-auto z-20 text-gray-400 font-sans">
      {/* Header / Logo */}
      <div className="p-6 flex items-center space-x-3 mb-2">
        {logo ? (
            <img src={logo} alt="Logo" className="w-10 h-10 object-contain rounded-lg bg-white/10 p-1" />
        ) : (
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg">
            {companyName.charAt(0)}
            </div>
        )}
        <h1 className="text-2xl font-bold text-white tracking-wide">{companyName}</h1>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {links.map((link: any) => {
          if (link.isGroup) {
            return (
              <div key={link.label}>
                <button
                  onClick={link.toggle}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center">
                    <link.icon className="w-5 h-5 mr-3" />
                    {link.label}
                  </div>
                  {link.isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                {link.isOpen && (
                  <div className="mt-1 space-y-1">
                    {link.children.map((child: any) => {
                       const isChildActive = location.pathname === child.path;
                       return (
                        <Link
                          key={child.path}
                          to={child.path}
                          className={clsx(
                            'flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all ml-4 border-l border-gray-700 pl-4',
                            isChildActive
                              ? 'text-white border-l-2 border-accent-pink pl-[15px]' // Adjust padding to account for border width change
                              : 'text-gray-500 hover:text-gray-300'
                          )}
                        >
                          {/* {ChildIcon && <ChildIcon className="w-4 h-4 mr-3" />} */}
                          <span className="w-1.5 h-1.5 rounded-full bg-current mr-3 opacity-50"></span>
                          {child.label}
                        </Link>
                       );
                    })}
                  </div>
                )}
              </div>
            );
          }

          const Icon = link.icon;
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.path}
              to={link.path}
              className={clsx(
                'flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all relative overflow-hidden group',
                isActive
                  ? 'text-white bg-sidebar-active'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              )}
            >
              {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent-pink rounded-r-full"></div>}
              <Icon className={clsx("w-5 h-5 mr-3 transition-colors", isActive ? "text-accent-pink" : "group-hover:text-white")} />
              {link.label}
            </Link>
          );
        })}
      </nav>
      
    </div>
  );
};

export default Sidebar;
