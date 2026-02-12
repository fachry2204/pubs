import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [bgUrl, setBgUrl] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState('CMS Publishing RuangMusik');
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [serverStatus, setServerStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkStatus = async () => {
        setServerStatus('checking');
        setDbStatus('checking');
        try {
            const response = await api.get('/health');
            setServerStatus('connected');
            if (response.status === 200 && response.data.status === 'connected') {
                setDbStatus('connected');
            } else {
                setDbStatus('disconnected');
            }
        } catch (error: any) {
             if (error.response) {
                // Server responded (so it's up), but returned error (DB likely down)
                setServerStatus('connected');
                setDbStatus('disconnected');
            } else {
                // Network error, server down
                setServerStatus('disconnected');
                setDbStatus('disconnected');
            }
        }
    };
    checkStatus();

    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings');
        if (res.data) {
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
          const baseUrl = apiUrl.replace('/api', '');

          if (res.data.logo) {
            const logoPath = res.data.logo.replace(/\\/g, '/');
            const url = logoPath.startsWith('http') 
              ? logoPath 
              : `${baseUrl}/${logoPath}`;
            setLogoUrl(url);
          }
          if (res.data.login_background) {
            const bgPath = res.data.login_background.replace(/\\/g, '/');
            const url = bgPath.startsWith('http') 
              ? bgPath 
              : `${baseUrl}/${bgPath}`;
            setBgUrl(url);
          }
          if (res.data.company_name) {
            setCompanyName(res.data.company_name);
          }
        }
      } catch (err) {
        console.error('Failed to fetch settings:', err);
      }
    };
    fetchSettings();
  }, []);

  const [statusModal, setStatusModal] = useState<{show: boolean, status: string, detail: string}>({
    show: false,
    status: '',
    detail: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.token, res.data.user);
      if (res.data.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/user');
      }
    } catch (err: any) {
      if (err.response?.status === 403 && err.response?.data?.status) {
        setStatusModal({
            show: true,
            status: err.response.data.status,
            detail: err.response.data.detail
        });
        setError('');
      } else {
        setError(err.response?.data?.message || 'Login failed');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative bg-gray-50 overflow-hidden">
      {/* Background Image with Opacity */}
      {bgUrl && (
        <div className="absolute inset-0 z-0 bg-black">
             <img src={bgUrl} alt="Background" className="w-full h-full object-cover opacity-60" />
        </div>
      )}
      
      {/* Status Indicators */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
        
        {/* Backend Status */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-sm shadow-sm border border-gray-200">
            <span className="text-xs font-medium text-gray-500">Backend:</span>
            {serverStatus === 'checking' && <Loader2 size={14} className="animate-spin text-blue-500" />}
            {serverStatus === 'connected' && (
                <div className="flex items-center gap-1 text-green-600">
                    <Wifi size={14} />
                    <span className="text-xs font-bold">Online</span>
                </div>
            )}
            {serverStatus === 'disconnected' && (
                <div className="flex items-center gap-1 text-red-500">
                    <WifiOff size={14} />
                    <span className="text-xs font-bold">Offline</span>
                </div>
            )}
        </div>

        {/* Database Status */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-sm shadow-sm border border-gray-200">
            <span className="text-xs font-medium text-gray-500">Database:</span>
            {dbStatus === 'checking' && <Loader2 size={14} className="animate-spin text-blue-500" />}
            {dbStatus === 'connected' && (
                <div className="flex items-center gap-1 text-green-600">
                    <Wifi size={14} />
                    <span className="text-xs font-bold">Connected</span>
                </div>
            )}
            {dbStatus === 'disconnected' && (
                <div className="flex items-center gap-1 text-red-500">
                    <WifiOff size={14} />
                    <span className="text-xs font-bold">Disconnected</span>
                </div>
            )}
        </div>

      </div>

      {/* Status Modal */}
      {statusModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl p-6 w-96 max-w-[90%] transform transition-all scale-100">
                <div className="flex flex-col items-center text-center">
                    <div className={`p-4 rounded-full mb-4 ${
                        statusModal.status === 'review' ? 'bg-yellow-100 text-yellow-600' :
                        statusModal.status === 'rejected' ? 'bg-red-100 text-red-600' :
                        'bg-blue-100 text-blue-600'
                    }`}>
                        <Loader2 size={32} className={statusModal.status === 'review' ? 'animate-spin-slow' : ''} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2 capitalize">
                        Status: {statusModal.status}
                    </h3>
                    <p className="text-gray-500 mb-6">
                        {statusModal.detail}
                    </p>
                    <button 
                        onClick={() => setStatusModal({ ...statusModal, show: false })}
                        className="glass-button w-full"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
      )}

      <div className="glass-panel p-8 w-96 relative z-10">
        <div className="flex flex-col items-center mb-6">
            {logoUrl && <img src={logoUrl} alt="Logo" className="h-24 mb-4 object-contain" />}
            <h1 className="text-lg font-bold text-[#7A4A88] text-center mb-1">{companyName}</h1>
            <h3 className="text-xs uppercase tracking-[0.2em] text-gray-400 font-semibold mb-2 mt-1">System Publishing</h3>
            <h2 className="text-2xl font-bold text-center text-[#7A4A88]">Login</h2>
        </div>
        {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block glass-input"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block glass-input"
              required
            />
          </div>
          <button
            type="submit"
            className="glass-button w-full"
          >
            Sign In
          </button>
        </form>
        <div className="mt-4 text-center text-sm">
          Don't have an account? <Link to="/register" className="text-[#7A4A88] hover:text-purple-600">Register</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
