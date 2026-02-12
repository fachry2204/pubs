import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Plus, Edit, Trash, Search, Eye, X, Save, AlertCircle, FileText, FileCheck, FileBadge, Download, Upload } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const SongList = () => {
  const { user } = useAuth();
  const [songs, setSongs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Modal State
  const [selectedSong, setSelectedSong] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editStatus, setEditStatus] = useState('');
  const [editCustomId, setEditCustomId] = useState('');
  const [editRejectionReason, setEditRejectionReason] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSongs();
  }, []);

  const fetchSongs = async () => {
    try {
      const res = await api.get('/songs');
      if (Array.isArray(res.data)) {
        setSongs(res.data);
      } else if (res.data && res.data.data) {
        setSongs(res.data.data);
      }
    } catch (error: any) {
      console.error(error);
      if (error.response && error.response.status === 401) {
          alert('Session expired. Please login again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    try {
        const response = await api.get('/songs/export', {
            responseType: 'blob'
        });
        
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'songs.xlsx');
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
        const res = await api.post('/songs/import', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        alert(res.data.message);
        if (res.data.errors) {
            console.warn('Import errors:', res.data.errors);
            alert(`Some rows failed to import. Check console for details.`);
        }
        fetchSongs();
    } catch (error: any) {
        console.error('Import failed', error);
        const errorMsg = error.response?.data?.message || error.message || 'Failed to import data';
        const details = error.response?.data?.error || '';
        alert(`${errorMsg}\n${details}`);
    } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this song?')) {
      try {
        await api.delete(`/songs/${id}`);
        fetchSongs();
      } catch (error) {
        console.error(error);
      }
    }
  };

  const handleView = (song: any) => {
    setSelectedSong(song);
    setEditStatus(song.status || 'pending');
    setEditCustomId(song.song_id || '');
    setEditRejectionReason(song.rejection_reason || '');
    setIsModalOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (editStatus === 'accepted' && !editCustomId.trim()) {
      alert('Custom ID (Identitas Lagu) wajib diisi jika status Diterima.');
      return;
    }

    if (editStatus === 'rejected' && !editRejectionReason.trim()) {
      alert('Alasan penolakan wajib diisi jika status Ditolak.');
      return;
    }

    setIsSaving(true);
    try {
      await api.put(`/songs/${selectedSong.id}`, {
        status: editStatus,
        song_id: editCustomId,
        rejection_reason: editRejectionReason
      });
      setIsModalOpen(false);
      fetchSongs();
    } catch (error) {
      console.error(error);
      alert('Failed to update song status');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredSongs = songs.filter(song => 
    song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    song.song_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredSongs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSongs = filteredSongs.slice(startIndex, startIndex + itemsPerPage);

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Data Lagu</h1>
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
            <Link 
            to="/admin/songs/create"
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
                    placeholder="Search songs..."
                    className="glass-input pl-10 w-full"
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1); // Reset to page 1 on search
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
                    <option value={100}>100</option>
                </select>
            </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200/50">
            <thead className="bg-purple-50/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Song ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pencipta</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-transparent divide-y divide-gray-200/50">
              {paginatedSongs.map((song, index) => (
                <tr key={song.id} className={index % 2 === 0 ? 'bg-white/50' : 'bg-white/30'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{song.song_id || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{song.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{song.performer || '-'}</td>
                  <td className="px-6 py-4 whitespace-normal text-sm text-gray-500">
                    {song.writers && song.writers.length > 0 
                      ? song.writers.map((w: any) => w.name).join(', ') 
                      : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{song.user_name}</td>
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
                            onClick={() => handleView(song)}
                            className="text-purple-600 hover:text-purple-900 p-1 rounded-md hover:bg-purple-50 transition-colors" 
                            title="View Details"
                        >
                            <Eye size={18} />
                        </button>
                        <Link 
                            to={`/admin/songs/edit/${song.id}`} 
                            className="text-blue-600 hover:text-blue-900 p-1 rounded-md hover:bg-blue-50 transition-colors" 
                            title="Edit"
                        >
                            <Edit size={18} />
                        </Link>
                        <button 
                            onClick={() => handleDelete(song.id)} 
                            className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50 transition-colors" 
                            title="Delete"
                        >
                            <Trash size={18} />
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedSongs.length === 0 && (
                  <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-gray-500">No songs found</td>
                  </tr>
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
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        // Logic to show pages around current page
                        let pageNum = i + 1;
                        if (totalPages > 5) {
                            if (currentPage > 3) {
                                pageNum = currentPage - 2 + i;
                            } 
                            if (pageNum > totalPages) {
                                pageNum = totalPages - (4 - i);
                            }
                        }
                        
                        return (
                            <button
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                className={`px-3 py-1 border rounded-md ${
                                    currentPage === pageNum
                                    ? 'bg-purple-600 text-white border-purple-600'
                                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                {pageNum}
                            </button>
                        );
                    })}
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

      {/* Detail Modal */}
      {isModalOpen && selectedSong && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
              <h2 className="text-xl font-bold text-gray-800">Detail Lagu</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Song Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Judul Lagu</label>
                  <p className="text-lg font-medium text-gray-900">{selectedSong.title}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Artis / Performer</label>
                  <p className="text-lg font-medium text-gray-900">{selectedSong.performer || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">User Pengupload</label>
                  <p className="text-gray-700">{selectedSong.user_name}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Status Saat Ini</label>
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full mt-1
                    ${(selectedSong.status || 'pending') === 'accepted' ? 'bg-green-100 text-green-800' : 
                      (selectedSong.status || 'pending') === 'review' ? 'bg-yellow-100 text-yellow-800' : 
                      (selectedSong.status || 'pending') === 'pending' ? 'bg-orange-100 text-orange-800' : 
                      'bg-red-100 text-red-800'}`}>
                    {selectedSong.status || 'pending'}
                  </span>
                </div>
                {selectedSong.status === 'rejected' && selectedSong.rejection_reason && (
                <div className="col-span-1 md:col-span-2 bg-red-50 p-3 rounded-lg border border-red-100 mt-2">
                    <label className="text-xs font-semibold text-red-800 uppercase flex items-center mb-1">
                        <AlertCircle size={14} className="mr-1" />
                        Alasan Penolakan
                    </label>
                    <p className="text-red-900 text-sm">{selectedSong.rejection_reason}</p>
                </div>
                )}
                <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">Custom ID (Identitas)</label>
                    <p className="text-gray-900 font-mono">{selectedSong.song_id || '-'}</p>
                </div>
                <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">ISWC / ISRC</label>
                    <p className="text-sm text-gray-600">ISWC: {selectedSong.iswc || '-'}</p>
                    <p className="text-sm text-gray-600">ISRC: {selectedSong.isrc || '-'}</p>
                </div>
              </div>

              {/* Writers Section */}
              <div>
                <h3 className="text-md font-bold text-gray-800 mb-3 border-b pb-2">Writers / Pencipta</h3>
                <div className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Share (%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedSong.writers && selectedSong.writers.map((writer: any, idx: number) => (
                        <tr key={idx}>
                          <td className="px-4 py-2 text-sm text-gray-900">{writer.name}</td>
                          <td className="px-4 py-2 text-sm text-gray-600">{writer.role || '-'}</td>
                          <td className="px-4 py-2 text-sm text-gray-900 text-right">{parseFloat(writer.share_percent)}%</td>
                        </tr>
                      ))}
                      {(!selectedSong.writers || selectedSong.writers.length === 0) && (
                        <tr>
                          <td colSpan={3} className="px-4 py-2 text-sm text-gray-500 text-center">No writers data</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Admin Actions */}
              {user?.role === 'admin' && (
                <div className="bg-purple-50 p-6 rounded-xl border border-purple-100 mt-6">
                  
                  {/* Document Generation (Only visible if status is Review or generally available) */}
                  <div className="mb-6 pb-6 border-b border-purple-200">
                    <h4 className="text-sm font-bold text-purple-800 mb-3 uppercase tracking-wide flex items-center">
                        <FileText size={16} className="mr-2" />
                        Generate Dokumen
                    </h4>
                    <div className="flex flex-wrap gap-3">
                        <button 
                            onClick={() => alert('Fitur Generate Kontrak akan segera hadir!')}
                            className="flex items-center px-3 py-2 bg-white text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-100 hover:border-purple-300 transition-all text-sm font-medium shadow-sm"
                            title="Generate Kontrak"
                        >
                            <FileText size={16} className="mr-2" />
                            Generate Kontrak
                        </button>
                        <button 
                            onClick={() => alert('Fitur Generate SKP akan segera hadir!')}
                            className="flex items-center px-3 py-2 bg-white text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-100 hover:border-purple-300 transition-all text-sm font-medium shadow-sm"
                            title="Generate SKP"
                        >
                            <FileCheck size={16} className="mr-2" />
                            Generate SKP
                        </button>
                        <button 
                            onClick={() => alert('Fitur Generate IPL akan segera hadir!')}
                            className="flex items-center px-3 py-2 bg-white text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-100 hover:border-purple-300 transition-all text-sm font-medium shadow-sm"
                            title="Generate IPL"
                        >
                            <FileBadge size={16} className="mr-2" />
                            Generate IPL
                        </button>
                    </div>
                  </div>

                  <h3 className="text-md font-bold text-purple-800 mb-4 flex items-center">
                    <Edit size={18} className="mr-2" />
                    Update Status (Admin/Operator)
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value)}
                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 p-2.5 border"
                      >
                        <option value="pending">Pending</option>
                        <option value="review">Review</option>
                        <option value="accepted">Diterima (Accepted)</option>
                        <option value="rejected">Ditolak (Rejected)</option>
                      </select>
                    </div>
                    
                    {editStatus === 'accepted' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Custom ID <span className="text-red-500 ml-1">*Required</span>
                      </label>
                      <input
                        type="text"
                        value={editCustomId}
                        onChange={(e) => setEditCustomId(e.target.value)}
                        placeholder="Masukkan Custom ID Lagu"
                        className={`w-full rounded-lg shadow-sm p-2.5 border ${
                            !editCustomId 
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500 bg-red-50' 
                            : 'border-gray-300 focus:border-purple-500 focus:ring-purple-500'
                        }`}
                      />
                      {!editCustomId && (
                        <p className="text-red-500 text-xs mt-1 flex items-center">
                            <AlertCircle size={12} className="mr-1" />
                            Wajib diisi saat status Diterima
                        </p>
                      )}
                    </div>
                    )}

                    {editStatus === 'rejected' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Alasan Penolakan <span className="text-red-500 ml-1">*Required</span>
                      </label>
                      <textarea
                        value={editRejectionReason}
                        onChange={(e) => setEditRejectionReason(e.target.value)}
                        placeholder="Masukkan alasan penolakan..."
                        rows={1}
                        className={`w-full rounded-lg shadow-sm p-2.5 border ${
                            !editRejectionReason 
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500 bg-red-50' 
                            : 'border-gray-300 focus:border-purple-500 focus:ring-purple-500'
                        }`}
                      />
                       {!editRejectionReason && (
                        <p className="text-red-500 text-xs mt-1 flex items-center">
                            <AlertCircle size={12} className="mr-1" />
                            Wajib diisi saat status Ditolak
                        </p>
                      )}
                    </div>
                    )}
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={handleUpdateStatus}
                      disabled={isSaving || (editStatus === 'accepted' && !editCustomId) || (editStatus === 'rejected' && !editRejectionReason)}
                      className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save size={18} className="mr-2" />
                      {isSaving ? 'Saving...' : 'Simpan Perubahan'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SongList;
