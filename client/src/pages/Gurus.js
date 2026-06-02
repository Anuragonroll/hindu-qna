import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { FiStar, FiGlobe, FiBook } from 'react-icons/fi';
import toast from 'react-hot-toast';

const Gurus = () => {
  const [gurus, setGurus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('');

  useEffect(() => {
    fetchGurus();
  }, [tierFilter]);

  const fetchGurus = async () => {
    try {
      const params = {};
      if (tierFilter) params.tier = tierFilter;
      const res = await api.get('/guru/profiles', { params });
      setGurus(res.data);
    } catch (err) {
      toast.error('Failed to load gurus');
    }
    setLoading(false);
  };

  const filtered = gurus.filter(g => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      g.displayName?.toLowerCase().includes(s) ||
      g.shortBio?.toLowerCase().includes(s) ||
      g.sampradaya?.toLowerCase().includes(s) ||
      g.expertise?.some(e => e.toLowerCase().includes(s)) ||
      g.lineage?.toLowerCase().includes(s)
    );
  });

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">🕉️ Our Verified Gurus & Scholars</h1>
      <p className="text-gray-600 mb-6">
        A small, hand-picked group of {gurus.length} verified experts who keep this platform accurate and authentic.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          placeholder="Search by name, sampradaya, expertise..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 border rounded-lg px-3 py-2"
        />
        <select value={tierFilter} onChange={e => setTierFilter(e.target.value)} className="border rounded-lg px-3 py-2">
          <option value="">All Tiers</option>
          <option value="acharya">Acharya</option>
          <option value="guru">Guru</option>
          <option value="scholar">Scholar</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No gurus match your search.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(g => (
            <div key={g._id} className="bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition">
              <div className="flex items-start gap-3">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-200 to-yellow-200 flex items-center justify-center text-orange-700 font-bold text-2xl flex-shrink-0 overflow-hidden">
                  {g.photo ? (
                    <img src={g.photo} alt={g.displayName} className="w-full h-full object-cover" />
                  ) : (
                    g.displayName?.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg leading-tight">
                    {g.honorific ? `${g.honorific} ` : ''}{g.displayName}
                  </h3>
                  <div className="flex items-center gap-1 mt-1 flex-wrap">
                    {g.tier === 'acharya' && (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">Acharya</span>
                    )}
                    {g.tier === 'guru' && (
                      <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">Guru</span>
                    )}
                    {g.tier === 'scholar' && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Scholar</span>
                    )}
                    {g.isFeatured && (
                      <span className="text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded flex items-center">
                        <FiStar size={10} className="mr-1" /> Featured
                      </span>
                    )}
                  </div>
                  {g.sampradaya && (
                    <div className="text-xs text-gray-500 mt-1">{g.sampradaya}</div>
                  )}
                </div>
              </div>
              {g.shortBio && (
                <p className="text-sm text-gray-700 mt-3 italic line-clamp-3">"{g.shortBio}"</p>
              )}
              {g.expertise?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {g.expertise.slice(0, 4).map((e, i) => (
                    <span key={i} className="text-xs bg-orange-50 text-orange-800 px-2 py-0.5 rounded">
                      {e}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-3 pt-3 border-t text-xs text-gray-500 flex flex-wrap gap-3">
                {g.currentPosition && <span className="truncate flex-1">{g.currentPosition}</span>}
                {g.location && <span className="flex items-center"><FiGlobe size={10} className="mr-1" />{g.location}</span>}
              </div>
              {g.lineage && (
                <div className="mt-2 text-xs text-gray-500 truncate">
                  <FiBook size={10} className="inline mr-1" /> {g.lineage}
                </div>
              )}
              {g.website && (
                <a href={g.website} target="_blank" rel="noopener noreferrer" className="text-xs text-orange-600 hover:underline mt-2 inline-block">
                  Visit website ↗
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Gurus;
