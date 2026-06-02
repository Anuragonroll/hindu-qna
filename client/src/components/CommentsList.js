import React, { useState } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { FiAward, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';

const BADGE_LABELS = {
  insightful: { label: '💡 Insightful', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  helpful: { label: '🤝 Helpful', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  scriptural: { label: '📜 Scriptural', color: 'bg-purple-100 text-purple-800 border-purple-300' },
  clarification: { label: '🔍 Clarification', color: 'bg-teal-100 text-teal-800 border-teal-300' },
  verified: { label: '✅ Verified', color: 'bg-green-100 text-green-800 border-green-300' }
};

const CommentsList = ({ comments = [], postId, postType, onChange }) => {
  const { user, canModerate } = useAuth();
  const [newBody, setNewBody] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [badgeMenu, setBadgeMenu] = useState(null);

  const submit = async () => {
    if (!newBody.trim()) return;
    try {
      await api.post(`/comments/${postType}/${postId}`, { body: newBody });
      setNewBody('');
      setShowForm(false);
      toast.success('Comment added');
      if (onChange) onChange();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add comment');
    }
  };

  const applyBadge = async (commentId, badge) => {
    try {
      await api.post(`/guru/comments/${commentId}/badge`, { badge });
      toast.success('Badge applied');
      setBadgeMenu(null);
      if (onChange) onChange();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to badge comment');
    }
  };

  const removeBadge = async (commentId) => {
    try {
      await api.delete(`/guru/comments/${commentId}/badge`);
      toast.success('Badge removed');
      if (onChange) onChange();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove badge');
    }
  };

  return (
    <div className="mt-4 pl-16">
      {comments.length > 0 && (
        <div className="border-l-2 border-gray-200 pl-4 space-y-2 mb-2">
          {comments.map(c => {
            const badgeInfo = c.badge ? BADGE_LABELS[c.badge] : null;
            const isOwnBadge = c.badgedBy && user && String(c.badgedBy._id || c.badgedBy) === String(user._id || user.id);
            return (
              <div key={c._id} className="text-sm text-gray-700 group">
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <span>{c.body}</span> – <span className="text-orange-600">{c.author?.name}</span>
                    {badgeInfo && (
                      <span className={`ml-2 inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded border ${badgeInfo.color}`}>
                        {badgeInfo.label}
                        {c.badgeNote && <span className="font-normal italic ml-1">"{c.badgeNote}"</span>}
                        {canModerate() && (isOwnBadge || user?.role === 'admin') && (
                          <button
                            onClick={() => removeBadge(c._id)}
                            className="ml-1 hover:text-red-600"
                            title="Remove badge"
                          >
                            <FiX size={12} />
                          </button>
                        )}
                      </span>
                    )}
                  </div>
                  {canModerate() && !c.badge && String(c.author?._id) !== String(user?._id || user?.id) && (
                    <div className="relative">
                      <button
                        onClick={() => setBadgeMenu(badgeMenu === c._id ? null : c._id)}
                        className="opacity-0 group-hover:opacity-100 text-orange-600 hover:text-orange-800 flex items-center text-xs"
                        title="Badge this comment"
                      >
                        <FiAward size={14} />
                      </button>
                      {badgeMenu === c._id && (
                        <div className="absolute right-0 mt-1 bg-white border rounded shadow-lg z-10 w-40">
                          {Object.entries(BADGE_LABELS).map(([key, val]) => (
                            <button
                              key={key}
                              onClick={() => applyBadge(c._id, key)}
                              className="block w-full text-left px-3 py-1.5 hover:bg-gray-100 text-xs"
                            >
                              {val.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {user && (
        showForm ? (
          <div className="flex gap-2">
            <input
              value={newBody}
              onChange={e => setNewBody(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 border rounded px-2 py-1 text-sm"
              maxLength={500}
              onKeyDown={e => { if (e.key === 'Enter') submit(); }}
            />
            <button onClick={submit} className="bg-orange-600 text-white px-3 py-1 rounded text-sm">Add</button>
            <button onClick={() => { setShowForm(false); setNewBody(''); }} className="text-gray-500 text-sm">Cancel</button>
          </div>
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="text-xs text-gray-500 hover:text-orange-600"
          >
            + Add comment
          </button>
        )
      )}
    </div>
  );
};

export default CommentsList;
