import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../utils/api';
import { FiClock, FiTrendingUp, FiEye, FiArrowLeft } from 'react-icons/fi';

const TagDetail = () => {
  const { name } = useParams();
  const [tag, setTag] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('newest');

  useEffect(() => {
    fetchTagAndQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, sort]);

  const fetchTagAndQuestions = async () => {
    setLoading(true);
    try {
      const [tagRes, qsRes] = await Promise.all([
        api.get(`/tags/${name}`),
        api.get(`/tags/${name}/questions?sort=${sort}&limit=50`)
      ]);
      setTag(tagRes.data);
      setQuestions(qsRes.data.questions);
    } catch (error) {
      console.error('Error fetching tag:', error);
    }
    setLoading(false);
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (!tag) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <h1 className="text-2xl font-bold mb-4">Tag not found</h1>
        <Link to="/tags" className="text-orange-600 hover:underline">Browse all tags →</Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <Link to="/tags" className="inline-flex items-center text-sm text-gray-500 hover:text-orange-600 mb-4">
        <FiArrowLeft className="mr-1" /> All tags
      </Link>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded text-sm font-semibold">
            {tag.name}
          </span>
          <span className="text-sm text-gray-500">{tag.count} questions</span>
        </div>
        {tag.description && (
          <p className="text-gray-700 mt-2">{tag.description}</p>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-600">Sort by:</span>
          <button
            onClick={() => setSort('newest')}
            className={`px-3 py-1 rounded text-sm ${sort === 'newest' ? 'bg-orange-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
          >
            <FiClock className="inline mr-1" /> Newest
          </button>
          <button
            onClick={() => setSort('votes')}
            className={`px-3 py-1 rounded text-sm ${sort === 'votes' ? 'bg-orange-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
          >
            <FiTrendingUp className="inline mr-1" /> Votes
          </button>
          <button
            onClick={() => setSort('views')}
            className={`px-3 py-1 rounded text-sm ${sort === 'views' ? 'bg-orange-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
          >
            <FiEye className="inline mr-1" /> Views
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {questions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
            No questions yet for this tag.
          </div>
        ) : (
          questions.map(q => (
            <div key={q._id} className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
              <div className="flex">
                <div className="flex flex-col items-center mr-4 text-center min-w-[60px]">
                  <div className="text-lg font-bold">{(q.upvotes?.length || 0) - (q.downvotes?.length || 0)}</div>
                  <div className="text-xs text-gray-500">votes</div>
                  <div className={`text-lg font-bold ${q.answers?.length > 0 ? 'text-green-600' : ''}`}>
                    {q.answers?.length || 0}
                  </div>
                  <div className="text-xs text-gray-500">answers</div>
                </div>
                <div className="flex-1">
                  <Link to={`/questions/${q._id}`} className="text-lg font-semibold text-gray-800 hover:text-orange-600">
                    {q.title}
                  </Link>
                  <div className="text-sm text-gray-500 mt-2">
                    asked by {q.author?.name} • {new Date(q.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TagDetail;
