import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

const TYPE_PRIORITY = ['special', 'recognition', 'reputation', 'engagement', 'milestone'];

const FALLBACK_META = {
  'Verified Expert': { icon: '🪷', color: 'bg-rose-100 text-rose-800 border-rose-300' },
  'Administrator': { icon: '🛡️', color: 'bg-slate-100 text-slate-800 border-slate-300' },
  'Sage': { icon: '🦉', color: 'bg-purple-100 text-purple-800 border-purple-300' },
  'Pillar of the Community': { icon: '🏛️', color: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
  'Active Contributor': { icon: '✍️', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  'New Voice': { icon: '🌱', color: 'bg-green-100 text-green-800 border-green-300' },
  'Enlightened': { icon: '✨', color: 'bg-orange-100 text-orange-800 border-orange-300' },
  'Venerated': { icon: '🌟', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  'Reputable': { icon: '⭐', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  'Well Liked': { icon: '❤️', color: 'bg-pink-100 text-pink-800 border-pink-300' },
  'Accepted': { icon: '✅', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  'Inquirer': { icon: '❓', color: 'bg-teal-100 text-teal-800 border-teal-300' },
  'Curious Mind': { icon: '🔍', color: 'bg-cyan-100 text-cyan-800 border-cyan-300' }
};

const UserBadge = ({ author, max = 1, size = 'sm', linkToProfile = true }) => {
  const [badges, setBadges] = useState(null);
  const id = author?._id || author?.id;
  useEffect(() => {
    if (!id) { setBadges([]); return; }
    let cancelled = false;
    api.get(`/users/${id}/badges`)
      .then(r => { if (!cancelled) setBadges(r.data || []); })
      .catch(() => { if (!cancelled) setBadges([]); });
    return () => { cancelled = true; };
  }, [id]);

  if (!badges || badges.length === 0) return null;

  const sorted = [...badges].sort((a, b) => {
    const ai = TYPE_PRIORITY.indexOf(a.type);
    const bi = TYPE_PRIORITY.indexOf(b.type);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
  const shown = sorted.slice(0, max);

  const sizes = {
    xs: 'text-[10px] px-1.5 py-0',
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1'
  };

  const wrap = (content) => linkToProfile ? (
    <Link to={`/users/${id}`} className="inline-flex items-center gap-1 hover:opacity-80" onClick={e => e.stopPropagation()}>
      {content}
    </Link>
  ) : <span className="inline-flex items-center gap-1">{content}</span>;

  return (
    <span className="inline-flex items-center gap-1 ml-1 align-middle">
      {shown.map((b, i) => {
        const meta = FALLBACK_META[b.name] || { icon: '🏅', color: 'bg-gray-100 text-gray-800 border-gray-300' };
        return wrap(
          <span
            key={i}
            className={`inline-flex items-center gap-0.5 rounded border ${meta.color} ${sizes[size]}`}
            title={b.description || b.name}
          >
            <span>{meta.icon}</span>
            {max === 1 && <span className="font-medium">{b.name}</span>}
          </span>
        );
      })}
      {badges.length > max && (
        <Link to={`/users/${id}`} className="text-[10px] text-gray-500 hover:text-orange-600">
          +{badges.length - max}
        </Link>
      )}
    </span>
  );
};

export default UserBadge;
