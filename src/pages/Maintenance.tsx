import { WifiOff, RefreshCw, ServerOff } from 'lucide-react';

const Maintenance = () => {
  const handleRetry = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center shadow-2xl border border-white/20">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-red-500/20 rounded-full animate-pulse">
            <ServerOff size={48} className="text-red-400" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-4">System Offline</h1>
        
        <p className="text-gray-300 mb-8 leading-relaxed">
          We're currently unable to connect to our servers. This could be due to scheduled maintenance or a temporary network issue.
        </p>

        <div className="bg-white/5 rounded-lg p-4 mb-8 text-left border border-white/10">
          <div className="flex items-center gap-3 text-sm text-gray-400 mb-2">
            <WifiOff size={16} />
            <span>Connection Status:</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span className="text-red-400 font-medium">Disconnected</span>
          </div>
        </div>

        <button 
          onClick={handleRetry}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 group shadow-lg shadow-blue-500/20"
        >
          <RefreshCw size={20} className="group-hover:rotate-180 transition-transform duration-500" />
          Try Again
        </button>
        
        <p className="mt-6 text-xs text-gray-500">
          If the problem persists, please contact support.
        </p>
      </div>
    </div>
  );
};

export default Maintenance;
