import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, Search, Bell, Mail, Menu, Server, Database } from 'lucide-react';
import api from '../services/api';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [serverStatus, setServerStatus] = useState<'online' | 'offline'>('offline');
  const [dbStatus, setDbStatus] = useState<'online' | 'offline'>('offline');

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await api.get('/health');
        if (res.status === 200) {
            setServerStatus('online');
            if (res.data.status === 'connected') {
                setDbStatus('online');
            } else {
                setDbStatus('offline');
            }
        }
      } catch (error) {
        setServerStatus('offline');
        setDbStatus('offline');
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-white h-20 flex items-center justify-between px-8 ml-64 sticky top-0 z-50 shadow-sm">
      <div className="flex items-center space-x-6">
         <button className="text-gray-400 hover:text-gray-600 lg:hidden">
            <Menu size={24} />
         </button>
         
         <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input 
                type="text" 
                placeholder="Search..." 
                className="pl-10 pr-4 py-2.5 rounded-full bg-gray-50 border border-gray-100 focus:outline-none focus:bg-white focus:ring-2 focus:ring-purple-100 text-sm w-64 transition-all" 
            />
         </div>
      </div>

      <div className="flex items-center space-x-6">
        {/* Status Indicators */}
        <div className="hidden md:flex items-center gap-4 mr-4 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
            <div className="flex items-center gap-2" title="Server Status">
                <div className={`w-2.5 h-2.5 rounded-full ${serverStatus === 'online' ? 'bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]'}`}></div>
                <span className="text-xs font-semibold text-gray-500 flex items-center gap-1">
                    <Server size={12} />
                    Server
                </span>
            </div>
            <div className="w-px h-3 bg-gray-300"></div>
            <div className="flex items-center gap-2" title="Database Status">
                <div className={`w-2.5 h-2.5 rounded-full ${dbStatus === 'online' ? 'bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]'}`}></div>
                <span className="text-xs font-semibold text-gray-500 flex items-center gap-1">
                    <Database size={12} />
                    DB
                </span>
            </div>
        </div>

        <button className="relative text-gray-400 hover:text-purple-600 transition-colors">
            <Bell size={20} />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        <button className="relative text-gray-400 hover:text-purple-600 transition-colors">
            <Mail size={20} />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border-2 border-white"></span>
        </button>
        
        <div className="h-8 w-px bg-gray-200 mx-2"></div>

        <div className="flex items-center space-x-3 cursor-pointer group relative">
            <div className="text-right hidden md:block">
                <p className="text-sm font-semibold text-gray-700 group-hover:text-purple-700 transition-colors">Hello, {user?.name}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 p-0.5">
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                    <User size={20} className="text-gray-600" />
                </div>
            </div>
            
            {/* Simple Dropdown for Logout */}
            <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right z-50">
                <button
                    onClick={logout}
                    className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-red-500 flex items-center"
                >
                    <LogOut size={16} className="mr-2" />
                    Logout
                </button>
            </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
