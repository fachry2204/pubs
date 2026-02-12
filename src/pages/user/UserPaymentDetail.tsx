import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, User, FileText, ChevronDown, ChevronRight, CheckCircle, CreditCard, Download, Eye, X } from 'lucide-react';
import api from '../../services/api';

const UserPaymentDetail = () => {
  const { userId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // View State
  const [expandedWriters, setExpandedWriters] = useState<string[]>([]);
  
  // Modal State
  const [showProofModal, setShowProofModal] = useState(false);
  const [proofUrl, setProofUrl] = useState<string | null>(null);

  // Get query params for month/year if not passed in state
  const searchParams = new URLSearchParams(location.search);
  
  const getParam = (key: string, stateVal: any) => {
      if (stateVal !== undefined) return stateVal;
      const urlVal = searchParams.get(key);
      if (urlVal === 'all') return 'all';
      return urlVal ? Number(urlVal) : (key === 'year' ? new Date().getFullYear() : new Date().getMonth() + 1);
  };

  const month = getParam('month', location.state?.month) ?? 'all';
  const year = getParam('year', location.state?.year) ?? 'all';

  useEffect(() => {
    fetchDetail();
  }, [userId, month, year]);

  const fetchDetail = async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      if (month !== 'all') params.month = month;
      if (year !== 'all') params.year = year;

      const res = await api.get('/payments/calculate', { params });
      // User only sees their own data
      const userData = res.data.find((u: any) => u.user_id === Number(userId));
      setData(userData);

    } catch (error) {
      console.error('Failed to fetch payment details', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleWriter = (writerName: string) => {
    setExpandedWriters(prev => 
      prev.includes(writerName) ? prev.filter(w => w !== writerName) : [...prev, writerName]
    );
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', { 
        style: 'currency', 
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(val);
  };

  // Group data by Writer
  const getWriterBreakdown = () => {
      if (!data) return [];
      const writersMap: any = {};

      data.songs.forEach((song: any) => {
          song.writers.forEach((writer: any) => {
              if (!writersMap[writer.name]) {
                  writersMap[writer.name] = {
                      name: writer.name,
                      role: writer.role,
                      phone: writer.phone,
                      bank_name: writer.bank_name,
                      bank_account_number: writer.bank_account_number,
                      bank_account_name: writer.bank_account_name,
                      payment_status: writer.payment_status,
                      payment_proof: writer.payment_proof,
                      total_amount: 0,
                      songs: []
                  };
              }
              writersMap[writer.name].total_amount += writer.amount;
              writersMap[writer.name].songs.push({
                  title: song.title,
                  song_id: song.song_id,
                  share_percent: writer.share_percent,
                  amount: writer.amount,
                  role: writer.role,
                  creators: song.writers.map((w: any) => `${w.name} (${w.share_percent}%)`).join(', ')
              });
          });
      });

      return Object.values(writersMap);
  };

  const writers = getWriterBreakdown();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Data tidak ditemukan.</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-purple-600 hover:underline">Kembali</button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => navigate(-1)} 
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft size={24} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            Detail Pembayaran Saya
          </h1>
          <p className="text-gray-500">
            Periode: {month === 'all' ? 'Semua Bulan' : new Date(0, month - 1).toLocaleString('default', { month: 'long' })} {year === 'all' ? 'Semua Tahun' : year}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Summary */}
        <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-purple-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-full -mr-16 -mt-16 z-0"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
                            <User size={24} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">{data.user_name}</h2>
                            <p className="text-sm text-gray-500">User ID: #{data.user_id}</p>
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="flex justify-between">
                            <span className="text-gray-500 text-sm">Total Revenue</span>
                            <span className="font-bold text-gray-800">{formatCurrency(data.total_revenue)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500 text-sm">Royalti Share ({data.user_percentage}%)</span>
                            <span className="font-bold text-red-500">-{formatCurrency(data.admin_share)}</span>
                        </div>
                        <div className="border-t border-dashed border-gray-200 my-2 pt-2 flex justify-between">
                            <span className="text-gray-800 font-medium">Net Payable</span>
                            <span className="font-bold text-xl text-green-600">{formatCurrency(data.net_share)}</span>
                        </div>
                    </div>
                </div>
            </div>

             {/* Status Card (Read Only for User) */}
             <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <CheckCircle size={18} /> Status Transfer
                </h3>
                <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                        data.payment_status === 'success' ? 'bg-green-500' : 
                        data.payment_status === 'process' ? 'bg-blue-500' : 'bg-gray-300'
                    }`}></div>
                    <span className="font-medium text-gray-700 capitalize">
                        {data.payment_status === 'success' ? 'Sudah Ditransfer' : 
                         data.payment_status === 'process' ? 'Sedang Diproses' : 'Belum Ditransfer'}
                    </span>
                </div>
            </div>
        </div>

        {/* Right Column: Writer Details */}
        <div className="lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FileText size={20} /> Rincian Pencipta
            </h3>
            
            <div className="space-y-4">
                {writers.map((writer: any, idx: number) => (
                    <div key={idx} className="bg-white rounded-lg border border-purple-100 overflow-hidden shadow-sm">
                        <div 
                            className="p-4 flex items-center justify-between cursor-pointer hover:bg-purple-50/30 transition-colors"
                            onClick={() => toggleWriter(writer.name)}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-1 rounded-full ${expandedWriters.includes(writer.name) ? 'bg-purple-100 text-purple-600' : 'text-gray-400'}`}>
                                    {expandedWriters.includes(writer.name) ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-800">{writer.name}</h4>
                                    <p className="text-xs text-gray-500">{writer.role}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-500 uppercase">Total Diterima</p>
                                <p className="font-bold text-green-600 text-lg">{formatCurrency(writer.total_amount)}</p>
                            </div>
                        </div>

                        {expandedWriters.includes(writer.name) && (
                            <div className="bg-gray-50 border-t border-gray-100 p-4">
                                {/* Bank Details */}
                                {(writer.bank_name || writer.bank_account_number) && (
                                    <div className="mb-4 bg-blue-50 p-3 rounded-lg border border-blue-100">
                                        <h5 className="text-xs font-semibold text-blue-700 uppercase mb-2 flex items-center gap-2">
                                            <CreditCard size={14} /> Data Rekening
                                        </h5>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div>
                                                <span className="text-gray-500 text-xs block">Bank</span>
                                                <span className="font-medium text-gray-800">{writer.bank_name || '-'}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500 text-xs block">No. Rekening</span>
                                                <span className="font-medium text-gray-800">{writer.bank_account_number || '-'}</span>
                                            </div>
                                            {writer.bank_account_name && (
                                                <div className="col-span-2">
                                                    <span className="text-gray-500 text-xs block">Atas Nama</span>
                                                    <span className="font-medium text-gray-800">{writer.bank_account_name}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Status for User (Read Only) */}
                                <div className="mb-6 bg-white p-4 rounded-lg border border-purple-100 shadow-sm">
                                    <h5 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                        <CheckCircle size={16} className="text-purple-600" /> Status Pembayaran
                                    </h5>
                                    
                                    <div className="flex justify-between items-center">
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${
                                            writer.payment_status === 'success' ? 'bg-green-100 text-green-800' :
                                            writer.payment_status === 'process' ? 'bg-blue-100 text-blue-800' :
                                            'bg-yellow-100 text-yellow-800'
                                        }`}>
                                            {writer.payment_status === 'success' ? 'Sudah Ditransfer' : 
                                             writer.payment_status === 'process' ? 'Sedang Diproses' : 'Belum Ditransfer'}
                                        </span>

                                        {writer.payment_proof && (
                                            <button 
                                                onClick={() => {
                                                    const proofPath = writer.payment_proof.startsWith('http') 
                                                        ? writer.payment_proof 
                                                        : writer.payment_proof.startsWith('/uploads/') ? writer.payment_proof : `/uploads/proof/${writer.payment_proof}`;
                                                    setProofUrl(proofPath);
                                                    setShowProofModal(true);
                                                }}
                                                className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 text-xs font-medium"
                                            >
                                                <Eye size={14} /> Lihat Bukti Transfer
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <h5 className="text-xs font-semibold text-gray-500 uppercase mb-3">Rincian Lagu</h5>
                                <div className="space-y-2">
                                    {writer.songs.map((song: any, sIdx: number) => (
                                        <div key={sIdx} className="flex justify-between items-center bg-white p-3 rounded border border-gray-200">
                                            <div>
                                                <p className="font-medium text-gray-800 text-sm">
                                                    {song.title}
                                                    <span className="ml-1 text-xs text-gray-500 font-normal">
                                                        ({song.creators})
                                                    </span>
                                                </p>
                                                <p className="text-xs text-gray-500">Share: {song.share_percent}%</p>
                                            </div>
                                            <span className="font-medium text-gray-700 text-sm">
                                                {formatCurrency(song.amount)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
      </div>

       {/* Modal Bukti Transfer */}
       {showProofModal && proofUrl && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                <div className="relative max-w-2xl w-full bg-white rounded-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                    <div className="flex justify-between items-center p-4 border-b border-gray-100">
                        <h3 className="font-bold text-gray-800">Bukti Transfer</h3>
                        <button 
                            onClick={() => setShowProofModal(false)}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X size={20} className="text-gray-500" />
                        </button>
                    </div>
                    <div className="p-4 bg-gray-100 flex justify-center">
                        <img src={proofUrl} alt="Bukti Transfer" className="max-h-[70vh] object-contain rounded-lg shadow-sm" />
                    </div>
                    <div className="p-4 border-t border-gray-100 flex justify-end">
                        <a 
                            href={proofUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                        >
                            <Download size={16} /> Buka Original
                        </a>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default UserPaymentDetail;