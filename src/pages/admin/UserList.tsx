import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Search, UserX, FileText, CheckCircle, Clock, XCircle, AlertCircle, Edit2 } from 'lucide-react';

const UserList = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [activeTab, setActiveTab] = useState('user'); // 'user', 'admin', 'operator'
  const [statusForm, setStatusForm] = useState({
      status: '',
      percentage_share: 0,
      role: 'user'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (error) {
      console.error('Failed to fetch users', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesRole = (user.role || 'user') === activeTab;
    
    return matchesSearch && matchesRole;
  });

  const handleStatusClick = (user: any) => {
      setSelectedUser(user);
      setStatusForm({
          status: user.status || 'pending',
          percentage_share: user.percentage_share || 0,
          role: user.role || 'user'
      });
      setShowStatusModal(true);
  };

  const handleUpdateStatus = async () => {
      if (!selectedUser) return;
      try {
          await api.put(`/users/${selectedUser.id}`, statusForm);
          setShowStatusModal(false);
          fetchUsers();
      } catch (error) {
          console.error('Failed to update user', error);
          alert('Failed to update user status');
      }
  };

  const handleGenerateContract = async () => {
      if (!selectedUser) return;
      try {
          await api.post(`/users/${selectedUser.id}/contract`);
          alert('Contract generated successfully! (Mock)');
          // In real app, you might download a file here
      } catch (error) {
          console.error('Failed to generate contract', error);
          alert('Failed to generate contract');
      }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Manajemen User</h1>
      </div>

      <div className="glass-panel">
        {/* Tabs */}
        <div className="flex border-b border-gray-200">
            {['user', 'admin', 'operator'].map(tab => (
                <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-3 text-sm font-medium capitalize transition-colors
                        ${activeTab === tab 
                            ? 'border-b-2 border-purple-600 text-purple-600 bg-purple-50/50' 
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                >
                    {tab}s
                </button>
            ))}
        </div>

        <div className="p-4 border-b border-white/30">
            <div className="relative max-w-md">
                <input
                    type="text"
                    placeholder={`Cari ${activeTab}...`}
                    className="glass-input pl-10 w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
            </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200/50">
            <thead className="bg-purple-50/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                {activeTab === 'user' && (
                    <>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Share (%)</th>
                    </>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-transparent divide-y divide-gray-200/50">
              {isLoading ? (
                <tr>
                  <td colSpan={activeTab === 'user' ? 7 : 5} className="px-6 py-4 text-center text-sm text-gray-500">Loading...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={activeTab === 'user' ? 7 : 5} className="px-6 py-4 text-center text-sm text-gray-500">No {activeTab}s found</td>
                </tr>
              ) : (
                filteredUsers.map((user, index) => (
                  <tr key={user.id} className={index % 2 === 0 ? 'bg-white/50' : 'bg-white/30'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{user.role || 'user'}</td>
                    {activeTab === 'user' && (
                        <>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                                    ${(user.status || 'pending') === 'accepted' ? 'bg-green-100 text-green-800' : 
                                    (user.status || 'pending') === 'review' ? 'bg-yellow-100 text-yellow-800' : 
                                    (user.status || 'pending') === 'rejected' ? 'bg-red-100 text-red-800' :
                                    'bg-gray-100 text-gray-800'}`}>
                                    {user.status || 'pending'}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {user.percentage_share || 0}%
                            </td>
                        </>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => handleStatusClick(user)}
                        className="text-purple-600 hover:text-purple-900 flex items-center gap-1 ml-auto"
                      >
                        <Edit2 size={16} /> Manage
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Status Management Modal */}
      {showStatusModal && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="bg-white rounded-xl shadow-xl p-6 w-[500px] max-w-[90%]">
                  <div className="flex justify-between items-center mb-6 border-b pb-4">
                      <h3 className="text-xl font-bold text-gray-900">Manage User: {selectedUser.name}</h3>
                      <button onClick={() => setShowStatusModal(false)} className="text-gray-400 hover:text-gray-600">
                          <XCircle size={24} />
                      </button>
                  </div>
                  
                  <div className="space-y-6">
                      {/* Role Selection */}
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                          <div className="flex gap-3">
                              {['user', 'operator', 'admin'].map(role => (
                                  <button
                                      key={role}
                                      onClick={() => setStatusForm({...statusForm, role})}
                                      className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium border transition-all capitalize
                                          ${statusForm.role === role 
                                              ? 'border-purple-600 bg-purple-50 text-purple-700 ring-1 ring-purple-600' 
                                              : 'border-gray-200 hover:bg-gray-50 text-gray-600'}`}
                                  >
                                      {role}
                                  </button>
                              ))}
                          </div>
                      </div>

                      {/* Status Selection - Only for 'user' role */}
                      {statusForm.role === 'user' && (
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Account Status</label>
                          <div className="grid grid-cols-2 gap-3">
                              {['pending', 'review', 'accepted', 'rejected'].map(status => (
                                  <button
                                      key={status}
                                      onClick={() => setStatusForm({...statusForm, status})}
                                      className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all flex items-center justify-center gap-2
                                          ${statusForm.status === status 
                                              ? 'border-purple-600 bg-purple-50 text-purple-700 ring-1 ring-purple-600' 
                                              : 'border-gray-200 hover:bg-gray-50 text-gray-600'}`}
                                  >
                                      {status === 'pending' && <Clock size={16} />}
                                      {status === 'review' && <AlertCircle size={16} />}
                                      {status === 'accepted' && <CheckCircle size={16} />}
                                      {status === 'rejected' && <UserX size={16} />}
                                      <span className="capitalize">{status}</span>
                                  </button>
                              ))}
                          </div>
                      </div>
                      )}

                      {/* Review Specific Fields - Only for 'user' role */}
                      {statusForm.role === 'user' && statusForm.status === 'review' && (
                          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 animate-in fade-in slide-in-from-top-2">
                              <h4 className="font-semibold text-yellow-800 mb-3 flex items-center gap-2">
                                  <AlertCircle size={18} /> Review Process
                              </h4>
                              <div className="mb-4">
                                  <label className="block text-sm font-medium text-yellow-800 mb-1">Percentage Share (%)</label>
                                  <input 
                                      type="number" 
                                      value={statusForm.percentage_share}
                                      onChange={(e) => setStatusForm({...statusForm, percentage_share: Number(e.target.value)})}
                                      className="block w-full rounded-md border-yellow-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm p-2"
                                      placeholder="e.g. 70"
                                      min="0"
                                      max="100"
                                  />
                                  <p className="text-xs text-yellow-600 mt-1">Potongan untuk user ini.</p>
                              </div>
                              <button 
                                  onClick={handleGenerateContract}
                                  className="w-full flex items-center justify-center gap-2 bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition-colors"
                              >
                                  <FileText size={18} /> Generate Contract
                              </button>
                          </div>
                      )}

                      <div className="flex gap-3 pt-4 border-t">
                          <button 
                              onClick={() => setShowStatusModal(false)}
                              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
                          >
                              Cancel
                          </button>
                          <button 
                              onClick={handleUpdateStatus}
                              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 font-medium"
                          >
                              Save Changes
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default UserList;
