import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Filter, Wallet, PieChart, Building2 } from 'lucide-react';
import api from '../../services/api';

const UserAnalytics = () => {
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

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Analitik Saya</h1>
        
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
              <div className="p-3 bg-purple-50 text-purple-600 rounded-full mr-4">
                  <PieChart size={24} />
              </div>
              <div>
                  <p className="text-sm text-gray-500 font-medium">Total Revenue</p>
                  <h3 className="text-xl font-bold text-gray-800">{formatCurrency(summary?.total_sub_pub_share || 0)}</h3>
              </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
              <div className="p-3 bg-orange-50 text-orange-600 rounded-full mr-4">
                  <Building2 size={24} />
              </div>
              <div>
                  <p className="text-sm text-gray-500 font-medium">Share Revenue</p>
                  <h3 className="text-xl font-bold text-gray-800">{formatCurrency(summary?.total_admin_share || 0)}</h3>
              </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
              <div className="p-3 bg-green-50 text-green-600 rounded-full mr-4">
                  <Wallet size={24} />
              </div>
              <div>
                  <p className="text-sm text-gray-500 font-medium">Revenue saya</p>
                  <h3 className="text-xl font-bold text-gray-800">{formatCurrency(summary?.total_client_share || 0)}</h3>
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Revenue Chart */}
          <div className="lg:col-span-3 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Tren Pendapatan (Bulanan)</h3>
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
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#9ca3af', fontSize: 12}} 
                    dy={10} 
                    tickFormatter={(val) => {
                        const date = new Date(0, val - 1);
                        return date.toLocaleString('default', { month: 'short' });
                    }}
                  />
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


    </div>
  );
};

export default UserAnalytics;
