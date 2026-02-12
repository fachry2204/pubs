import { useEffect, useState } from 'react';
import api from '../../services/api';
import StatCard from '../../components/StatCard';
import { Music, Banknote, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const UserDashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const statsRes = await api.get('/dashboard/stats');
        setStats(statsRes.data);
        
        // Use statsRes.data.monthlyData for analytics if available, or fetch separately if needed
        // Based on backend implementation, monthlyData is already included in stats
        if (statsRes.data.monthlyData) {
             setAnalytics(statsRes.data.monthlyData);
        } else {
             const analyticsRes = await api.get('/reports/analytics');
             setAnalytics(analyticsRes.data);
        }
      } catch (error) {
        console.error(error);
      }
    };
    fetchData();
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', { 
        style: 'currency', 
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(val);
  };

  const colors = ['#7A4A88', '#9B5DE5', '#D689FF', '#F15BB5', '#00BBF9', '#00F5D4', '#8338EC', '#3A86FF', '#FF006E', '#FB5607', '#FFBE0B', '#FFD166'];

  if (!stats) return <div>Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Revenue Analytics</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics}>
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
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} 
                    formatter={(value: any) => formatCurrency(value)}
                  />
                  <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                    {analytics.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Top 5 Songs</h3>
            <div className="space-y-4">
                {stats.topSongs && stats.topSongs.map((song: any, index: number) => (
                    <div key={index} className="flex items-center justify-between border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-sm">
                                {index + 1}
                            </div>
                            <div className="overflow-hidden">
                                <p className="font-medium text-gray-800 text-sm truncate max-w-[150px]" title={song.title}>{song.title}</p>
                            </div>
                        </div>
                        <span className="font-bold text-green-600 text-sm">{formatCurrency(song.revenue)}</span>
                    </div>
                ))}
                {(!stats.topSongs || stats.topSongs.length === 0) && (
                    <p className="text-gray-400 text-sm text-center py-4">Belum ada data</p>
                )}
            </div>
          </div>
      </div>
    </div>
  );
};

export default UserDashboard;
