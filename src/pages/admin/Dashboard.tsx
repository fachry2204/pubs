import { useEffect, useState } from 'react';
import api from '../../services/api';
import StatCard from '../../components/StatCard';
import { Music, DollarSign, Activity, CheckCircle, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const AdminDashboard = () => {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/dashboard/stats');
        setStats(res.data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchStats();
  }, []);

  // Format monthly data for chart
  const chartData = stats?.monthlyData?.map((item: any) => ({
    name: `${new Date(0, item.month - 1).toLocaleString('default', { month: 'short' })}`,
    revenue: item.revenue
  })) || [];

  if (!stats) return <div className="p-8 text-center text-gray-500">Loading dashboard data...</div>;

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

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Dashboard Overview</h1>
            <p className="text-gray-500 text-sm mt-1">Welcome back, here's what's happening today.</p>
          </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard 
            title="Total Songs" 
            value={stats.totalSongs} 
            icon={<Music size={20} />} 
            trend="Total Songs" 
            trendUp={true}
            chartData={[]}
            chartColor="#8884d8"
        />
        <StatCard 
            title="Lagu Pending" 
            value={stats.pendingSongs} 
            icon={<Clock size={20} />} 
            trend="Pending Approval" 
            trendUp={true}
            chartData={[]}
            chartColor="#ffc658"
        />
        <StatCard 
            title="Lagu Diterima" 
            value={stats.approvedSongs} 
            icon={<CheckCircle size={20} />} 
            trend="Approved Songs" 
            trendUp={true}
            chartData={[]}
            chartColor="#82ca9d"
        />
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sales Analytics */}
          <div className="lg:col-span-3 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-bold text-gray-800">Monthly Revenue Analytics</h2>
              </div>
              <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} tickFormatter={(val) => `Rp ${(val/1000000).toFixed(1)}M`} />
                          <Tooltip 
                            contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} 
                            formatter={(value: number) => formatCurrency(value)}
                          />
                          <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                            {chartData.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
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

export default AdminDashboard;