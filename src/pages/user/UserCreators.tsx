import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Search, Eye } from 'lucide-react';

const UserCreators = () => {
  const [creators, setCreators] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

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
    </div>
  );
};

export default UserCreators;
