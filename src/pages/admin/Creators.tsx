import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Search, Plus, Eye, Edit, X, Download, Upload, Trash } from 'lucide-react';

const CreatorModal = ({ isOpen, onClose, creator }: { isOpen: boolean; onClose: () => void; creator: any }) => {
  const [songs, setSongs] = useState<any[]>([]);
  const [loadingSongs, setLoadingSongs] = useState(false);
  const [songSearchTerm, setSongSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (isOpen && creator) {
      fetchCreatorSongs();
      setSongSearchTerm('');
      setCurrentPage(1);
    } else {
        setSongs([]);
    }
  }, [isOpen, creator]);

  const fetchCreatorSongs = async () => {
    setLoadingSongs(true);
    try {
        const res = await api.get(`/songs?writer_name=${encodeURIComponent(creator.name)}`);
        setSongs(res.data);
    } catch (err) {
        console.error("Failed to fetch songs", err);
    } finally {
        setLoadingSongs(false);
    }
  };

  const filteredSongs = songs.filter(song => 
    song.title.toLowerCase().includes(songSearchTerm.toLowerCase()) ||
    (song.performer && song.performer.toLowerCase().includes(songSearchTerm.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredSongs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSongs = filteredSongs.slice(startIndex, startIndex + itemsPerPage);

  if (!isOpen || !creator) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">Detail Data Pencipta</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-red-500">
            <X size={24} />
          </button>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-700 mb-4 border-b pb-2">Informasi Pribadi</h3>
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-3 gap-2">
                    <span className="font-medium text-gray-500">Nama</span>
                    <span className="col-span-2 text-gray-900">: {creator.name}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                    <span className="font-medium text-gray-500">NIK</span>
                    <span className="col-span-2 text-gray-900">: {creator.nik || '-'}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                    <span className="font-medium text-gray-500">Tgl Lahir</span>
                    <span className="col-span-2 text-gray-900">: {creator.birth_date ? new Date(creator.birth_date).toLocaleDateString('id-ID') : '-'}</span>
                </div>
                 <div className="grid grid-cols-3 gap-2">
                    <span className="font-medium text-gray-500">Tempat Lahir</span>
                    <span className="col-span-2 text-gray-900">: {creator.birth_place || '-'}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                    <span className="font-medium text-gray-500">Alamat</span>
                    <span className="col-span-2 text-gray-900">: {creator.address || '-'}</span>
                </div>
                 <div className="grid grid-cols-3 gap-2">
                    <span className="font-medium text-gray-500">Agama</span>
                    <span className="col-span-2 text-gray-900">: {creator.religion || '-'}</span>
                </div>
                 <div className="grid grid-cols-3 gap-2">
                    <span className="font-medium text-gray-500">Pekerjaan</span>
                    <span className="col-span-2 text-gray-900">: {creator.occupation || '-'}</span>
                </div>
                 <div className="grid grid-cols-3 gap-2">
                    <span className="font-medium text-gray-500">Kewarganegaraan</span>
                    <span className="col-span-2 text-gray-900">: {creator.nationality || '-'}</span>
                </div>
              </div>

              <h3 className="font-semibold text-gray-700 mt-6 mb-4 border-b pb-2">Informasi Bank</h3>
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-3 gap-2">
                    <span className="font-medium text-gray-500">Nama Bank</span>
                    <span className="col-span-2 text-gray-900">: {creator.bank_name || '-'}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                    <span className="font-medium text-gray-500">No. Rekening</span>
                    <span className="col-span-2 text-gray-900">: {creator.bank_account_number || '-'}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                    <span className="font-medium text-gray-500">Nama Pemilik</span>
                    <span className="col-span-2 text-gray-900">: {creator.bank_account_name || '-'}</span>
                </div>
              </div>
            </div>
             <div>
                <h3 className="font-semibold text-gray-700 mb-4 border-b pb-2">Dokumen</h3>
                 <div className="space-y-4">
                    <div>
                        <p className="text-sm font-medium mb-1 text-gray-600">KTP</p>
                        {creator.ktp_path ? (
                            <div className="border rounded-lg overflow-hidden bg-gray-50">
                                <img src={`http://localhost:5000/${creator.ktp_path}`} alt="KTP" className="w-full h-auto object-contain max-h-64" />
                            </div>
                        ) : (
                            <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-sm">Tidak ada gambar KTP</div>
                        )}
                    </div>
                    <div>
                        <p className="text-sm font-medium mb-1 text-gray-600">NPWP</p>
                        {creator.npwp_path ? (
                            <div className="border rounded-lg overflow-hidden bg-gray-50">
                                <img src={`http://localhost:5000/${creator.npwp_path}`} alt="NPWP" className="w-full h-auto object-contain max-h-64" />
                            </div>
                        ) : (
                            <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-sm">Tidak ada gambar NPWP</div>
                        )}
                    </div>
                 </div>
            </div>
          </div>

          {/* Song List Section */}
          <div>
            <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h3 className="font-semibold text-gray-700">Daftar Lagu ({songs.length})</h3>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Cari lagu..."
                        className="pl-8 pr-3 py-1.5 text-sm border rounded-md focus:ring-purple-500 focus:border-purple-500"
                        value={songSearchTerm}
                        onChange={(e) => {
                            setSongSearchTerm(e.target.value);
                            setCurrentPage(1); // Reset to page 1 on search
                        }}
                    />
                    <Search className="absolute left-2.5 top-2 text-gray-400" size={14} />
                </div>
            </div>

            {loadingSongs ? (
                <div className="text-center py-4 text-gray-500">Memuat lagu...</div>
            ) : filteredSongs.length > 0 ? (
                <>
                    <div className="overflow-x-auto border rounded-lg mb-3">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Judul</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Artis</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Genre</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {paginatedSongs.map((song) => (
                                    <tr key={song.id}>
                                        <td className="px-4 py-2 text-sm text-gray-900">{song.title}</td>
                                        <td className="px-4 py-2 text-sm text-gray-500">{song.performer}</td>
                                        <td className="px-4 py-2 text-sm text-gray-500">{song.genre}</td>
                                        <td className="px-4 py-2 text-sm">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold uppercase
                                                ${song.status === 'accepted' ? 'bg-green-100 text-green-800' : 
                                                  song.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                                                  song.status === 'review' ? 'bg-orange-100 text-orange-800' :
                                                  'bg-yellow-100 text-yellow-800'}`}>
                                                {song.status || 'Pending'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex justify-between items-center text-sm">
                            <div className="text-gray-500">
                                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredSongs.length)} of {filteredSongs.length} entries
                            </div>
                            <div className="flex gap-1">
                                <button 
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`px-3 py-1 border rounded ${
                                            currentPage === page 
                                            ? 'bg-purple-600 text-white border-purple-600' 
                                            : 'hover:bg-gray-50'
                                        }`}
                                    >
                                        {page}
                                    </button>
                                ))}
                                <button 
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
                    {songs.length > 0 ? 'Tidak ada lagu yang cocok dengan pencarian.' : 'Tidak ada lagu yang ditemukan untuk pencipta ini.'}
                </div>
            )}
          </div>

        </div>
        <div className="p-6 border-t bg-gray-50 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 font-medium">Tutup</button>
        </div>
      </div>
    </div>
  );
};

const Creators = () => {
  const [creators, setCreators] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCreator, setSelectedCreator] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCreators();
  }, []);

  const fetchCreators = async () => {
    try {
      const res = await api.get('/creators');
      if (Array.isArray(res.data)) {
        setCreators(res.data);
      } else if (res.data && res.data.data) {
        setCreators(res.data.data);
      }
    } catch (error: any) {
      console.error(error);
      if (error.response && error.response.status === 401) {
          alert('Session expired. Please login again.');
      }
    }
  };

  const handleExport = async () => {
    try {
        const response = await api.get('/creators/export', {
            responseType: 'blob'
        });
        
        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'creators.xlsx');
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
    } catch (error) {
        console.error('Export failed', error);
        alert('Failed to export data');
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
        const res = await api.post('/creators/import', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        alert(res.data.message);
        if (res.data.errors) {
            console.warn('Import errors:', res.data.errors);
            alert(`Some rows failed to import. Check console for details.`);
        }
        fetchCreators();
    } catch (error) {
        console.error('Import failed', error);
        alert('Failed to import data');
    } finally {
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleView = (creator: any) => {
    setSelectedCreator(creator);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this creator?')) {
        try {
            await api.delete(`/creators/${id}`);
            fetchCreators();
        } catch (error) {
            console.error('Failed to delete creator', error);
            alert('Failed to delete creator');
        }
    }
  };

  const filteredCreators = creators.filter(c =>  
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.nik && c.nik.includes(searchTerm))
  );

  return (
    <div>
      <CreatorModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        creator={selectedCreator} 
      />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Data Pencipta</h1>
        <div className="flex gap-2">
            <button 
                onClick={handleExport}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
            >
                <Download size={20} className="mr-2" />
                Export Excel
            </button>
            <button 
                onClick={handleImportClick}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
                <Upload size={20} className="mr-2" />
                Import Excel
            </button>
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".xlsx, .xls" 
                onChange={handleFileChange} 
            />
            <Link to="/admin/creators/add" className="glass-button flex items-center">
                <Plus size={20} className="mr-2" />
                Add Pencipta
            </Link>
        </div>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User Pemilik</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NIK</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tgl Lahir</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alamat</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-transparent divide-y divide-gray-200/50">
              {filteredCreators.map((creator, index) => (
                <tr key={creator.id} className={index % 2 === 0 ? 'bg-white/50' : 'bg-white/30'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{creator.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {creator.user_name ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {creator.user_name}
                        </span>
                    ) : (
                        <span className="text-gray-400 italic">Unassigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{creator.nik || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {creator.birth_date ? new Date(creator.birth_date).toLocaleDateString('en-GB') : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-normal text-sm text-gray-500">{creator.address || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                        <button 
                            onClick={() => handleView(creator)}
                            className="text-purple-600 hover:text-purple-900 p-1 rounded-md hover:bg-purple-50 transition-colors" 
                            title="Lihat Data"
                        >
                            <Eye size={18} />
                        </button>
                        <Link 
                            to={`/admin/creators/edit/${creator.id}`} 
                            className="text-blue-600 hover:text-blue-900 p-1 rounded-md hover:bg-blue-50 transition-colors"
                            title="Edit Data"
                        >
                            <Edit size={18} />
                        </Link>
                        <button 
                            onClick={() => handleDelete(creator.id)} 
                            className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50 transition-colors"
                            title="Delete Data"
                        >
                            <Trash size={18} />
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredCreators.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">No creators found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Creators;