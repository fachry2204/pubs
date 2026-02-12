import { X } from 'lucide-react';

interface UpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
}

const UpdateModal = ({ isOpen, onClose, content }: UpdateModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white/80 backdrop-blur-md rounded-lg shadow-2xl w-full max-w-lg p-6 border border-white/40 m-4">
        <div className="flex justify-between items-center mb-4 border-b border-gray-200 pb-2">
          <h3 className="text-xl font-bold text-[#7A4A88]">Data Pembaruan Aplikasi</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-red-500 transition-colors">
            <X size={24} />
          </button>
        </div>
        <div className="prose max-w-none text-gray-700 whitespace-pre-wrap max-h-[60vh] overflow-y-auto">
          {content || 'Tidak ada data pembaruan.'}
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#7A4A88] text-white rounded-md hover:bg-purple-700 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateModal;
