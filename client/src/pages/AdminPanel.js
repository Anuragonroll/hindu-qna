import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { FiUsers, FiMessageSquare, FiTag, FiSettings, FiCheck, FiX, FiCpu, FiUserCheck, FiEdit2, FiTrash2, FiKey, FiStar } from 'react-icons/fi';
import toast from 'react-hot-toast';

const emptyGuruForm = {
  name: '',
  email: '',
  password: '',
  role: 'guru',
  displayName: '',
  honorific: '',
  photo: '',
  shortBio: '',
  bio: '',
  lineage: '',
  sampradaya: '',
  expertise: '',
  scriptures: '',
  languages: 'English, Hindi, Sanskrit',
  yearsOfStudy: 0,
  currentPosition: '',
  institution: '',
  location: '',
  website: '',
  tier: 'guru',
  isFeatured: false,
  notes: ''
};

const GuruFormModal = ({ initial, onClose, onSave }) => {
  const [form, setForm] = useState(initial || emptyGuruForm);
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      if (initial && initial._id) {
        delete payload.name;
        delete payload.email;
        delete payload.password;
        await api.put(`/admin/gurus/profiles/${initial._id}`, payload);
        toast.success('Guru profile updated');
      } else {
        if (!form.password) delete payload.password;
        await api.post('/admin/gurus/profiles', payload);
        toast.success('Guru created');
      }
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save guru');
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={submit} className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">{initial?._id ? 'Edit Guru' : 'Add Verified Guru'}</h2>
            <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <FiX size={24} />
            </button>
          </div>

          {!initial?._id && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="block">
                <span className="text-sm text-gray-700">Full name *</span>
                <input required className="w-full border rounded px-3 py-2 mt-1"
                  value={form.name} onChange={e => set('name', e.target.value)} />
              </label>
              <label className="block">
                <span className="text-sm text-gray-700">Email *</span>
                <input required type="email" className="w-full border rounded px-3 py-2 mt-1"
                  value={form.email} onChange={e => set('email', e.target.value)} />
              </label>
              <label className="block">
                <span className="text-sm text-gray-700">Temporary password (optional)</span>
                <input type="text" placeholder="default: guru123" className="w-full border rounded px-3 py-2 mt-1"
                  value={form.password} onChange={e => set('password', e.target.value)} />
              </label>
              <label className="block">
                <span className="text-sm text-gray-700">User role</span>
                <select className="w-full border rounded px-3 py-2 mt-1"
                  value={form.role} onChange={e => set('role', e.target.value)}>
                  <option value="guru">Guru</option>
                  <option value="acharya">Acharya</option>
                  <option value="scholar">Scholar</option>
                </select>
              </label>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm text-gray-700">Display name</span>
              <input className="w-full border rounded px-3 py-2 mt-1"
                value={form.displayName} onChange={e => set('displayName', e.target.value)} />
            </label>
            <label className="block">
              <span className="text-sm text-gray-700">Honorific (Sri Sri, Swami, etc.)</span>
              <input className="w-full border rounded px-3 py-2 mt-1"
                value={form.honorific} onChange={e => set('honorific', e.target.value)} />
            </label>
            <label className="block md:col-span-2">
              <span className="text-sm text-gray-700">Photo URL</span>
              <input className="w-full border rounded px-3 py-2 mt-1"
                value={form.photo} onChange={e => set('photo', e.target.value)} />
            </label>
            <label className="block md:col-span-2">
              <span className="text-sm text-gray-700">Short bio (max 280)</span>
              <input className="w-full border rounded px-3 py-2 mt-1"
                value={form.shortBio} onChange={e => set('shortBio', e.target.value)} />
            </label>
            <label className="block md:col-span-2">
              <span className="text-sm text-gray-700">Full bio</span>
              <textarea className="w-full border rounded px-3 py-2 mt-1" rows="3"
                value={form.bio} onChange={e => set('bio', e.target.value)} />
            </label>
            <label className="block md:col-span-2">
              <span className="text-sm text-gray-700">Lineage</span>
              <input placeholder="e.g. Ramakrishna -> Vivekananda -> Sarvapriyananda"
                className="w-full border rounded px-3 py-2 mt-1"
                value={form.lineage} onChange={e => set('lineage', e.target.value)} />
            </label>
            <label className="block">
              <span className="text-sm text-gray-700">Sampradaya</span>
              <input placeholder="e.g. Advaita Vedanta" className="w-full border rounded px-3 py-2 mt-1"
                value={form.sampradaya} onChange={e => set('sampradaya', e.target.value)} />
            </label>
            <label className="block">
              <span className="text-sm text-gray-700">Tier</span>
              <select className="w-full border rounded px-3 py-2 mt-1"
                value={form.tier} onChange={e => set('tier', e.target.value)}>
                <option value="scholar">Scholar</option>
                <option value="guru">Guru</option>
                <option value="acharya">Acharya</option>
              </select>
            </label>
            <label className="block md:col-span-2">
              <span className="text-sm text-gray-700">Expertise (comma separated)</span>
              <input className="w-full border rounded px-3 py-2 mt-1"
                value={form.expertise} onChange={e => set('expertise', e.target.value)} />
            </label>
            <label className="block md:col-span-2">
              <span className="text-sm text-gray-700">Scriptures (comma separated)</span>
              <input className="w-full border rounded px-3 py-2 mt-1"
                value={form.scriptures} onChange={e => set('scriptures', e.target.value)} />
            </label>
            <label className="block md:col-span-2">
              <span className="text-sm text-gray-700">Languages (comma separated)</span>
              <input className="w-full border rounded px-3 py-2 mt-1"
                value={form.languages} onChange={e => set('languages', e.target.value)} />
            </label>
            <label className="block">
              <span className="text-sm text-gray-700">Years of study</span>
              <input type="number" min="0" className="w-full border rounded px-3 py-2 mt-1"
                value={form.yearsOfStudy} onChange={e => set('yearsOfStudy', parseInt(e.target.value) || 0)} />
            </label>
            <label className="block">
              <span className="text-sm text-gray-700">Current position</span>
              <input className="w-full border rounded px-3 py-2 mt-1"
                value={form.currentPosition} onChange={e => set('currentPosition', e.target.value)} />
            </label>
            <label className="block md:col-span-2">
              <span className="text-sm text-gray-700">Institution</span>
              <input className="w-full border rounded px-3 py-2 mt-1"
                value={form.institution} onChange={e => set('institution', e.target.value)} />
            </label>
            <label className="block">
              <span className="text-sm text-gray-700">Location</span>
              <input className="w-full border rounded px-3 py-2 mt-1"
                value={form.location} onChange={e => set('location', e.target.value)} />
            </label>
            <label className="block">
              <span className="text-sm text-gray-700">Website</span>
              <input className="w-full border rounded px-3 py-2 mt-1"
                value={form.website} onChange={e => set('website', e.target.value)} />
            </label>
            <label className="block md:col-span-2">
              <span className="text-sm text-gray-700">Internal notes (only admins see this)</span>
              <textarea className="w-full border rounded px-3 py-2 mt-1" rows="2"
                value={form.notes} onChange={e => set('notes', e.target.value)} />
            </label>
            <label className="block md:col-span-2 flex items-center space-x-2">
              <input type="checkbox" checked={form.isFeatured} onChange={e => set('isFeatured', e.target.checked)} />
              <span className="text-sm">Featured guru (show on home page)</span>
            </label>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
            <button type="submit" disabled={saving}
              className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50">
              {saving ? 'Saving...' : (initial?._id ? 'Save Changes' : 'Create Guru')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AdminPanel = () => {
  const { isAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [aiAnswers, setAiAnswers] = useState([]);
  const [gurus, setGurus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [guruSearch, setGuruSearch] = useState('');
  const [editingGuru, setEditingGuru] = useState(null);
  const [showGuruForm, setShowGuruForm] = useState(false);

  useEffect(() => {
    if (!isAdmin()) {
      toast.error('Access denied. Admin privileges required.');
      return;
    }
    fetchData();
  }, [isAdmin]);

  const fetchData = async () => {
    try {
      const [statsRes, usersRes, aiRes, gurusRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/ai-answers/pending'),
        api.get('/admin/gurus/profiles')
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data.users);
      setAiAnswers(aiRes.data.answers);
      setGurus(gurusRes.data);
    } catch (error) {
      toast.error('Error loading admin data');
    }
    setLoading(false);
  };

  const handleVerifyAI = async (answerId, note) => {
    try {
      await api.post(`/admin/ai-answers/${answerId}/verify`, { note });
      toast.success('AI answer verified!');
      setAiAnswers(prev => prev.filter(a => a._id !== answerId));
    } catch (error) {
      toast.error('Error verifying AI answer');
    }
  };

  const handleRejectAI = async (answerId) => {
    try {
      await api.post(`/admin/ai-answers/${answerId}/reject`);
      toast.success('AI answer rejected');
      setAiAnswers(prev => prev.filter(a => a._id !== answerId));
    } catch (error) {
      toast.error('Error rejecting AI answer');
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      toast.success('User role updated');
      fetchData();
    } catch (error) {
      toast.error('Error updating user role');
    }
  };

  const handleApproveGuru = async (userId) => {
    try {
      await api.post('/admin/gurus/approve', { userId });
      toast.success('Guru approved!');
      fetchData();
    } catch (error) {
      toast.error('Error approving guru');
    }
  };

  const handleDeleteGuru = async (profile) => {
    if (!window.confirm(`Delete guru profile "${profile.displayName}"?`)) return;
    const deleteUser = window.confirm('Also delete the linked user account? Click OK to delete user, Cancel to demote to user.');
    try {
      await api.delete(`/admin/gurus/profiles/${profile._id}`, { data: { deleteUser } });
      toast.success('Guru profile deleted');
      fetchData();
    } catch (error) {
      toast.error('Error deleting guru');
    }
  };

  const handleResetPassword = async (profile) => {
    try {
      const res = await api.post(`/admin/gurus/profiles/${profile._id}/reset-password`, {});
      toast.success(`New password: ${res.data.temporaryPassword}`);
    } catch (error) {
      toast.error('Error resetting password');
    }
  };

  const openCreate = () => {
    setEditingGuru(null);
    setShowGuruForm(true);
  };

  const openEdit = (profile) => {
    const init = {
      _id: profile._id,
      displayName: profile.displayName || '',
      honorific: profile.honorific || '',
      photo: profile.photo || '',
      shortBio: profile.shortBio || '',
      bio: profile.bio || '',
      lineage: profile.lineage || '',
      sampradaya: profile.sampradaya || '',
      expertise: (profile.expertise || []).join(', '),
      scriptures: (profile.scriptures || []).join(', '),
      languages: (profile.languages || []).join(', '),
      yearsOfStudy: profile.yearsOfStudy || 0,
      currentPosition: profile.currentPosition || '',
      institution: profile.institution || '',
      location: profile.location || '',
      website: profile.website || '',
      tier: profile.tier || 'guru',
      isFeatured: !!profile.isFeatured,
      notes: profile.notes || ''
    };
    setEditingGuru(init);
    setShowGuruForm(true);
  };

  if (!isAdmin()) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <h1 className="text-3xl font-bold mb-4">Admin Panel</h1>
        <p className="text-gray-600">Access denied. Admin privileges required.</p>
      </div>
    );
  }

  if (loading) return <div className="text-center py-8">Loading...</div>;

  const filteredGurus = gurus.filter(g =>
    !guruSearch ||
    g.displayName?.toLowerCase().includes(guruSearch.toLowerCase()) ||
    g.user?.email?.toLowerCase().includes(guruSearch.toLowerCase()) ||
    g.sampradaya?.toLowerCase().includes(guruSearch.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <FiUsers className="text-4xl text-blue-500 mx-auto mb-2" />
          <div className="text-3xl font-bold">{stats?.users || 0}</div>
          <div className="text-gray-600">Users</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <FiMessageSquare className="text-4xl text-orange-500 mx-auto mb-2" />
          <div className="text-3xl font-bold">{stats?.questions || 0}</div>
          <div className="text-gray-600">Questions</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <FiTag className="text-4xl text-green-500 mx-auto mb-2" />
          <div className="text-3xl font-bold">{stats?.tags || 0}</div>
          <div className="text-gray-600">Tags</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <FiSettings className="text-4xl text-purple-500 mx-auto mb-2" />
          <div className="text-3xl font-bold">{stats?.gurus || 0}</div>
          <div className="text-gray-600">Gurus</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b overflow-x-auto">
          <div className="flex">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-4 font-semibold whitespace-nowrap ${activeTab === 'overview' ? 'border-b-2 border-orange-600 text-orange-600' : 'text-gray-500'}`}
            >
              Users
            </button>
            <button
              onClick={() => setActiveTab('gurus')}
              className={`px-6 py-4 font-semibold whitespace-nowrap flex items-center ${activeTab === 'gurus' ? 'border-b-2 border-orange-600 text-orange-600' : 'text-gray-500'}`}
            >
              <FiUserCheck className="mr-1" /> Guru Management ({gurus.length})
            </button>
            <button
              onClick={() => setActiveTab('ai-answers')}
              className={`px-6 py-4 font-semibold whitespace-nowrap flex items-center ${activeTab === 'ai-answers' ? 'border-b-2 border-orange-600 text-orange-600' : 'text-gray-500'}`}
            >
              <FiCpu className="mr-1" /> AI Answers ({aiAnswers.length})
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'overview' ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3">User</th>
                    <th className="text-left py-3">Email</th>
                    <th className="text-left py-3">Role</th>
                    <th className="text-left py-3">Reputation</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u._id} className="border-b hover:bg-gray-50">
                      <td className="py-3">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-orange-400 rounded-full flex items-center justify-center text-white mr-2">
                            {u.name?.charAt(0).toUpperCase()}
                          </div>
                          {u.name}
                        </div>
                      </td>
                      <td className="py-3">{u.email}</td>
                      <td className="py-3">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u._id, e.target.value)}
                          className="border rounded px-2 py-1"
                        >
                          <option value="user">User</option>
                          <option value="scholar">Scholar</option>
                          <option value="guru">Guru</option>
                          <option value="acharya">Acharya</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="py-3">{u.reputation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : activeTab === 'gurus' ? (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-2">
                <p className="text-gray-600">Manage the small, manually-curated pool of verified gurus.</p>
                <button
                  onClick={openCreate}
                  className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 whitespace-nowrap"
                >
                  + Add Verified Guru
                </button>
              </div>
              <input
                placeholder="Search by name, email, sampradaya..."
                className="w-full border rounded px-3 py-2"
                value={guruSearch}
                onChange={e => setGuruSearch(e.target.value)}
              />
              {filteredGurus.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No gurus yet. Add the first one.</p>
              ) : (
                <div className="space-y-3">
                  {filteredGurus.map(g => (
                    <div key={g._id} className="border rounded-lg p-4 flex flex-col md:flex-row md:items-start gap-4">
                      <div className="w-14 h-14 rounded-full bg-orange-200 flex items-center justify-center text-orange-700 font-bold text-xl flex-shrink-0 overflow-hidden">
                        {g.photo ? (
                          <img src={g.photo} alt={g.displayName} className="w-full h-full object-cover" />
                        ) : (
                          g.displayName?.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center flex-wrap gap-2">
                          <h3 className="font-semibold text-lg">
                            {g.honorific ? `${g.honorific} ` : ''}{g.displayName}
                          </h3>
                          {g.tier === 'acharya' && (
                            <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">Acharya</span>
                          )}
                          {g.tier === 'guru' && (
                            <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">Guru</span>
                          )}
                          {g.tier === 'scholar' && (
                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Scholar</span>
                          )}
                          {g.isFeatured && (
                            <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded flex items-center">
                              <FiStar className="mr-1" size={10} /> Featured
                            </span>
                          )}
                          {g.verificationStatus !== 'verified' && (
                            <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">{g.verificationStatus}</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">{g.user?.email}</div>
                        {g.shortBio && <p className="text-sm text-gray-700 mt-1 italic">"{g.shortBio}"</p>}
                        <div className="text-xs text-gray-600 mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1">
                          {g.sampradaya && <div><strong>Sampradaya:</strong> {g.sampradaya}</div>}
                          {g.lineage && <div className="truncate"><strong>Lineage:</strong> {g.lineage}</div>}
                          {g.institution && <div><strong>Institution:</strong> {g.institution}</div>}
                          {g.location && <div><strong>Location:</strong> {g.location}</div>}
                          {g.expertise?.length > 0 && <div className="sm:col-span-2"><strong>Expertise:</strong> {g.expertise.join(', ')}</div>}
                          {g.scriptures?.length > 0 && <div className="sm:col-span-2"><strong>Scriptures:</strong> {g.scriptures.join(', ')}</div>}
                        </div>
                        <div className="text-xs text-gray-500 mt-2 flex flex-wrap gap-3">
                          <span>📝 {g.stats?.answersPosted || 0} answers</span>
                          <span>✅ {g.stats?.answersVerified || 0} verified</span>
                          <span>🛡️ {g.stats?.questionsModerated || 0} moderated</span>
                          <span>🏷️ {g.stats?.commentsBadged || 0} badged</span>
                        </div>
                      </div>
                      <div className="flex md:flex-col gap-2 flex-shrink-0">
                        <button onClick={() => openEdit(g)} className="text-blue-600 hover:text-blue-800 flex items-center text-sm" title="Edit">
                          <FiEdit2 className="mr-1" /> Edit
                        </button>
                        <button onClick={() => handleResetPassword(g)} className="text-purple-600 hover:text-purple-800 flex items-center text-sm" title="Reset password">
                          <FiKey className="mr-1" /> Reset PW
                        </button>
                        <button onClick={() => handleDeleteGuru(g)} className="text-red-600 hover:text-red-800 flex items-center text-sm" title="Delete">
                          <FiTrash2 className="mr-1" /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : activeTab === 'ai-answers' ? (
            <div className="space-y-4">
              <p className="text-gray-600 mb-4">Review and verify AI-generated answers</p>
              {aiAnswers.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No pending AI answers to review</p>
              ) : (
                aiAnswers.map(answer => (
                  <div key={answer._id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <Link to={`/questions/${answer.question?._id}`} className="font-semibold text-lg hover:text-orange-600">
                          {answer.question?.title}
                        </Link>
                        <p className="text-sm text-gray-500 mt-1">
                          Asked by {answer.question?.author?.name} • AI Answer generated {new Date(answer.createdAt).toLocaleDateString()}
                        </p>
                        <div className="mt-2 text-sm text-gray-700 bg-gray-50 p-3 rounded max-h-40 overflow-y-auto">
                          {answer.body?.substring(0, 500)}...
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => {
                            const note = prompt('Add verification note (optional):');
                            handleVerifyAI(answer._id, note);
                          }}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-green-700"
                        >
                          <FiCheck className="mr-1" /> Verify
                        </button>
                        <button
                          onClick={() => handleRejectAI(answer._id)}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-red-700"
                        >
                          <FiX className="mr-1" /> Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : null}
        </div>
      </div>

      {showGuruForm && (
        <GuruFormModal
          initial={editingGuru}
          onClose={() => { setShowGuruForm(false); setEditingGuru(null); }}
          onSave={() => { setShowGuruForm(false); setEditingGuru(null); fetchData(); }}
        />
      )}
    </div>
  );
};

export default AdminPanel;
