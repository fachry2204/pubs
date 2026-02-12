import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Search, UserX, CheckCircle, Edit2, Eye, Trash2, XCircle } from 'lucide-react';

const UserList = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activeTab, setActiveTab] = useState('user'); // 'user', 'admin', 'operator'
  
  // Verification states for Quick Action
  const [quickActionUser, setQuickActionUser] = useState<any>(null);
  const [quickActionType, setQuickActionType] = useState<'accept' | 'reject' | null>(null);
  const [quickShare, setQuickShare] = useState<number>(0);
  const [quickReason, setQuickReason] = useState<string>('');

  const [statusForm, setStatusForm] = useState({
      name: '',
      email: '',
      whatsapp: '',
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

  const handleQuickStatusChange = (user: any, newStatus: string) => {
      if (newStatus === 'accepted') {
          setQuickActionUser(user);
          setQuickActionType('accept');
          setQuickShare(user.percentage_share || 0);
      } else if (newStatus === 'rejected') {
          setQuickActionUser(user);
          setQuickActionType('reject');
          setQuickReason('');
      } else {
          // For pending/review, just update directly
          updateUserStatus(user.id, { status: newStatus });
      }
  };

  const handleQuickSubmit = async () => {
      if (!quickActionUser || !quickActionType) return;

      try {
          if (quickActionType === 'accept') {
              await api.put(`/users/${quickActionUser.id}`, {
                  status: 'accepted',
                  percentage_share: quickShare
              });
          } else {
              await api.put(`/users/${quickActionUser.id}`, {
                  status: 'rejected',
                  rejected_reason: quickReason
              });
          }
          setQuickActionUser(null);
          setQuickActionType(null);
          fetchUsers();
      } catch (error) {
          console.error('Failed to update status', error);
          alert('Failed to update status');
      }
  };

  const updateUserStatus = async (userId: number, data: any) => {
      try {
          await api.put(`/users/${userId}`, data);
          fetchUsers();
      } catch (error) {
          console.error('Failed to update user', error);
          alert('Failed to update user status');
      }
  };

  const handleView = async (user: any) => {
      try {
          const res = await api.get(`/users/${user.id}`);
          setSelectedUser(res.data);
          setShowViewModal(true);
      } catch (error) {
          console.error('Failed to fetch user details', error);
          alert('Failed to load user details');
      }
  };

  const handleEdit = async (user: any) => {
      try {
          // Fetch full details first to populate form
          const res = await api.get(`/users/${user.id}`);
          const userData = res.data;
          setSelectedUser(userData);
          setStatusForm({
              name: userData.name || '',
              email: userData.email || '',
              whatsapp: userData.whatsapp || '',
              status: userData.status || 'pending',
              percentage_share: Math.floor(userData.percentage_share || 0),
              role: userData.role || 'user'
          });
          setShowStatusModal(true);
      } catch (error) {
          console.error('Failed to fetch user details for edit', error);
          // Fallback to basic info if fetch fails
          setSelectedUser(user);
          setStatusForm({
              name: user.name || '',
              email: user.email || '',
              whatsapp: user.whatsapp || '',
              status: user.status || 'pending',
              percentage_share: Math.floor(user.percentage_share || 0),
              role: user.role || 'user'
          });
          setShowStatusModal(true);
      }
  };

  const handleDelete = (user: any) => {
      setSelectedUser(user);
      setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
      if (!selectedUser) return;
      try {
          await api.delete(`/users/${selectedUser.id}`);
          setShowDeleteModal(false);
          fetchUsers();
      } catch (error) {
          console.error('Failed to delete user', error);
          alert('Failed to delete user');
      }
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
                                <select
                                    value={user.status || 'pending'}
                                    onChange={(e) => handleQuickStatusChange(user, e.target.value)}
                                    className={`px-2 py-1 text-xs font-semibold rounded-full border-0 cursor-pointer outline-none focus:ring-2 focus:ring-purple-500/50
                                        ${(user.status || 'pending') === 'accepted' ? 'bg-green-100 text-green-800' : 
                                        (user.status || 'pending') === 'review' ? 'bg-yellow-100 text-yellow-800' : 
                                        (user.status || 'pending') === 'rejected' ? 'bg-red-100 text-red-800' :
                                        'bg-gray-100 text-gray-800'}`}
                                >
                                    <option value="pending">Waiting</option>
                                    <option value="review">Review</option>
                                    <option value="accepted">Accepted</option>
                                    <option value="rejected">Blocked</option>
                                </select>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {Math.floor(user.percentage_share || 0)}%
                            </td>
                        </>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button 
                            onClick={() => handleView(user)}
                            className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Details"
                        >
                            <Eye size={18} />
                        </button>
                        <button 
                            onClick={() => handleEdit(user)}
                            className="p-2 text-purple-600 hover:text-purple-900 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Edit User"
                        >
                            <Edit2 size={18} />
                        </button>
                        <button 
                            onClick={() => handleDelete(user)}
                            className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete User"
                        >
                            <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Action Modal */}
      {(quickActionUser && quickActionType) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="bg-white rounded-xl shadow-xl p-6 w-[400px] max-w-[90%]">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                      {quickActionType === 'accept' ? 'Accept User' : 'Block User'}
                  </h3>
                  
                  {quickActionType === 'accept' ? (
                      <div className="mb-6">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                              Percentage Share (%) <span className="text-red-500">*</span>
                          </label>
                          <input 
                              type="number" 
                              value={quickShare}
                              onChange={(e) => setQuickShare(Math.floor(Number(e.target.value)))}
                              className="glass-input w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                              placeholder="e.g. 70"
                              min="0"
                              max="100"
                              step="1"
                              onKeyDown={(e) => {
                                  if (e.key === '.' || e.key === ',') {
                                      e.preventDefault();
                                  }
                              }}
                              autoFocus
                          />
                          <p className="text-xs text-gray-500 mt-1">Wajib diisi untuk pembagian hasil.</p>
                      </div>
                  ) : (
                      <div className="mb-6">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                              Reason for Blocking <span className="text-red-500">*</span>
                          </label>
                          <textarea 
                              value={quickReason}
                              onChange={(e) => setQuickReason(e.target.value)}
                              className="glass-input w-full h-24 p-2 border border-gray-300 rounded-md resize-none focus:ring-red-500 focus:border-red-500"
                              placeholder="Please provide a reason..."
                              autoFocus
                          />
                      </div>
                  )}

                  <div className="flex gap-3">
                      <button 
                          onClick={() => {
                              setQuickActionUser(null);
                              setQuickActionType(null);
                          }}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                      >
                          Cancel
                      </button>
                      <button 
                          onClick={handleQuickSubmit}
                          disabled={
                              (quickActionType === 'accept' && (!quickShare || quickShare <= 0)) ||
                              (quickActionType === 'reject' && !quickReason.trim())
                          }
                          className={`flex-1 px-4 py-2 text-white rounded-lg font-medium transition-colors
                              ${quickActionType === 'accept' 
                                  ? 'bg-green-600 hover:bg-green-700' 
                                  : 'bg-red-600 hover:bg-red-700'}
                              disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                          Confirm
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Edit User Modal */}
      {showStatusModal && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="bg-white rounded-xl shadow-xl p-6 w-[500px] max-w-[90%] max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-6 border-b pb-4">
                      <h3 className="text-xl font-bold text-gray-900">Edit User</h3>
                      <button onClick={() => setShowStatusModal(false)} className="text-gray-400 hover:text-gray-600">
                          <XCircle size={24} />
                      </button>
                  </div>
                  
                  <div className="space-y-6">
                      {/* Basic Info */}
                      <div className="space-y-4">
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                              <input
                                  type="text"
                                  value={statusForm.name}
                                  onChange={(e) => setStatusForm({...statusForm, name: e.target.value})}
                                  className="glass-input w-full"
                              />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                              <input
                                  type="email"
                                  value={statusForm.email}
                                  onChange={(e) => setStatusForm({...statusForm, email: e.target.value})}
                                  className="glass-input w-full"
                              />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
                              <input
                                  type="text"
                                  value={statusForm.whatsapp}
                                  onChange={(e) => setStatusForm({...statusForm, whatsapp: e.target.value})}
                                  className="glass-input w-full"
                              />
                          </div>
                      </div>

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
                      <div className="space-y-4">
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Account Status</label>
                              <div className="grid grid-cols-2 gap-3">
                                  {/* Only Accepted and Block User (Rejected) */}
                                  {[
                                      { value: 'accepted', label: 'Accepted', icon: CheckCircle, color: 'text-green-700 bg-green-50 border-green-600' },
                                      { value: 'rejected', label: 'Block User', icon: UserX, color: 'text-red-700 bg-red-50 border-red-600' }
                                  ].map(option => (
                                      <button
                                          key={option.value}
                                          onClick={() => setStatusForm({...statusForm, status: option.value})}
                                          className={`px-4 py-3 rounded-lg text-sm font-medium border transition-all flex items-center justify-center gap-2
                                              ${statusForm.status === option.value 
                                                  ? `${option.color} ring-1 ring-offset-1` 
                                                  : 'border-gray-200 hover:bg-gray-50 text-gray-600'}`}
                                      >
                                          <option.icon size={18} />
                                          <span className="capitalize">{option.label}</span>
                                      </button>
                                  ))}
                              </div>
                          </div>

                          {/* Percentage Share - Always editable for users */}
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Percentage Share (%)</label>
                              <div className="relative">
                                  <input 
                                      type="number" 
                                      value={statusForm.percentage_share}
                                      onChange={(e) => setStatusForm({...statusForm, percentage_share: Math.floor(Number(e.target.value))})}
                                      className="glass-input w-full pr-8"
                                      placeholder="e.g. 70"
                                      min="0"
                                      max="100"
                                      step="1"
                                      onKeyDown={(e) => {
                                          if (e.key === '.' || e.key === ',') {
                                              e.preventDefault();
                                          }
                                      }}
                                  />
                                  <span className="absolute right-3 top-2.5 text-gray-400 text-sm">%</span>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">Share pendapatan untuk user ini.</p>
                          </div>
                      </div>
                      )}

                      {/* Review Specific Fields - Removed as per new requirement, Percentage Share is now global */}


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

      {/* View User Modal */}
      {showViewModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl p-6 w-[600px] max-w-[90%] max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <h3 className="text-xl font-bold text-gray-900">User Details</h3>
                    <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-gray-600">
                        <XCircle size={24} />
                    </button>
                </div>
                
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="text-xs text-gray-500 uppercase font-semibold">Full Name</label>
                            <p className="text-gray-900 font-medium">{selectedUser.name}</p>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 uppercase font-semibold">Email</label>
                            <p className="text-gray-900 font-medium">{selectedUser.email}</p>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 uppercase font-semibold">WhatsApp</label>
                            <p className="text-gray-900 font-medium">{selectedUser.whatsapp || '-'}</p>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 uppercase font-semibold">Role</label>
                            <p className="text-gray-900 font-medium capitalize">{selectedUser.role}</p>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 uppercase font-semibold">Status</label>
                            <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full mt-1
                                ${(selectedUser.status || 'pending') === 'accepted' ? 'bg-green-100 text-green-800' : 
                                (selectedUser.status || 'pending') === 'review' ? 'bg-yellow-100 text-yellow-800' : 
                                (selectedUser.status || 'pending') === 'rejected' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'}`}>
                                {selectedUser.status || 'pending'}
                            </span>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 uppercase font-semibold">Percentage Share</label>
                            <p className="text-gray-900 font-medium">{Math.floor(selectedUser.percentage_share || 0)}%</p>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 uppercase font-semibold">Joined Date</label>
                            <p className="text-gray-900 font-medium">{selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString() : '-'}</p>
                        </div>
                    </div>

                    <div className="border-t pt-4">
                        <h4 className="font-semibold text-gray-900 mb-3">Address Information</h4>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="col-span-2">
                                <label className="text-xs text-gray-500 uppercase font-semibold">Address</label>
                                <p className="text-gray-900">{selectedUser.address || '-'}</p>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase font-semibold">Country</label>
                                <p className="text-gray-900">{selectedUser.country || '-'}</p>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase font-semibold">Province</label>
                                <p className="text-gray-900">{selectedUser.province || '-'}</p>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase font-semibold">City</label>
                                <p className="text-gray-900">{selectedUser.city || '-'}</p>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase font-semibold">District</label>
                                <p className="text-gray-900">{selectedUser.district || '-'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Verification Actions Removed */}

                </div>
            </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl p-6 w-[400px] max-w-[90%] text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trash2 className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Delete User?</h3>
                <p className="text-gray-600 mb-6">
                    Are you sure you want to delete <span className="font-semibold">{selectedUser.name}</span>? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                    <button 
                        onClick={() => setShowDeleteModal(false)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={confirmDelete}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default UserList;
