import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Search, Eye, X } from 'lucide-react';

const UserCreators = () => {
  const [creators, setCreators] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCreator, setSelectedCreator] = useState<any | null>(null);

  useEffect(() => {
    fetchCreators();
  }, []);

  const fetchCreators = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/creators');
      // The backend already filters by user_id for non-admin users
      if (Array.isArray(res.data)) {
        setCreators(res.data);
      } else if (res.data && res.data.data) {
        setCreators(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch creators', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCreators = creators.filter(c =>  
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.nik && c.nik.includes(searchTerm))
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Data Pencipta Saya</h1>
      </div>

      <div className="glass-panel">
        <div className="p-4 border-b border-white/30">
            <div className="relative">
                <input
                    type="text"
                    placeholder="Cari nama atau NIK..."
                    className="glass-input pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
            </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200/50">
            <thead className="bg-purple-50/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NIK</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tgl Lahir</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alamat</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-transparent divide-y divide-gray-200/50">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">Loading...</td>
                </tr>
              ) : filteredCreators.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">No creators found</td>
                </tr>
              ) : (
                filteredCreators.map((creator, index) => (
                  <tr key={creator.id} className={index % 2 === 0 ? 'bg-white/50' : 'bg-white/30'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{creator.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{creator.nik || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {creator.birth_date ? new Date(creator.birth_date).toLocaleDateString('en-GB') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-normal text-sm text-gray-500">{creator.address || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                          <button 
                              className="text-purple-600 hover:text-purple-900 p-1 rounded-md hover:bg-purple-50 transition-colors" 
                              title="Lihat Data"
                              onClick={() => setSelectedCreator(creator)}
                          >
                              <Eye size={18} />
                          </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedCreator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-gray-800">Detail Pencipta</h2>
              <button 
                onClick={() => setSelectedCreator(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Personal Info */}
              <div>
                <h3 className="text-sm font-semibold text-purple-600 uppercase tracking-wider mb-4">Informasi Pribadi</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Nama Lengkap</label>
                    <p className="font-medium text-gray-800">{selectedCreator.name}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">NIK</label>
                    <p className="font-medium text-gray-800">{selectedCreator.nik || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Tempat, Tanggal Lahir</label>
                    <p className="font-medium text-gray-800">
                      {selectedCreator.birth_place ? `${selectedCreator.birth_place}, ` : ''}
                      {selectedCreator.birth_date ? new Date(selectedCreator.birth_date).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'long', year: 'numeric'
                      }) : '-'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Kewarganegaraan</label>
                    <p className="font-medium text-gray-800">{selectedCreator.nationality || 'WNI'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Agama</label>
                    <p className="font-medium text-gray-800">{selectedCreator.religion || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Status Perkawinan</label>
                    <p className="font-medium text-gray-800">{selectedCreator.marital_status || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Pekerjaan</label>
                    <p className="font-medium text-gray-800">{selectedCreator.occupation || '-'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs text-gray-500 block mb-1">Alamat</label>
                    <p className="font-medium text-gray-800">{selectedCreator.address || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Bank Info */}
              <div className="border-t border-gray-100 pt-6">
                <h3 className="text-sm font-semibold text-purple-600 uppercase tracking-wider mb-4">Informasi Bank</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Nama Bank</label>
                    <p className="font-medium text-gray-800">{selectedCreator.bank_name || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Nomor Rekening</label>
                    <p className="font-medium text-gray-800">{selectedCreator.bank_account_number || '-'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs text-gray-500 block mb-1">Nama Pemilik Rekening</label>
                    <p className="font-medium text-gray-800">{selectedCreator.bank_account_name || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Documents */}
              {(selectedCreator.ktp_path || selectedCreator.npwp_path) && (
                <div className="border-t border-gray-100 pt-6">
                  <h3 className="text-sm font-semibold text-purple-600 uppercase tracking-wider mb-4">Dokumen</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {selectedCreator.ktp_path && (
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">File KTP</label>
                        <a 
                          href={`${import.meta.env.VITE_API_URL}${selectedCreator.ktp_path}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-purple-600 hover:underline flex items-center gap-1"
                        >
                          Lihat KTP
                        </a>
                      </div>
                    )}
                    {selectedCreator.npwp_path && (
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">File NPWP</label>
                        <a 
                          href={`${import.meta.env.VITE_API_URL}${selectedCreator.npwp_path}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-purple-600 hover:underline flex items-center gap-1"
                        >
                          Lihat NPWP
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-end">
              <button
                onClick={() => setSelectedCreator(null)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserCreators;
