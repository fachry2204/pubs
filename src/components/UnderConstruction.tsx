import { Construction } from 'lucide-react';

const UnderConstruction = ({ title }: { title: string }) => {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-center p-6">
      <div className="bg-purple-50 p-6 rounded-full mb-6 animate-pulse">
        <Construction size={64} className="text-[#7A4A88]" />
      </div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">{title}</h2>
      <p className="text-gray-500 max-w-md">
        Fitur ini sedang dalam tahap pengembangan (Under Construction). 
        Kami sedang bekerja keras untuk segera menghadirkan fitur ini.
      </p>
      <div className="mt-8 flex gap-2">
        <span className="w-2 h-2 rounded-full bg-purple-300 animate-bounce" style={{ animationDelay: '0s' }}></span>
        <span className="w-2 h-2 rounded-full bg-purple-300 animate-bounce" style={{ animationDelay: '0.2s' }}></span>
        <span className="w-2 h-2 rounded-full bg-purple-300 animate-bounce" style={{ animationDelay: '0.4s' }}></span>
      </div>
    </div>
  );
};

export default UnderConstruction;