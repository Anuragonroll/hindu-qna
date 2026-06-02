import React, { useState } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { FiPlus, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';

const GuruTagManager = ({ question, onChange }) => {
  const { canModerate } = useAuth();
  const [adding, setAdding] = useState(false);
  const [newTag, setNewTag] = useState('');

  if (!canModerate()) return null;

  const add = async () => {
    if (!newTag.trim()) return;
    try {
      await api.post(`/guru/questions/${question._id}/tags/add`, { tagName: newTag.trim() });
      toast.success('Tag added');
      setNewTag('');
      setAdding(false);
      if (onChange) onChange();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add tag');
    }
  };

  const remove = async (tagId) => {
    if (!window.confirm('Remove this tag from the question?')) return;
    try {
      await api.post(`/guru/questions/${question._id}/tags/remove`, { tagId });
      toast.success('Tag removed');
      if (onChange) onChange();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove tag');
    }
  };

  return (
    <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-semibold text-purple-800">🛡️ Guru: Manage Tags</div>
        {!adding ? (
          <button onClick={() => setAdding(true)} className="text-purple-700 hover:text-purple-900 text-xs flex items-center">
            <FiPlus size={12} className="mr-1" /> Add tag
          </button>
        ) : (
          <div className="flex items-center gap-1">
            <input
              autoFocus
              value={newTag}
              onChange={e => setNewTag(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') add(); if (e.key === 'Escape') { setAdding(false); setNewTag(''); } }}
              placeholder="tag-name"
              className="border rounded px-2 py-0.5 text-xs w-32"
            />
            <button onClick={add} className="text-purple-700 text-xs">Add</button>
            <button onClick={() => { setAdding(false); setNewTag(''); }} className="text-gray-500 text-xs">Cancel</button>
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-1">
        {question.tags?.map(t => (
          <span key={t._id} className="bg-orange-100 text-orange-800 px-2 py-0.5 rounded text-xs flex items-center gap-1">
            {t.name}
            <button onClick={() => remove(t._id)} className="hover:text-red-600" title="Remove tag">
              <FiX size={10} />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
};

export default GuruTagManager;
