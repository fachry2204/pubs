import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { ChevronLeft, ChevronRight, Trophy, Users, Music, Filter } from 'lucide-react';
import api from '../../services/api';

const TopTable = ({ title, type, icon, month, year }: { title: string, type: string, icon: any, month: number | '', year: number | '' }) => {
    const [data, setData] = useState<any[]>([]);
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    
    // For simplicity, we assume there's always next page if we got full limit items.
    // In real app, backend should return total count.
    const limit = 5;

    useEffect(() => {
        fetchData();
    }, [page, month, year]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const params: any = { type, page, limit };
            if (month) params.month = month;
            if (year) params.year = year;
            
            const res = await api.get('/reports/top-stats', { params });
            setData(res.data);
        } catch (error) {
            console.error('Failed to fetch top stats', error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('id-ID', { 
            style: 'currency', 
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(val);
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col h-full">
            <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                    {icon}
                </div>
                <h3 className="text-lg font-bold text-gray-800">{title}</h3>
            </div>
            
            <div className="flex-1">
                {isLoading ? (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {data.map((item, index) => (
                            <div key={index} className="flex items-center justify-between border-b border-gray-50 pb-2 last:border-0">
                                <div className="flex items-center gap-3">
                                    <span className="w-6 h-6 flex items-center justify-center bg-gray-100 rounded text-xs font-bold text-gray-500">
                                        {(page - 1) * limit + index + 1}
                                    </span>
                                    <span className="font-medium text-gray-700 text-sm truncate max-w-[150px]" title={item.name}>
                                        {item.name || 'Unknown'}
                                    </span>
                                </div>
                                <span className="font-bold text-green-600 text-sm">{formatCurrency(item.revenue)}</span>
                            </div>
                        ))}
                        {data.length === 0 && <p className="text-center text-gray-400 text-sm py-4">Tidak ada data</p>}
                    </div>
                )}
            </div>

            <div className="mt-4 flex items-center justify-between pt-4 border-t border-gray-100">
                <button 
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1 || isLoading}
                    className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <ChevronLeft size={20} />
                </button>
                <span className="text-xs text-gray-500">Halaman {page}</span>
                <button 
                    onClick={() => setPage(p => p + 1)}
                    disabled={data.length < limit || isLoading}
                    className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <ChevronRight size={20} />
                </button>
            </div>
        </div>
    );
};

const Analytics = () => {
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filter States
  const [selectedMonth, setSelectedMonth] = useState<number | ''>('');
  const [selectedYear, setSelectedYear] = useState<number | ''>('');

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const analyticsParams: any = {};
      if (selectedMonth) analyticsParams.month = selectedMonth;
      if (selectedYear) analyticsParams.year = selectedYear;

      const analyticsRes = await api.get('/reports/analytics', { params: analyticsParams });
      setAnalytics(analyticsRes.data);
      
      const summaryParams: any = {};
      if (selectedMonth) summaryParams.month = selectedMonth;
      if (selectedYear) summaryParams.year = selectedYear;

      const summaryRes = await api.get('/reports', { params: summaryParams });
      
      if (summaryRes.data && summaryRes.data.summary) {
           setSummary(summaryRes.data.summary);
      }
    } catch (error) {
      console.error('Failed to fetch analytics', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (val: number) => {
    if (val === undefined || val === null || isNaN(val)) {
        return 'Rp 0';
    }
    return new Intl.NumberFormat('id-ID', { 
        style: 'currency', 
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(val);
  };

  const colors = ['#7A4A88', '#9B5DE5', '#D689FF', '#F15BB5', '#00BBF9', '#00F5D4', '#8338EC', '#3A86FF', '#FF006E', '#FB5607', '#FFBE0B', '#FFD166'];
  const pieColors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  const months = [
      { value: 1, label: 'Januari' },
      { value: 2, label: 'Februari' },
      { value: 3, label: 'Maret' },
      { value: 4, label: 'April' },
      { value: 5, label: 'Mei' },
      { value: 6, label: 'Juni' },
      { value: 7, label: 'Juli' },
      { value: 8, label: 'Agustus' },
      { value: 9, label: 'September' },
      { value: 10, label: 'Oktober' },
      { value: 11, label: 'November' },
      { value: 12, label: 'Desember' }
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  if (isLoading && !summary) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      );
  }

  const pieData = summary ? [
      { name: 'Share ke Pencipta', value: Number(summary.total_client_share || 0) },
      { name: 'Pendapatan Kita', value: Number(summary.total_admin_share || 0) },
  ] : [];

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Analitik (Analytics)</h1>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-3 bg-white p-2 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 px-2 text-gray-500">
                <Filter size={18} />
                <span className="text-sm font-medium">Filter:</span>
            </div>
            <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(e.target.value ? Number(e.target.value) : '')}
                className="text-sm border-gray-200 rounded-md focus:ring-purple-500 focus:border-purple-500 bg-gray-50 py-1.5"
            >
                <option value="">Semua Bulan</option>
                {months.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                ))}
            </select>
            <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(e.target.value ? Number(e.target.value) : '')}
                className="text-sm border-gray-200 rounded-md focus:ring-purple-500 focus:border-purple-500 bg-gray-50 py-1.5"
            >
                <option value="">Semua Tahun</option>
                {years.map(y => (
                    <option key={y} value={y}>{y}</option>
                ))}
            </select>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
              <div className="p-3 bg-red-50 text-red-600 rounded-full mr-4">
                  <Users size={24} />
              </div>
              <div>
                  <p className="text-sm text-gray-500 font-medium">Net Revenue</p>
                  <h3 className="text-xl font-bold text-gray-800">{formatCurrency(summary?.total_client_share || 0)}</h3>
              </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-full mr-4">
                  <Trophy size={24} />
              </div>
              <div>
                  <p className="text-sm text-gray-500 font-medium">Sub Publisher Share</p>
                  <h3 className="text-xl font-bold text-gray-800">{formatCurrency(summary?.total_sub_pub_share || 0)}</h3>
              </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
              <div className="p-3 bg-green-50 text-green-600 rounded-full mr-4">
                  <Music size={24} />
              </div>
              <div>
                  <p className="text-sm text-gray-500 font-medium">TBW Share</p>
                  <h3 className="text-xl font-bold text-gray-800">{formatCurrency(summary?.total_admin_share || 0)}</h3>
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Revenue Chart */}
          <div className="lg:col-span-3 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Revenue Trend (Bulanan)</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics} barGap={0} barCategoryGap="20%">
                  <defs>
                      {colors.map((color, index) => (
                          <linearGradient key={`gradient-${index}`} id={`gradient-${index}`} x1="0" y1="0" x2="1" y2="0">
                              <stop offset="0%" stopColor={color} stopOpacity={0.8} />
                              <stop offset="100%" stopColor={color} stopOpacity={1} />
                          </linearGradient>
                      ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                  <Tooltip 
                    cursor={{fill: 'transparent'}}
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} 
                    formatter={(value: any) => formatCurrency(value)}
                  />
                  <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                    {analytics.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={`url(#gradient-${index % colors.length})`} stroke={colors[index % colors.length]} strokeWidth={1} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
      </div>

      {/* Top Tables */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <TopTable title="Top User Revenue" type="users" icon={<Users size={20} />} month={selectedMonth} year={selectedYear} />
          <TopTable title="Top Creator Revenue" type="creators" icon={<Users size={20} />} month={selectedMonth} year={selectedYear} />
          <TopTable title="Top Song Revenue" type="songs" icon={<Music size={20} />} month={selectedMonth} year={selectedYear} />
      </div>
    </div>
  );
};

export default Analytics;
