import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { Trash2, AlertTriangle, X, Search, User } from 'lucide-react';

interface Writer {
  name: string;
  role: string;
  share_percent: number;
}

const GENRE_OPTIONS = [
    'Pop', 'Rock', 'Jazz', 'Blues', 'Hip Hop', 'R&B', 'Country', 'Folk', 
    'Classical', 'Electronic', 'Reggae', 'Soul', 'Funk', 'Disco', 'Techno', 
    'House', 'Trance', 'Dubstep', 'Metal', 'Punk', 'Indie', 'Alternative', 
    'Gospel', 'Latin', 'K-Pop', 'J-Pop', 'Dangdut', 'Keroncong', 'Campursari'
].sort();

const COUNTRY_OPTIONS = [
    'Indonesia', 'Malaysia', 'Singapore', 'Thailand', 'Vietnam', 'Philippines', 
    'United States', 'United Kingdom', 'Australia', 'Japan', 'South Korea', 
    'China', 'India', 'Canada', 'Germany', 'France', 'Italy', 'Spain', 
    'Netherlands', 'Brazil', 'Argentina', 'Mexico'
].sort();

const CreateSong = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  // Form State
  const [title, setTitle] = useState('');
  const [otherTitle, setOtherTitle] = useState('');
  const [performer, setPerformer] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [durationSeconds, setDurationSeconds] = useState('');
  const [genre, setGenre] = useState('');
  const [language, setLanguage] = useState('');
  const [region, setRegion] = useState('');
  const [iswc, setIswc] = useState('');
  const [isrc, setIsrc] = useState('');
  const [note, setNote] = useState('');
  const [lyricsFile, setLyricsFile] = useState<File | null>(null);

  const [rights] = useState({
    synchronization: true,
    mechanical: true,
    performing: true,
    print_right: true
  });

  const [writers, setWriters] = useState<Writer[]>([
    { name: '', role: 'Author & Composer', share_percent: 0 }
  ]);
  
  const [creatorsList, setCreatorsList] = useState<any[]>([]);

  // Warning Modal State
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState<string[]>([]);
  
  // Creator Selection Modal State
  const [showCreatorModal, setShowCreatorModal] = useState(false);
  const [activeWriterIndex, setActiveWriterIndex] = useState<number | null>(null);
  const [creatorSearchTerm, setCreatorSearchTerm] = useState('');

  useEffect(() => {
    fetchCreators();
    if (id) {
        fetchSong(id);
    }
  }, [id]);

  const fetchSong = async (songId: string) => {
    try {
        const res = await api.get(`/songs/${songId}`);
        const song = res.data;
        
        setTitle(song.title);
        setOtherTitle(song.other_title || '');
        setPerformer(song.performer);
        
        // Duration
        const totalSeconds = parseInt(song.duration);
        setDurationMinutes(Math.floor(totalSeconds / 60).toString());
        setDurationSeconds((totalSeconds % 60).toString());
        
        setGenre(song.genre);
        setLanguage(song.language);
        setRegion(song.region);
        setIswc(song.iswc || '');
        setIsrc(song.isrc || '');
        setNote(song.note || '');
        
        // Writers
        if (song.writers && song.writers.length > 0) {
            setWriters(song.writers.map((w: any) => ({
                name: w.name,
                role: w.role || 'Author & Composer',
                share_percent: parseFloat(w.share_percent)
            })));
        }

        // Rights (if stored as JSON string)
        if (song.authorized_rights) {
            try {
                // Just to verify it parses, though we don't use it yet as rights are fixed in UI
                if (typeof song.authorized_rights === 'string') {
                    JSON.parse(song.authorized_rights);
                }
            } catch (e) {
                console.error("Failed to parse rights", e);
            }
        }

    } catch (error) {
        console.error("Failed to fetch song", error);
        alert("Failed to fetch song details");
    }
  };

  const fetchCreators = async () => {
    try {
        const response = await api.get('/creators'); 
        if (Array.isArray(response.data)) {
            setCreatorsList(response.data);
        } else if (response.data && response.data.data) {
            setCreatorsList(response.data.data);
        }
    } catch (error) {
        console.error('Failed to fetch creators', error);
    }
  };

  const addWriter = () => {
    setWriters([...writers, { name: '', role: 'Author & Composer', share_percent: 0 }]);
  };

  const removeWriter = (index: number) => {
    const newWriters = writers.filter((_, i) => i !== index);
    setWriters(newWriters);
  };

  const handleWriterChange = (index: number, field: keyof Writer, value: any) => {
    const newWriters = [...writers];
    newWriters[index] = { ...newWriters[index], [field]: value };
    setWriters(newWriters);
  };

  const openCreatorModal = (index: number) => {
    setActiveWriterIndex(index);
    setCreatorSearchTerm('');
    setShowCreatorModal(true);
  };

  const selectCreator = (creator: any) => {
    if (activeWriterIndex !== null) {
        handleWriterChange(activeWriterIndex, 'name', creator.name);
        setShowCreatorModal(false);
        setActiveWriterIndex(null);
    }
  };

  const filteredCreators = creatorsList.filter(creator => 
    creator.name.toLowerCase().includes(creatorSearchTerm.toLowerCase())
  );

  const totalShare = writers.reduce((sum, w) => sum + Number(w.share_percent || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const missingFields = [];
    if (!title.trim()) missingFields.push('Judul Lagu');
    if (!performer.trim()) missingFields.push('Artis / Performer');
    if (!genre) missingFields.push('Genre');
    if (!language) missingFields.push('Bahasa/Negara');
    if (!region) missingFields.push('Region');
    if (!durationMinutes && !durationSeconds) missingFields.push('Durasi');

    const totalShare = writers.reduce((sum, w) => sum + Number(w.share_percent || 0), 0);
    if (totalShare !== 100) {
        missingFields.push(`Total Share Penulis (Saat ini: ${totalShare}%, Wajib: 100%)`);
    }

    // Check if writers names are filled
    const emptyWriters = writers.some(w => !w.name.trim());
    if (emptyWriters) {
        missingFields.push('Nama Penulis (Semua baris penulis wajib diisi)');
    }

    if (missingFields.length > 0) {
        setWarningMessage(missingFields);
        setShowWarning(true);
        return;
    }

    // Calculate duration in seconds
    const totalSeconds = (parseInt(durationMinutes || '0') * 60) + parseInt(durationSeconds || '0');
    
    // Prepare Rights String (JSON)
    const authorizedRights = JSON.stringify(rights);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('other_title', otherTitle);
    formData.append('performer', performer);
    formData.append('duration', totalSeconds.toString());
    formData.append('genre', genre);
    formData.append('language', language);
    formData.append('region', region);
    formData.append('iswc', iswc);
    formData.append('isrc', isrc);
    formData.append('note', note);
    formData.append('authorized_rights', authorizedRights);
    formData.append('writers', JSON.stringify(writers));

    if (lyricsFile) {
        formData.append('lyrics', lyricsFile);
    }

    try {
      if (id) {
        await api.put(`/songs/${id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await api.post('/songs', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      navigate('/admin/songs');
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || 'Failed to create song');
    }
  };

  return (
    <div className="bg-white/60 backdrop-blur-md rounded-lg shadow-xl border border-white/40 min-h-[calc(100vh-2rem)]">
      <div className="border-b border-white/30 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-800">{id ? 'Edit Song' : 'Add New Song'}</h1>
      </div>

      {/* Creator Selection Modal */}
      {showCreatorModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="bg-purple-50 px-6 py-4 border-b border-purple-100 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-purple-800 flex items-center">
                        <User className="mr-2" size={20} />
                        Pilih Pencipta (Writer)
                    </h3>
                    <button 
                        onClick={() => setShowCreatorModal(false)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>
                
                <div className="p-4 border-b border-gray-100 bg-gray-50">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Cari nama pencipta..."
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            value={creatorSearchTerm}
                            onChange={(e) => setCreatorSearchTerm(e.target.value)}
                            autoFocus
                        />
                    </div>
                </div>

                <div className="max-h-[300px] overflow-y-auto p-2">
                    {filteredCreators.length > 0 ? (
                        <div className="grid grid-cols-1 gap-1">
                            {filteredCreators.map((creator) => (
                                <button
                                    key={creator.id}
                                    onClick={() => selectCreator(creator)}
                                    className="flex items-center w-full px-4 py-3 text-left hover:bg-purple-50 rounded-lg transition-colors group"
                                >
                                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold mr-3 group-hover:bg-purple-200">
                                        {creator.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-800">{creator.name}</p>
                                        <p className="text-xs text-gray-500">{creator.role || 'Writer'}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <p>Tidak ada pencipta ditemukan.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}

      {/* Warning Modal */}
      {showWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-red-50 px-6 py-4 border-b border-red-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-red-800 flex items-center">
                <AlertTriangle className="mr-2" size={20} />
                Data Belum Lengkap
              </h3>
              <button 
                onClick={() => setShowWarning(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-gray-700 mb-4">Mohon lengkapi data berikut sebelum menyimpan:</p>
              <ul className="space-y-2">
                {warningMessage.map((msg, idx) => (
                  <li key={idx} className="flex items-start text-sm text-red-600 bg-red-50 p-2 rounded border border-red-100">
                    <span className="mr-2">•</span>
                    {msg}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="px-6 py-4 bg-gray-50 border-t flex justify-end">
              <button 
                onClick={() => setShowWarning(false)}
                className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
              >
                Saya Mengerti
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
              <input
                type="text"
                className="glass-input"
                value={title}
                onChange={(e) => setTitle(e.target.value.toUpperCase())}
                required
              />
            </div>

            {/* Other Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Other title</label>
              <input
                type="text"
                className="glass-input"
                value={otherTitle}
                onChange={(e) => setOtherTitle(e.target.value)}
              />
            </div>

            {/* Authorized Rights */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Authorized Rights</label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" checked={true} disabled className="rounded text-[#7A4A88] focus:ring-[#7A4A88]" />
                    <span className="text-sm text-gray-600">Synchronization</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" checked={true} disabled className="rounded text-[#7A4A88] focus:ring-[#7A4A88]" />
                    <span className="text-sm text-gray-600">Mechanical</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" checked={true} disabled className="rounded text-[#7A4A88] focus:ring-[#7A4A88]" />
                    <span className="text-sm text-gray-600">Performing</span>
                  </label>
                </div>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" checked={true} disabled className="rounded text-[#7A4A88] focus:ring-[#7A4A88]" />
                    <span className="text-sm text-gray-600">Print right</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Performer & Duration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Performer <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  className="glass-input"
                  value={performer}
                  onChange={(e) => setPerformer(e.target.value.toUpperCase())}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration <span className="text-red-500">*</span></label>
                <div className="flex items-center space-x-2">
                    <div className="relative flex-1">
                        <input
                            type="number"
                            placeholder="Min"
                            className="glass-input pr-8"
                            value={durationMinutes}
                            onChange={(e) => setDurationMinutes(e.target.value)}
                            min="0"
                            required
                        />
                        <span className="absolute right-3 top-2.5 text-gray-400 text-xs">m</span>
                    </div>
                    <span className="text-gray-400">:</span>
                    <div className="relative flex-1">
                        <input
                            type="number"
                            placeholder="Sec"
                            className="glass-input pr-8"
                            value={durationSeconds}
                            onChange={(e) => setDurationSeconds(e.target.value)}
                            min="0"
                            max="59"
                            required
                        />
                        <span className="absolute right-3 top-2.5 text-gray-400 text-xs">s</span>
                    </div>
                </div>
              </div>
            </div>

            {/* Genre, Language, Region */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Genre <span className="text-red-500">*</span></label>
                <select
                  className="glass-input"
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  required
                >
                  <option value="">Select Genre</option>
                  {GENRE_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Language <span className="text-red-500">*</span></label>
                <select
                  className="glass-input"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  required
                >
                    <option value="">Select Country/Language</option>
                    {COUNTRY_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Region <span className="text-red-500">*</span></label>
                <select
                  className="glass-input"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  required
                >
                  <option value="">Select Region</option>
                  <option value="Global">Global</option>
                  <option value="Asia">Asia</option>
                  <option value="Europe">Europe</option>
                  <option value="America">America</option>
                  <option value="Oceania">Oceania</option>
                  <option value="Africa">Africa</option>
                </select>
              </div>
            </div>

             {/* ISWC & ISRC */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ISWC</label>
                <input
                  type="text"
                  className="glass-input"
                  value={iswc}
                  onChange={(e) => setIswc(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ISRC</label>
                <input
                  type="text"
                  className="glass-input"
                  value={isrc}
                  onChange={(e) => setIsrc(e.target.value)}
                />
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
              <textarea
                className="glass-input"
                rows={4}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            {/* Lyrics & Chord Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lyrics & Chord (Doc, Docx, PDF, TXT)</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer relative">
                <input
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                            setLyricsFile(e.target.files[0]);
                        }
                    }}
                    accept=".doc,.docx,.pdf,.txt"
                />
                <div className="text-center">
                    {lyricsFile ? (
                        <div className="flex items-center text-purple-600">
                            <span className="font-medium">{lyricsFile.name}</span>
                        </div>
                    ) : (
                        <div className="text-gray-500">
                            <p className="font-medium">Click or drag file to upload</p>
                            <p className="text-xs mt-1">Supported formats: .doc, .docx, .pdf, .txt</p>
                        </div>
                    )}
                </div>
              </div>
            </div>

            {/* Writers Table */}
            <div className="border border-white/40 rounded-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-purple-50/50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/2">Writer</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Share</th>
                            <th className="px-6 py-3 text-right"></th>
                        </tr>
                    </thead>
                    <tbody className="bg-transparent divide-y divide-gray-200/50">
                        {writers.map((writer, index) => (
                            <tr key={index}>
                                <td className="px-6 py-4">
                                    <div 
                                        onClick={() => openCreatorModal(index)}
                                        className="cursor-pointer relative"
                                    >
                                        <input 
                                            type="text" 
                                            placeholder="Select Writer"
                                            className="glass-input px-4 py-3 text-base w-full cursor-pointer bg-white/50 hover:bg-white/80 transition-colors"
                                            value={writer.name}
                                            readOnly
                                            required
                                        />
                                        <Search size={16} className="absolute right-3 top-3.5 text-gray-400" />
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <select 
                                        className="glass-input px-4 py-3 text-base w-full"
                                        value={writer.role}
                                        onChange={(e) => handleWriterChange(index, 'role', e.target.value)}
                                    >
                                        <option value="Author & Composer">Author & Composer</option>
                                        <option value="Author">Author</option>
                                        <option value="Composer">Composer</option>
                                        <option value="Arranger">Arranger</option>
                                    </select>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center">
                                        <input 
                                            type="number" 
                                            className="glass-input w-20 px-3 py-3 text-base text-right"
                                            value={writer.share_percent}
                                            onChange={(e) => handleWriterChange(index, 'share_percent', parseFloat(e.target.value) || 0)}
                                        />
                                        <span className="ml-2 text-base text-gray-500">%</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {writers.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeWriter(index)}
                                            className="text-red-400 hover:text-red-600 transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        <tr className="bg-purple-50/50 font-semibold">
                            <td colSpan={2} className="px-6 py-3 text-right">Share Total</td>
                            <td className="px-6 py-3 text-right pr-12 text-[#7A4A88]">{totalShare}%</td>
                            <td></td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <datalist id="creators-list">
                {creatorsList.map((creator) => (
                    <option key={creator.id} value={creator.name} />
                ))}
            </datalist>

            <div>
                <button 
                    type="button" 
                    onClick={addWriter}
                    className="glass-button bg-gray-500/50 hover:bg-gray-600/50 text-white text-sm"
                >
                    + Add Other Writer
                </button>
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end pt-4">
                <button
                    type="submit"
                    className="glass-button"
                >
                    Save
                </button>
            </div>
          </form>
      </div>
    </div>
  );
};

export default CreateSong;