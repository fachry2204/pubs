import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Search, Eye, X, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

const UserSongs = () => {
  const [songs, setSongs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSong, setSelectedSong] = useState<any | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  useEffect(() => {
    fetchSongs();
  }, []);

  const fetchSongs = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/songs');
      // The backend filters songs by user_id for non-admin users
      if (Array.isArray(res.data)) {
        setSongs(res.data);
      } else if (res.data && res.data.data) {
        setSongs(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch songs', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSongs = songs.filter(song => 
    song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (song.performer && song.performer.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredSongs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSongs = filteredSongs.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Data Lagu Saya</h1>
        <div className="flex gap-2">
          <Link 
            to="/user/songs/create"
            className="glass-button flex items-center"
          >
            <Plus size={20} className="mr-2" />
            Tambah Lagu
          </Link>
        </div>
      </div>

      <div className="glass-panel">
        <div className="p-4 border-b border-white/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1">
                <input
                    type="text"
                    placeholder="Cari lagu..."
                    className="glass-input pl-10 w-full"
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                    }}
                />
                <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
            </div>
            <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Show:</span>
                <select
                    value={itemsPerPage}
                    onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                    }}
                    className="glass-input py-1 px-2 text-sm w-20"
                >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                </select>
            </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200/50">
            <thead className="bg-purple-50/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Judul</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Artis</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pencipta</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-transparent divide-y divide-gray-200/50">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">Loading...</td>
                </tr>
              ) : paginatedSongs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">Tidak ada lagu ditemukan</td>
                </tr>
              ) : (
                paginatedSongs.map((song, index) => (
                  <tr key={song.id} className={index % 2 === 0 ? 'bg-white/50' : 'bg-white/30'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{song.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{song.performer || '-'}</td>
                    <td className="px-6 py-4 whitespace-normal text-sm text-gray-500">
                      {song.writers && song.writers.length > 0 
                        ? song.writers.map((w: any) => w.name).join(', ') 
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full uppercase
                          ${(song.status || 'pending') === 'accepted' ? 'bg-green-100 text-green-800' : 
                            (song.status || 'pending') === 'review' ? 'bg-yellow-100 text-yellow-800' : 
                            (song.status || 'pending') === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-orange-100 text-orange-800'}`}>
                        {song.status || 'pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                          <button 
                              className="text-purple-600 hover:text-purple-900 p-1 rounded-md hover:bg-purple-50 transition-colors" 
                              title="Lihat Detail"
                              onClick={() => setSelectedSong(song)}
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
        
        {/* Pagination */}
        {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-white/30 flex items-center justify-between bg-white/20">
                <div className="text-sm text-gray-600">
                    Showing <span className="font-medium">{startIndex + 1}</span> to <span className="font-medium">{Math.min(startIndex + itemsPerPage, filteredSongs.length)}</span> of <span className="font-medium">{filteredSongs.length}</span> results
                </div>
                <div className="flex gap-1">
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 border border-gray-300 rounded-md bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Previous
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(page => (
                        <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-3 py-1 border rounded-md ${
                                currentPage === page
                                ? 'bg-purple-600 text-white border-purple-600'
                                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                            }`}
                        >
                            {page}
                        </button>
                    ))}
                    <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 border border-gray-300 rounded-md bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Next
                    </button>
                </div>
            </div>
        )}
      </div>

      {/* Song Detail Modal */}
      {selectedSong && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-gray-800">Detail Lagu</h2>
              <button 
                onClick={() => setSelectedSong(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Song Info */}
              <div>
                <h3 className="text-sm font-semibold text-purple-600 uppercase tracking-wider mb-4">Informasi Lagu</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="text-xs text-gray-500 block mb-1">Judul Lagu</label>
                    <p className="text-lg font-bold text-gray-800">{selectedSong.title}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Artis / Performer</label>
                    <p className="font-medium text-gray-800">{selectedSong.performer || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Status</label>
                    <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full uppercase
                          ${(selectedSong.status || 'pending') === 'accepted' ? 'bg-green-100 text-green-800' : 
                            (selectedSong.status || 'pending') === 'review' ? 'bg-yellow-100 text-yellow-800' : 
                            (selectedSong.status || 'pending') === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-orange-100 text-orange-800'}`}>
                        {selectedSong.status || 'pending'}
                    </span>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">ISRC</label>
                    <p className="font-medium text-gray-800 font-mono">{selectedSong.isrc || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">ISWC</label>
                    <p className="font-medium text-gray-800 font-mono">{selectedSong.iswc || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Genre</label>
                    <p className="font-medium text-gray-800">{selectedSong.genre || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Bahasa</label>
                    <p className="font-medium text-gray-800">{selectedSong.language || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Writers Info */}
              <div className="border-t border-gray-100 pt-6">
                <h3 className="text-sm font-semibold text-purple-600 uppercase tracking-wider mb-4">Pencipta (Writer/Composer)</h3>
                
                {selectedSong.writers && selectedSong.writers.length > 0 ? (
                  <div className="overflow-hidden border border-gray-200 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Peran</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Share (%)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {selectedSong.writers.map((w: any, idx: number) => (
                          <tr key={idx}>
                            <td className="px-4 py-2 text-sm text-gray-900">{w.name}</td>
                            <td className="px-4 py-2 text-sm text-gray-500">{w.role}</td>
                            <td className="px-4 py-2 text-sm text-gray-900 text-right">{w.share_percent}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">Tidak ada data pencipta</p>
                )}
              </div>
              
              {/* Additional Info */}
              {selectedSong.note && (
                <div className="border-t border-gray-100 pt-6">
                    <h3 className="text-sm font-semibold text-purple-600 uppercase tracking-wider mb-2">Catatan</h3>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedSong.note}</p>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-end">
              <button
                onClick={() => setSelectedSong(null)}
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

export default UserSongs;
