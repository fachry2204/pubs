import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { LogOut, Clock, XCircle, CheckCircle } from 'lucide-react';

const UserStatus = () => {
  const { user, logout } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.status === 'accepted') {
    return <Navigate to="/user" replace />;
  }

  const getStatusContent = () => {
    switch (user.status) {
      case 'rejected':
        return {
          icon: <XCircle className="w-16 h-16 text-red-500" />,
          title: "Account Application Rejected",
          message: "We're sorry, but your account application has been rejected. Please contact support for more information.",
          bgColor: "bg-red-500",
          lightBg: "bg-red-50"
        };
      case 'review':
        return {
          icon: <Clock className="w-16 h-16 text-blue-500" />,
          title: "Under Review",
          message: "Your account is currently being reviewed by our team. You will be notified once the process is complete.",
          bgColor: "bg-blue-500",
          lightBg: "bg-blue-50"
        };
      default: // pending
        return {
          icon: <Clock className="w-16 h-16 text-yellow-500" />,
          title: "Waiting for Approval",
          message: "Thank you for registering! Your account is currently pending approval from the administrator. Please check back later.",
          bgColor: "bg-yellow-500",
          lightBg: "bg-yellow-50"
        };
    }
  };

  const content = getStatusContent();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="glass-panel w-full max-w-lg p-8 text-center relative overflow-hidden">
        {/* Decorative Background Blob */}
        <div className={`absolute top-0 left-0 w-full h-2 ${content.bgColor} opacity-80`}></div>
        
        <div className="flex justify-center mb-6">
          <div className={`p-4 ${content.lightBg} rounded-full animate-bounce-slow`}>
            {content.icon}
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-3">{content.title}</h2>
        <p className="text-gray-600 mb-8 leading-relaxed">
          {content.message}
        </p>
        
        <div className="border-t border-gray-100 pt-6">
            <p className="text-sm text-gray-500 mb-4">Logged in as <span className="font-medium text-gray-900">{user.email}</span></p>
            <button
            onClick={logout}
            className="inline-flex items-center gap-2 px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-red-600 transition-colors text-sm font-medium"
            >
            <LogOut size={16} />
            Sign Out
            </button>
        </div>
      </div>
    </div>
  );
};

export default UserStatus;
