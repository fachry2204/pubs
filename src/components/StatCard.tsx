import { ReactNode } from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: string;
  trendUp?: boolean;
  chartData?: any[];
  chartColor?: string;
}

const StatCard = ({ title, value, icon, trend, trendUp, chartData, chartColor = "#8884d8" }: StatCardProps) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between h-40 relative overflow-hidden group hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start z-10">
        <div>
           <p className="text-sm text-gray-500 font-medium mb-1">{title}</p>
           <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
        </div>
        <div className="p-2 rounded-lg bg-gray-50 text-gray-600 group-hover:bg-purple-50 group-hover:text-purple-600 transition-colors">
            {icon}
        </div>
      </div>
      
      <div className="flex justify-between items-end mt-4 z-10">
          {trend && (
            <div className={`flex items-center text-xs font-semibold ${trendUp ? 'text-green-500' : 'text-red-500'}`}>
                {trendUp ? '↑' : '↓'} {trend}
                <span className="text-gray-400 ml-1 font-normal">vs last month</span>
            </div>
          )}
      </div>

      {/* Sparkline Chart Background */}
      {chartData && (
          <div className="absolute bottom-0 left-0 right-0 h-16 opacity-20">
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                    <Area type="monotone" dataKey="value" stroke={chartColor} fill={chartColor} strokeWidth={2} />
                </AreaChart>
             </ResponsiveContainer>
          </div>
      )}
    </div>
  );
};

export default StatCard;
