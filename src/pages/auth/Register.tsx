import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import axios from 'axios';

interface Region {
  id: string;
  name: string;
}

const Register = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: '',
    password: '',
    address: '',
    country: '',
    province: '',
    city: '',
    district: '',
    subdistrict: ''
  });

  // State for fetching data
  const [countries, setCountries] = useState<string[]>([]);
  const [provinces, setProvinces] = useState<Region[]>([]);
  const [cities, setCities] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<Region[]>([]);
  const [subdistricts, setSubdistricts] = useState<Region[]>([]);

  // State for tracking IDs (since we submit names but fetch by ID)
  const [selectedIds, setSelectedIds] = useState({
    province: '',
    city: '',
    district: ''
  });
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Fetch Countries on Mount
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await axios.get('https://restcountries.com/v3.1/all?fields=name');
        const countryList = response.data
          .map((c: any) => c.name.common)
          .sort((a: string, b: string) => a.localeCompare(b));
        setCountries(countryList);
      } catch (err) {
        console.error('Error fetching countries:', err);
        // Fallback if API fails
        setCountries(['Indonesia', 'Malaysia', 'Singapore', 'United States', 'United Kingdom']);
      }
    };
    fetchCountries();
  }, []);

  // Fetch Provinces if Indonesia
  useEffect(() => {
    if (formData.country === 'Indonesia') {
      const fetchProvinces = async () => {
        try {
          const response = await axios.get('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json');
          setProvinces(response.data);
        } catch (err) {
          console.error('Error fetching provinces:', err);
        }
      };
      fetchProvinces();
    } else {
      setProvinces([]);
      setCities([]);
      setDistricts([]);
      setSubdistricts([]);
    }
  }, [formData.country]);

  // Fetch Cities when Province changes
  useEffect(() => {
    if (selectedIds.province) {
      const fetchCities = async () => {
        try {
          const response = await axios.get(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${selectedIds.province}.json`);
          setCities(response.data);
        } catch (err) {
          console.error('Error fetching cities:', err);
        }
      };
      fetchCities();
    } else {
      setCities([]);
    }
  }, [selectedIds.province]);

  // Fetch Districts when City changes
  useEffect(() => {
    if (selectedIds.city) {
      const fetchDistricts = async () => {
        try {
          const response = await axios.get(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${selectedIds.city}.json`);
          setDistricts(response.data);
        } catch (err) {
          console.error('Error fetching districts:', err);
        }
      };
      fetchDistricts();
    } else {
      setDistricts([]);
    }
  }, [selectedIds.city]);

  // Fetch Subdistricts when District changes
  useEffect(() => {
    if (selectedIds.district) {
      const fetchSubdistricts = async () => {
        try {
          const response = await axios.get(`https://www.emsifa.com/api-wilayah-indonesia/api/villages/${selectedIds.district}.json`);
          setSubdistricts(response.data);
        } catch (err) {
          console.error('Error fetching subdistricts:', err);
        }
      };
      fetchSubdistricts();
    } else {
      setSubdistricts([]);
    }
  }, [selectedIds.district]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Reset child fields if parent changes (specifically for manual input scenario, though mostly handled by specific handlers below for ID-based)
    if (name === 'country' && value !== 'Indonesia') {
       setFormData(prev => ({
           ...prev,
           country: value,
           province: '',
           city: '',
           district: '',
           subdistrict: ''
       }));
       setSelectedIds({ province: '', city: '', district: '' });
       return;
    }

    setFormData({ ...formData, [name]: value });
  };

  const handleRegionChange = (level: 'province' | 'city' | 'district' | 'subdistrict', e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    const index = e.target.selectedIndex;
    const name = e.target.options[index].text;

    // Reset downstream data
    if (level === 'province') {
        setSelectedIds(prev => ({ ...prev, province: id, city: '', district: '' }));
        setFormData(prev => ({ ...prev, province: name, city: '', district: '', subdistrict: '' }));
        setCities([]); setDistricts([]); setSubdistricts([]);
    } else if (level === 'city') {
        setSelectedIds(prev => ({ ...prev, city: id, district: '' }));
        setFormData(prev => ({ ...prev, city: name, district: '', subdistrict: '' }));
        setDistricts([]); setSubdistricts([]);
    } else if (level === 'district') {
        setSelectedIds(prev => ({ ...prev, district: id }));
        setFormData(prev => ({ ...prev, district: name, subdistrict: '' }));
        setSubdistricts([]);
    } else if (level === 'subdistrict') {
        setFormData(prev => ({ ...prev, subdistrict: name }));
    }
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      if (!formData.name || !formData.email || !formData.whatsapp || !formData.password) {
        setError('Please fill in all fields');
        return;
      }
      setError('');
      setStep(2);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.address || !formData.country || !formData.province || !formData.city) {
        setError('Please fill in all address fields');
        return;
    }

    if (formData.country === 'Indonesia' && (!formData.district || !formData.subdistrict)) {
        setError('Please fill in all address fields');
        return;
    }

    setIsLoading(true);
    setError('');

    try {
      await api.post('/auth/register', formData);
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="glass-panel w-full max-w-md p-8">
        <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-[#7A4A88]">Register</h2>
            <p className="mt-2 text-sm text-gray-600">Create your account to get started</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 1 ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-600'} font-semibold text-sm`}>
                {step > 1 ? <Check size={16} /> : '1'}
            </div>
            <div className={`w-16 h-1 mx-2 rounded ${step >= 2 ? 'bg-purple-600' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 2 ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-600'} font-semibold text-sm`}>
                2
            </div>
        </div>

        {error && <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 text-sm rounded">{error}</div>}

        <form onSubmit={step === 1 ? handleNext : handleSubmit} className="space-y-6">
          {step === 1 ? (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  className="glass-input w-full"
                  placeholder="Enter your full name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="glass-input w-full"
                  placeholder="name@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number</label>
                <input
                  name="whatsapp"
                  type="text"
                  value={formData.whatsapp}
                  onChange={handleChange}
                  className="glass-input w-full"
                  placeholder="e.g. 08123456789"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="glass-input w-full"
                  placeholder="Create a strong password"
                  required
                />
              </div>
              
              <button
                type="submit"
                className="glass-button w-full flex items-center justify-center gap-2 mt-6"
              >
                Next Step <ArrowRight size={18} />
              </button>
            </div>
          ) : (
            <div className="space-y-4 animate-fadeIn">
               <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Address</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="glass-input w-full min-h-[80px]"
                  placeholder="Street name, house number, etc."
                  required
                />
              </div>
              
              {/* Country Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="glass-input w-full"
                  required
                >
                  <option value="">Select Country</option>
                  {countries.map((country) => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>

              {formData.country === 'Indonesia' ? (
                  // Indonesia Specific Fields (Dropdowns)
                  <>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Province</label>
                            <select
                                name="province"
                                value={selectedIds.province} // Use ID for value, but we store Name in formData
                                onChange={(e) => handleRegionChange('province', e)}
                                className="glass-input w-full"
                                required
                            >
                                <option value="">Select Province</option>
                                {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">City/Regency</label>
                            <select
                                name="city"
                                value={selectedIds.city}
                                onChange={(e) => handleRegionChange('city', e)}
                                className="glass-input w-full"
                                required
                                disabled={!selectedIds.province}
                            >
                                <option value="">Select City</option>
                                {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                            <select
                                name="district"
                                value={selectedIds.district}
                                onChange={(e) => handleRegionChange('district', e)}
                                className="glass-input w-full"
                                required
                                disabled={!selectedIds.city}
                            >
                                <option value="">Select District</option>
                                {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Sub-district</label>
                            <select
                                name="subdistrict"
                                onChange={(e) => handleRegionChange('subdistrict', e)}
                                className="glass-input w-full"
                                required
                                disabled={!selectedIds.district}
                            >
                                <option value="">Select Village</option>
                                {subdistricts.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                    </div>
                  </>
              ) : (
                  // Non-Indonesia Fields (Simple Inputs, hidden district/subdistrict)
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Province</label>
                        <input
                          name="province"
                          type="text"
                          value={formData.province}
                          onChange={handleChange}
                          className="glass-input w-full"
                          placeholder="Province"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">City/Regency</label>
                        <input
                          name="city"
                          type="text"
                          value={formData.city}
                          onChange={handleChange}
                          className="glass-input w-full"
                          placeholder="City"
                          required
                        />
                      </div>
                  </div>
              )}

              <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                  >
                    <ArrowLeft size={18} /> Back
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="glass-button flex-1 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Creating Account...' : 'Sign Up'}
                  </button>
              </div>
            </div>
          )}
        </form>
        
        <div className="mt-6 text-center text-sm">
          Already have an account? <Link to="/login" className="text-[#7A4A88] font-medium hover:text-purple-600 hover:underline">Login here</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
