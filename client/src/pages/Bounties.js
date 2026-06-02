import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { FiAward, FiClock } from 'react-icons/fi';
import toast from 'react-hot-toast';

const BountyCard = ({ bounty, currentUser, onAwarded }) => {
  const [answers, setAnswers] = useState([]);
  const [loadingAnswers, setLoadingAnswers] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const [awarding, setAwarding] = useState(false);

  const isOwner = currentUser && String(currentUser._id || currentUser.id) === String(bounty.author?._id);
  const hasWinner = !!bounty.bountyWinner;

  const loadAnswers = async () => {
    setLoadingAnswers(true);
    try {
      const res = await api.get(`/questions/${bounty._id}`);
      setAnswers(res.data.answers || []);
    } catch (e) {
      toast.error('Could not load answers');
    }
    setLoadingAnswers(false);
  };

  const toggleAnswers = () => {
    if (!showAnswers) loadAnswers();
    setShowAnswers(s => !s);
  };

  const award = async (answerId) => {
    if (!window.confirm(`Award this bounty (+${bounty.bountyAmount} reputation) to the selected answer?`)) return;
    setAwarding(true);
    try {
      await api.post(`/bounties/${bounty._id}/award/${answerId}`);
      toast.success('Bounty awarded!');
      onAwarded();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to award bounty');
    }
    setAwarding(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-bold">
              +{bounty.bountyAmount} reputation
            </span>
            <span className="text-gray-500 text-sm flex items-center">
              <FiClock className="mr-1" />
              Expires {new Date(bounty.bountyExpiresAt).toLocaleDateString()}
            </span>
            {hasWinner && (
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Awarded</span>
            )}
          </div>
          <Link to={`/questions/${bounty._id}`} className="text-xl font-semibold hover:text-orange-600">
            {bounty.title}
          </Link>
          <p className="text-sm text-gray-500 mt-1">
            Asked by {bounty.author?.name}
            {bounty.bountyCreator && bounty.bountyCreator._id !== bounty.author?._id && (
              <> · Bounty offered by {bounty.bountyCreator.name}</>
            )}
          </p>
        </div>
        {isOwner && !hasWinner && (
          <button
            onClick={toggleAnswers}
            className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 whitespace-nowrap"
          >
            {showAnswers ? 'Hide answers' : 'Award Bounty'}
          </button>
        )}
      </div>

      {showAnswers && isOwner && !hasWinner && (
        <div className="mt-4 pt-4 border-t">
          <h4 className="font-semibold mb-2 text-sm text-gray-700">Pick an answer to award:</h4>
          {loadingAnswers ? (
            <p className="text-sm text-gray-500">Loading answers…</p>
          ) : answers.length === 0 ? (
            <p className="text-sm text-gray-500">No answers yet — be patient!</p>
          ) : (
            <ul className="space-y-2">
              {answers.map(a => (
                <li key={a._id} className="flex items-start gap-3 p-3 border rounded">
                  <div className="text-sm text-gray-600 w-12 text-center">
                    <div className="font-bold">{(a.upvotes?.length || 0) - (a.downvotes?.length || 0)}</div>
                    <div className="text-xs">votes</div>
                  </div>
                  <div className="flex-1 text-sm text-gray-700 line-clamp-3">
                    {a.body?.replace(/[#*`>]/g, '').substring(0, 200)}…
                    <div className="text-xs text-gray-500 mt-1">by {a.author?.name}</div>
                  </div>
                  <button
                    disabled={awarding}
                    onClick={() => award(a._id)}
                    className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50 whitespace-nowrap"
                  >
                    Award +{bounty.bountyAmount}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

const Bounties = () => {
  const { user } = useAuth();
  const [bounties, setBounties] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBounties = async () => {
    try {
      const res = await api.get('/bounties/active');
      setBounties(res.data);
    } catch (error) {
      console.error('Error fetching bounties:', error);
    }
    setLoading(false);
  };

  useEffect(() => { fetchBounties(); }, []);

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Active Bounties</h1>

      {bounties.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <FiAward className="text-6xl text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">No active bounties</h2>
          <p className="text-gray-500 mb-4">Be the first to offer a bounty on a question!</p>
          <Link to="/questions" className="text-orange-600 hover:text-orange-700">
            Browse questions →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bounties.map(b => (
            <BountyCard key={b._id} bounty={b} currentUser={user} onAwarded={fetchBounties} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Bounties;
