import { useState, useEffect } from 'react';
import UpdateModal from './UpdateModal';

const Footer = () => {
  const [version, setVersion] = useState('1.0.0');
  const [updateContent, setUpdateContent] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // Fetch version
    fetch('/ver.txt')
      .then(res => res.text())
      .then(text => setVersion(text.trim()))
      .catch(err => console.error('Failed to load version', err));

    // Fetch update content
    fetch('/pembaruan.txt')
      .then(res => res.text())
      .then(text => setUpdateContent(text))
      .catch(err => console.error('Failed to load update content', err));
  }, []);

  const currentYear = new Date().getFullYear();

  return (
    <>
      <footer className="bg-white/30 backdrop-blur-md border-t border-white/20 py-4 px-6 ml-64 mt-auto">
        <div className="flex justify-between items-center text-sm text-gray-600">
          <div className="flex items-center space-x-1">
          <span>Copyright &copy; {currentYear} 13 Nadi Pustaka</span>
            <span>&bull;</span>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="hover:text-[#7A4A88] hover:underline font-medium transition-colors focus:outline-none"
            >
              Versi {version}
            </button>
          </div>
          <div>
            Build By <span className="font-semibold text-[#7A4A88]">Garuda Server</span>
          </div>
        </div>
      </footer>

      <UpdateModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        content={updateContent} 
      />
    </>
  );
};

export default Footer;
