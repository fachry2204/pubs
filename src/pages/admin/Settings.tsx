import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Save, Upload } from 'lucide-react';

const Settings = () => {
  const [companyName, setCompanyName] = useState('');
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  
  const [loginBg, setLoginBg] = useState<File | null>(null);
  const [loginBgPreview, setLoginBgPreview] = useState<string | null>(null);

  const [appIcon, setAppIcon] = useState<File | null>(null);
  const [appIconPreview, setAppIconPreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      if (res.data) {
        setCompanyName(res.data.company_name || '');
        // Use relative API path by default so it works on any domain
        const apiUrl = import.meta.env.VITE_API_URL || '/api';
        const baseUrl = apiUrl.replace('/api', '');

        if (res.data.logo) {
          const logoPath = res.data.logo.replace(/\\/g, '/');
          const logoUrl = logoPath.startsWith('http') ? logoPath : `${baseUrl}/${logoPath}`;
          setLogoPreview(logoUrl);
        }

        if (res.data.login_background) {
            const bgPath = res.data.login_background.replace(/\\/g, '/');
            const bgUrl = bgPath.startsWith('http') ? bgPath : `${baseUrl}/${bgPath}`;
            setLoginBgPreview(bgUrl);
        }

        if (res.data.app_icon) {
            const iconPath = res.data.app_icon.replace(/\\/g, '/');
            const iconUrl = iconPath.startsWith('http') ? iconPath : `${baseUrl}/${iconPath}`;
            setAppIconPreview(iconUrl);
        }
      }
    } catch (error) {
      console.error('Failed to fetch settings', error);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogo(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleBgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLoginBg(file);
      setLoginBgPreview(URL.createObjectURL(file));
    }
  };

  const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAppIcon(file);
      setAppIconPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const formData = new FormData();
    formData.append('company_name', companyName);
    if (logo) {
      formData.append('logo', logo);
    }
    if (loginBg) {
        formData.append('login_background', loginBg);
    }
    if (appIcon) {
        formData.append('app_icon', appIcon);
    }

    try {
      await api.put('/settings', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setMessage('Settings updated successfully');
    } catch (error) {
      console.error('Failed to update settings', error);
      setMessage('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel p-6">
      <h2 className="text-2xl font-bold mb-6 text-[#7A4A88]">Settings</h2>
      {message && (
        <div className={`p-4 rounded-md mb-4 ${message.includes('success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="glass-input"
            placeholder="Enter company name"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Logo</label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="w-24 h-24 border border-white/40 rounded-md overflow-hidden flex items-center justify-center bg-white/50 shrink-0">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-gray-400 text-xs">No Logo</span>
                  )}
                </div>
                <label className="cursor-pointer bg-[#7A4A88] text-white px-4 py-2 rounded-md hover:bg-[#6a3d77] transition-colors flex items-center text-sm w-full sm:w-auto justify-center">
                  <Upload size={16} className="mr-2" />
                  <span>Upload Logo</span>
                  <input type="file" className="hidden" accept="image/*" onChange={handleLogoChange} />
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">App Icon (Favicon)</label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="w-12 h-12 border border-white/40 rounded-md overflow-hidden flex items-center justify-center bg-white/50 shrink-0">
                  {appIconPreview ? (
                    <img src={appIconPreview} alt="Icon Preview" className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-gray-400 text-[10px]">No Icon</span>
                  )}
                </div>
                <label className="cursor-pointer bg-[#7A4A88] text-white px-4 py-2 rounded-md hover:bg-[#6a3d77] transition-colors flex items-center text-sm w-full sm:w-auto justify-center">
                  <Upload size={16} className="mr-2" />
                  <span>Upload Icon</span>
                  <input type="file" className="hidden" accept="image/*" onChange={handleIconChange} />
                </label>
              </div>
            </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Login Background (Opacity 60%)</label>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-full sm:w-64 h-32 border border-white/40 rounded-md overflow-hidden flex items-center justify-center bg-white/50 relative shrink-0">
              {loginBgPreview ? (
                <div className="w-full h-full relative">
                    <img src={loginBgPreview} alt="Bg Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black opacity-40"></div>
                </div>
              ) : (
                <span className="text-gray-400 text-xs">No Background</span>
              )}
            </div>
            <label className="cursor-pointer bg-[#7A4A88] text-white px-4 py-2 rounded-md hover:bg-[#6a3d77] transition-colors flex items-center text-sm w-full sm:w-auto justify-center">
              <Upload size={16} className="mr-2" />
              <span>Upload Background</span>
              <input type="file" className="hidden" accept="image/*" onChange={handleBgChange} />
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="glass-button flex items-center disabled:opacity-50"
        >
          <Save size={18} className="mr-2" />
          {loading ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
};

export default Settings;
