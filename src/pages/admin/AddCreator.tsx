import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { Upload, Save, Crop, RotateCw, RotateCcw, Check, X } from 'lucide-react';
import Cropper, { ReactCropperElement } from 'react-cropper';
import 'cropperjs/dist/cropper.css';

const AddCreator = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  
  // Crop State
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [activeCropField, setActiveCropField] = useState<'ktp' | 'npwp' | null>(null);
  const cropperRef = useRef<ReactCropperElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    nik: '',
    birth_place: '',
    birth_date: '',
    address: '',
    religion: '',
    marital_status: '',
    occupation: '',
    nationality: '',
    bank_name: '',
    bank_account_name: '',
    bank_account_number: '',
    user_id: '',
    ktp_image: null as File | null,
    npwp_image: null as File | null
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [npwpPreviewUrl, setNpwpPreviewUrl] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    fetchUsers();
    if (id) {
      console.log('Editing Creator ID:', id); // Debug log
      fetchCreator(id);
    }
  }, [id]);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (error) {
      console.error('Failed to fetch users', error);
    }
  };

  const fetchCreator = async (creatorId: string) => {
    try {
      console.log('Fetching creator data for ID:', creatorId);
      const res = await api.get(`/creators/${creatorId}`);
      console.log('Fetched creator data:', res.data); // Debug log
      
      if (res.data) {
        const data = res.data;
        // Handle array response if backend returns array
        const creatorData = Array.isArray(data) ? data[0] : data;
        
        console.log('Processed Creator Data:', creatorData);

        setFormData({
          name: creatorData.name || '',
          nik: creatorData.nik || '',
          birth_place: creatorData.birth_place || '',
          birth_date: creatorData.birth_date ? creatorData.birth_date.split('T')[0] : '',
          address: creatorData.address || '',
          religion: creatorData.religion || '',
          marital_status: creatorData.marital_status || '',
          occupation: creatorData.occupation || '',
          nationality: creatorData.nationality || '',
          bank_name: creatorData.bank_name || '',
          bank_account_name: creatorData.bank_account_name || '',
          bank_account_number: creatorData.bank_account_number || '',
          user_id: creatorData.user_id || '',
          ktp_image: null,
          npwp_image: null
        });
        if (creatorData.ktp_path) setPreviewUrl(`http://localhost:5000/${creatorData.ktp_path}`);
        if (creatorData.npwp_path) setNpwpPreviewUrl(`http://localhost:5000/${creatorData.npwp_path}`);
      }
    } catch (error) {
      console.error("Failed to fetch creator", error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setCropImageSrc(reader.result as string);
        setActiveCropField('ktp');
        setCropModalOpen(true);
      };
      reader.readAsDataURL(file);
      // Reset input so same file can be selected again if needed
      e.target.value = '';
    }
  };

  const handleNpwpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = () => {
            setCropImageSrc(reader.result as string);
            setActiveCropField('npwp');
            setCropModalOpen(true);
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    }
  };

  const onCropConfirm = () => {
    const cropper = cropperRef.current?.cropper;
    if (typeof cropper !== "undefined") {
      cropper.getCroppedCanvas().toBlob(async (blob) => {
        if (blob) {
            const fieldName = activeCropField === 'ktp' ? 'ktp_cropped.jpg' : 'npwp_cropped.jpg';
            // Create a file from blob
            const file = new File([blob], fieldName, { type: "image/jpeg" });
            
            if (activeCropField === 'ktp') {
                setFormData({ ...formData, ktp_image: file });
                setPreviewUrl(URL.createObjectURL(blob));
            } else if (activeCropField === 'npwp') {
                setFormData({ ...formData, npwp_image: file });
                setNpwpPreviewUrl(URL.createObjectURL(blob));
            }
            
            setCropModalOpen(false);
            setActiveCropField(null);
        }
      }, 'image/jpeg');
    }
  };

  const handleRotate = (degree: number) => {
      const cropper = cropperRef.current?.cropper;
      if (cropper) {
          cropper.rotate(degree);
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
        if (key === 'ktp_image') {
            if (value) data.append('ktp', value);
        } else if (key === 'npwp_image') {
            if (value) data.append('npwp', value);
        } else {
            data.append(key, value as string);
        }
    });

    try {
      if (id) {
        // Handle update (might require different endpoint or method)
        await api.put(`/creators/${id}`, data);
      } else {
        await api.post('/creators', data);
      }
      navigate('/admin/creators');
    } catch (error: any) {
      console.error(error);
      alert('Failed to save creator');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel min-h-[calc(100vh-2rem)]">
      <div className="border-b border-white/30 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-800">{id ? 'Edit Creator' : 'Add New Creator'}</h1>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Upload Section */}
        <div className="md:col-span-1">
          <div className="glass-card p-4 text-center mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Upload KTP</h3>
            {previewUrl ? (
              <img src={previewUrl} alt="KTP Preview" className="w-full h-auto rounded mb-4" />
            ) : (
              <div className="h-40 flex flex-col items-center justify-center text-gray-400">
                <Upload size={40} className="mb-2" />
                <p>Click to Upload KTP</p>
              </div>
            )}
            
            <label className="block w-full">
              <span className="sr-only">Choose file</span>
              <input 
                type="file" 
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-purple-50 file:text-purple-700
                  hover:file:bg-purple-100"
              />
            </label>
          </div>

          <div className="glass-card p-4 text-center">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Upload NPWP</h3>
            {npwpPreviewUrl ? (
                <img src={npwpPreviewUrl} alt="NPWP Preview" className="w-full h-auto rounded mb-4" />
            ) : (
                <div className="h-40 flex flex-col items-center justify-center text-gray-400">
                <Upload size={40} className="mb-2" />
                <p>Click to Upload NPWP</p>
                </div>
            )}
            
            <label className="block w-full">
                <span className="sr-only">Choose file</span>
                <input 
                type="file" 
                accept="image/*"
                onChange={handleNpwpChange}
                className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-purple-50 file:text-purple-700
                    hover:file:bg-purple-100"
                />
            </label>
          </div>
        </div>

        {/* Form Section */}
        <div className="md:col-span-2 glass-panel p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">NIK</label>
              <input type="text" value={formData.nik} onChange={e => setFormData({...formData, nik: e.target.value})} className="mt-1 block glass-input" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Pemilik Akun User (Opsional)</label>
              <select 
                value={formData.user_id} 
                onChange={e => setFormData({...formData, user_id: e.target.value})} 
                className="mt-1 block w-full glass-input"
              >
                <option value="">Pilih User</option>
                {users.map((user: any) => (
                  <option key={user.id} value={user.id}>{user.name} ({user.email})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Nama</label>
              <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="mt-1 block glass-input" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Tempat Lahir</label>
                <input type="text" value={formData.birth_place} onChange={e => setFormData({...formData, birth_place: e.target.value})} className="mt-1 block glass-input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tanggal Lahir</label>
                <input type="date" value={formData.birth_date} onChange={e => setFormData({...formData, birth_date: e.target.value})} className="mt-1 block glass-input" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Alamat</label>
              <textarea value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="mt-1 block glass-input" rows={3}></textarea>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Agama</label>
                <select 
                  value={formData.religion} 
                  onChange={e => setFormData({...formData, religion: e.target.value})} 
                  className="mt-1 block w-full glass-input"
                >
                  <option value="">Pilih Agama</option>
                  <option value="ISLAM">Islam</option>
                  <option value="KRISTEN">Kristen</option>
                  <option value="KATOLIK">Katolik</option>
                  <option value="HINDU">Hindu</option>
                  <option value="BUDDHA">Buddha</option>
                  <option value="KONGHUCU">Konghucu</option>
                  <option value="LAINNYA">Lainnya</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status Perkawinan</label>
                <input type="text" value={formData.marital_status} onChange={e => setFormData({...formData, marital_status: e.target.value})} className="mt-1 block glass-input" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Pekerjaan</label>
                <input type="text" value={formData.occupation} onChange={e => setFormData({...formData, occupation: e.target.value})} className="mt-1 block glass-input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Kewarganegaraan</label>
                <select 
                  value={formData.nationality} 
                  onChange={e => setFormData({...formData, nationality: e.target.value})} 
                  className="mt-1 block w-full glass-input"
                >
                  <option value="">Pilih Kewarganegaraan</option>
                  <option value="WNI">WNI</option>
                  <option value="WNA">WNA</option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-800 mb-4">Data Rekening Bank</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nama Bank</label>
                        <input type="text" value={formData.bank_name} onChange={e => setFormData({...formData, bank_name: e.target.value})} className="mt-1 block glass-input" placeholder="Contoh: BCA, Mandiri" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nama Pemilik Rekening</label>
                            <input type="text" value={formData.bank_account_name} onChange={e => setFormData({...formData, bank_account_name: e.target.value})} className="mt-1 block glass-input" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">No. Rekening</label>
                            <input type="text" value={formData.bank_account_number} onChange={e => setFormData({...formData, bank_account_number: e.target.value})} className="mt-1 block glass-input" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-4">
              <button type="submit" disabled={loading} className="glass-button flex items-center disabled:opacity-50">
                {loading ? 'Saving...' : <><Save size={20} className="mr-2" /> Simpan Pencipta</>}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Crop Modal */}
      {cropModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <Crop className="mr-2" size={20} /> Crop & Rotate KTP
              </h3>
              <button onClick={() => setCropModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 bg-gray-900 p-4 overflow-hidden flex items-center justify-center">
              <Cropper
                ref={cropperRef}
                style={{ height: '100%', maxHeight: '60vh', width: '100%' }}
                initialAspectRatio={1.58} // KTP ratio roughly
                src={cropImageSrc || ''}
                viewMode={1}
                guides={true}
                minCropBoxHeight={10}
                minCropBoxWidth={10}
                background={false}
                responsive={true}
                autoCropArea={1}
                checkOrientation={false} 
              />
            </div>

            <div className="p-4 bg-gray-50 border-t flex flex-wrap gap-4 justify-between items-center">
              <div className="flex gap-2">
                  <button 
                      type="button"
                      onClick={() => handleRotate(-90)} 
                      className="flex items-center px-3 py-2 bg-white border border-gray-300 rounded hover:bg-gray-100 text-gray-700"
                      title="Rotate Left"
                  >
                      <RotateCcw size={18} className="mr-1" /> -90°
                  </button>
                  <button 
                      type="button"
                      onClick={() => handleRotate(90)} 
                      className="flex items-center px-3 py-2 bg-white border border-gray-300 rounded hover:bg-gray-100 text-gray-700"
                      title="Rotate Right"
                  >
                      <RotateCw size={18} className="mr-1" /> +90°
                  </button>
              </div>
              
              <div className="flex gap-2">
                  <button 
                      type="button"
                      onClick={() => setCropModalOpen(false)}
                      className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100"
                  >
                      Cancel
                  </button>
                  <button 
                      type="button"
                      onClick={onCropConfirm}
                      className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center shadow-sm"
                  >
                      <Check size={18} className="mr-2" /> Crop & Save
                  </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddCreator;