import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import MarkdownRenderer from '../components/MarkdownRenderer';
import ShlokaCard from '../components/ShlokaCard';
import ShlokaAutocomplete from '../components/ShlokaAutocomplete';
import CommentsList from '../components/CommentsList';
import GuruTagManager from '../components/GuruTagManager';
import UserBadge from '../components/UserBadge';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { FiArrowUp, FiArrowDown, FiCheck, FiBookmark, FiTrash2, FiInfo } from 'react-icons/fi';
import toast from 'react-hot-toast';

const QuestionDetail = () => {
  const { id } = useParams();
  const { user, isGuru, canModerate } = useAuth();
  const navigate = useNavigate();
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answerBody, setAnswerBody] = useState('');
  const [voting, setVoting] = useState(false);
  const [shlokaPreview, setShlokaPreview] = useState([]);
  const [previewing, setPreviewing] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  useEffect(() => {
    fetchQuestion();
    if (user) checkFavorited();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

  const checkFavorited = async () => {
    try {
      const res = await api.get(`/users/${user._id || user.id}/favorites`);
      const ids = (res.data || []).map(q => (q._id || q).toString());
      setFavorited(ids.includes(id));
    } catch {}
  };

  const toggleFavorite = async () => {
    if (!user) return toast.error('Please login to bookmark');
    setFavLoading(true);
    try {
      await api.post(`/users/favorites/${id}`);
      setFavorited(f => !f);
      toast.success(favorited ? 'Removed from bookmarks' : 'Bookmarked!');
    } catch (e) {
      toast.error('Could not update bookmark');
    }
    setFavLoading(false);
  };

  const fetchQuestion = async () => {
    try {
      const res = await api.get(`/questions/${id}`);
      setQuestion(res.data);

      const viewed = JSON.parse(localStorage.getItem('viewedQuestions') || '[]');
      if (!viewed.includes(id)) {
        await api.post(`/questions/${id}/view`);
        viewed.push(id);
        localStorage.setItem('viewedQuestions', JSON.stringify(viewed));
        setQuestion(prev => ({ ...prev, views: (prev.views || 0) + 1 }));
      }
    } catch (error) {
      toast.error('Error loading question');
    }
    setLoading(false);
  };

  const handleVote = async (type, questionId = null, answerId = null) => {
    if (!user) return toast.error('Please login to vote');
    if (voting) return;
    setVoting(true);
    try {
      if (questionId) {
        await api.post(`/questions/${questionId}/vote`, { type });
      } else if (answerId) {
        await api.post(`/answers/${answerId}/vote`, { type });
      }
      fetchQuestion();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error voting');
    }
    setTimeout(() => setVoting(false), 500);
  };

  const isUpvoted = (item) => item.upvotes?.some(uid => String(uid) === String(user?._id || user?.id));
  const isDownvoted = (item) => item.downvotes?.some(uid => String(uid) === String(user?._id || user?.id));

  const handleAccept = async (answerId) => {
    try {
      await api.post(`/questions/${id}/accept/${answerId}`);
      toast.success('Answer accepted!');
      fetchQuestion();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error accepting answer');
    }
  };

  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    if (!answerBody.trim()) return toast.error('Answer cannot be empty');
    try {
      const res = await api.post(`/answers/${id}`, { body: answerBody });
      const shlokaCount = res.data?.shlokaReferences?.length || 0;
      toast.success(shlokaCount > 0
        ? `Answer posted! ${shlokaCount} shloka${shlokaCount > 1 ? 's' : ''} attached.`
        : 'Answer posted!');
      setAnswerBody('');
      setShlokaPreview([]);
      fetchQuestion();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error posting answer');
    }
  };

  const previewShlokas = async () => {
    if (!answerBody.trim()) {
      setShlokaPreview([]);
      return;
    }
    setPreviewing(true);
    try {
      const res = await api.post('/guru/parse-shlokas', { text: answerBody });
      setShlokaPreview(res.data.shlokas || []);
    } catch (err) {
      toast.error('Could not parse shlokas');
    }
    setPreviewing(false);
  };

  const handleGuruDelete = async () => {
    const reason = window.prompt('Reason for deleting (will be logged for moderation):');
    if (reason === null) return;
    try {
      await api.delete(`/guru/questions/${id}`, { data: { reason } });
      toast.success('Question removed by guru');
      navigate('/questions');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete question');
    }
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (!question) return <div className="text-center py-8">Question not found</div>;

  const isOwner = user && String(user._id || user.id) === String(question.author?._id);
  const isModerator = canModerate();
  const canPostAnswer = user && !isOwner && isGuru();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex">
          <div className="flex flex-col items-center space-y-2 mr-6">
            <button onClick={() => handleVote('upvote', question._id)} className={`${isUpvoted(question) ? 'text-orange-600' : 'text-gray-400 hover:text-orange-600'}`}>
              <FiArrowUp size={24} />
            </button>
            <span className="text-xl font-bold">{(question.upvotes?.length || 0) - (question.downvotes?.length || 0)}</span>
            <button onClick={() => handleVote('downvote', question._id)} className={`${isDownvoted(question) ? 'text-red-600' : 'text-gray-400 hover:text-red-600'}`}>
              <FiArrowDown size={24} />
            </button>
            <button
              onClick={toggleFavorite}
              disabled={favLoading}
              className={`mt-2 ${favorited ? 'text-orange-600' : 'text-gray-400 hover:text-orange-600'}`}
              title={favorited ? 'Remove bookmark' : 'Bookmark this question'}
            >
              <FiBookmark size={20} fill={favorited ? 'currentColor' : 'none'} />
            </button>
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-4">{question.title}</h1>
            <div className="prose max-w-none mb-4">
              <MarkdownRenderer content={question.body} />
            </div>
            <div className="text-sm text-gray-500 mb-3">
              asked by <span className="font-medium text-orange-600">{question.author?.name}</span>
              <UserBadge author={question.author} max={2} />
            </div>
            <div className="flex flex-wrap gap-2 mb-2">
              {question.tags?.map(tag => (
                <Link key={tag._id} to={`/tags/${tag.name}`} className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs hover:bg-orange-200">
                  {tag.name}
                </Link>
              ))}
            </div>
            <GuruTagManager question={question} onChange={fetchQuestion} />
            <div className="flex items-center justify-between text-sm text-gray-500 border-t pt-4 mt-3">
              <span>{question.views} views</span>
              <div className="flex items-center space-x-4">
                {isModerator && !isOwner && (
                  <button
                    onClick={handleGuruDelete}
                    className="flex items-center text-red-600 hover:text-red-800"
                    title="Delete this question for etiquette violation"
                  >
                    <FiTrash2 className="mr-1" /> Delete as Guru
                  </button>
                )}
                {question.moderatedBy && (
                  <span className="text-xs text-gray-400 italic">
                    Moderated by guru
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <CommentsList
          comments={question.comments || []}
          postId={question._id}
          postType="question"
          onChange={fetchQuestion}
        />
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-bold mb-4">{question.answers?.length || 0} Answers</h2>
      </div>

      {question.answers?.map(answer => (
        <div key={answer._id} className={`bg-white rounded-lg shadow-md p-6 mb-4 ${answer.isAccepted ? 'border-2 border-green-500' : ''}`}>
          <div className="flex">
            <div className="flex flex-col items-center space-y-2 mr-6">
              <button onClick={() => handleVote('upvote', null, answer._id)} className={`${isUpvoted(answer) ? 'text-orange-600' : 'text-gray-400 hover:text-orange-600'}`}>
                <FiArrowUp size={24} />
              </button>
              <span className="text-xl font-bold">{(answer.upvotes?.length || 0) - (answer.downvotes?.length || 0)}</span>
              <button onClick={() => handleVote('downvote', null, answer._id)} className={`${isDownvoted(answer) ? 'text-red-600' : 'text-gray-400 hover:text-red-600'}`}>
                <FiArrowDown size={24} />
              </button>
              {answer.isAccepted && (
                <div className="text-green-600 mt-2">
                  <FiCheck size={24} />
                  <span className="text-xs">Accepted</span>
                </div>
              )}
              {answer.isVerifiedByGuru && (
                <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs mt-2">
                  🏅 Guru Verified
                </div>
              )}
              {answer.isAIGenerated && (
                <div className={`px-2 py-1 rounded text-xs mt-2 ${answer.isVerifiedByAdmin ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                  {answer.isVerifiedByAdmin ? '✅ AI Verified by Admin' : '🤖 AI Generated - Pending Verification'}
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="prose max-w-none mb-4">
                <MarkdownRenderer content={answer.body} />
              </div>
              {answer.shlokaReferences?.length > 0 && (
                <div className="mt-4">
                  <div className="text-xs font-semibold text-orange-700 uppercase tracking-wider mb-2">
                    📚 {answer.shlokaReferences.length} Shloka{answer.shlokaReferences.length > 1 ? 's' : ''} Referenced
                  </div>
                  {answer.shlokaReferences.map((s, i) => (
                    <ShlokaCard key={i} shloka={s} />
                  ))}
                </div>
              )}
              {answer.isVerifiedByGuru && answer.verificationNote && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Verification Note:</strong> {answer.verificationNote}
                  </p>
                  <p className="text-xs text-yellow-600 mt-1">
                    Verified by {answer.verifiedBy?.name}
                  </p>
                </div>
              )}
              <div className="flex items-center justify-between text-sm text-gray-500 border-t pt-4">
                <div className="flex items-center space-x-4">
                  {user && isOwner && !answer.isAccepted && (
                    <button onClick={() => handleAccept(answer._id)} className="text-green-600 hover:text-green-700">
                      Accept this answer
                    </button>
                  )}
                </div>
                <span>by <span className="font-medium text-orange-600">{answer.author?.name}</span><UserBadge author={answer.author} max={2} /> · {new Date(answer.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          <CommentsList
            comments={answer.comments || []}
            postId={answer._id}
            postType="answer"
            onChange={fetchQuestion}
          />
        </div>
      ))}

      {canPostAnswer && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-2">Your Answer</h3>
          {isGuru() && (
            <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-900">
              <div className="font-semibold mb-1 flex items-center">
                <FiInfo className="mr-1" /> Guru Shloka Syntax
              </div>
              <div>
                Type <code className="bg-white px-1 rounded">@BG 7.8</code> to attach <em>Bhagavad Gita 7.8</em>,
                or <code className="bg-white px-1 rounded">@SB 1.2.3</code> for <em>Srimad Bhagavatam 1.2.3</em>.
                Also supported: <code className="bg-white px-1 rounded">@CC</code>, <code className="bg-white px-1 rounded">@ISO</code>, <code className="bg-white px-1 rounded">@NOI</code>.
                The shloka, transliteration, translation, and vedabase.io link are auto-attached.
              </div>
            </div>
          )}
          <form onSubmit={handleSubmitAnswer}>
            {isGuru() ? (
              <ShlokaAutocomplete
                value={answerBody}
                onChange={setAnswerBody}
                onPreviewChange={previewShlokas}
                rows={8}
                placeholder="Write your answer here. You can use Markdown. As a guru, type @BG 7.8 (or @SB 1.2.3, @CC adi 1.1, @ISO 1, @NOI 1) to auto-attach that shloka."
              />
            ) : (
              <textarea
                value={answerBody}
                onChange={(e) => setAnswerBody(e.target.value)}
                className="w-full border rounded-lg p-4 text-sm font-mono"
                rows="8"
                placeholder="Write your answer here. You can use Markdown."
                required
              />
            )}
            {isGuru() && shlokaPreview.length > 0 && (
              <div className="mt-2 text-xs text-orange-700 font-semibold">
                ✓ {shlokaPreview.length} shloka{shlokaPreview.length > 1 ? 's' : ''} will be attached when you post.
              </div>
            )}
            {isGuru() && previewing && (
              <div className="mt-2 text-xs text-gray-500">Parsing shlokas…</div>
            )}
            <div className="mt-4">
              <button type="submit" className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700">
                Post Your Answer
              </button>
            </div>
          </form>
        </div>
      )}
      {!user && (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <Link to="/login" className="text-orange-600 hover:underline">Log in</Link> to post an answer.
        </div>
      )}
    </div>
  );
};

export default QuestionDetail;
