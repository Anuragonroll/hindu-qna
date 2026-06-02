import React, { useState } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { FiAward, FiX, FiHeart, FiCornerDownRight, FiTrash2 } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const BADGE_LABELS = {
  insightful: { label: 'Insightful', icon: '💡', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  helpful: { label: 'Helpful', icon: '🤝', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  scriptural: { label: 'Scriptural', icon: '📜', color: 'bg-purple-100 text-purple-800 border-purple-300' },
  clarification: { label: 'Clarification', icon: '🔍', color: 'bg-teal-100 text-teal-800 border-teal-300' },
  verified: { label: 'Verified', icon: '✅', color: 'bg-green-100 text-green-800 border-green-300' }
};

const CommentItem = ({ comment, postId, postType, onChange, depth = 0, onReplyAdded }) => {
  const { user, canModerate } = useAuth();
  const [replying, setReplying] = useState(false);
  const [replyBody, setReplyBody] = useState('');
  const [liking, setLiking] = useState(false);
  const [localLikes, setLocalLikes] = useState((comment.likes || []).length);
  const [localLiked, setLocalLiked] = useState(
    user && (comment.likes || []).some(id => String(id) === String(user._id || user.id))
  );

  const badgeInfo = comment.badge ? BADGE_LABELS[comment.badge] : null;
  const isOwn = user && String(comment.author?._id) === String(user._id || user.id);
  const isOwnBadge = comment.badgedBy && user && String(comment.badgedBy._id || comment.badgedBy) === String(user._id || user.id);

  const submitReply = async () => {
    if (!replyBody.trim()) return;
    try {
      const { data } = await api.post(`/comments/${comment._id}/reply`, { body: replyBody });
      setReplyBody('');
      setReplying(false);
      toast.success('Reply added');
      if (onReplyAdded) onReplyAdded(data);
      if (onChange) onChange();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reply');
    }
  };

  const handleLike = async () => {
    if (!user) { toast.error('Please log in to like'); return; }
    if (liking) return;
    setLiking(true);
    // optimistic update
    setLocalLiked(l => !l);
    setLocalLikes(n => n + (localLiked ? -1 : 1));
    try {
      await api.post(`/comments/${comment._id}/like`);
    } catch (err) {
      // revert on error
      setLocalLiked(l => !l);
      setLocalLikes(n => n + (localLiked ? 1 : -1));
      toast.error('Failed to like');
    } finally {
      setLiking(false);
    }
  };

  const applyBadge = async (badge) => {
    try {
      await api.post(`/guru/comments/${comment._id}/badge`, { badge });
      toast.success('Badge applied');
      if (onChange) onChange();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to badge comment');
    }
  };

  const removeBadge = async () => {
    try {
      await api.delete(`/guru/comments/${comment._id}/badge`);
      toast.success('Badge removed');
      if (onChange) onChange();
    } catch (err) {
      toast.error('Failed to remove badge');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await api.delete(`/comments/${comment._id}`);
      toast.success('Comment deleted');
      if (onChange) onChange();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className={depth > 0 ? 'pl-6 border-l-2 border-orange-100 ml-2' : ''}>
      <div className="text-sm text-gray-700 group py-1.5">
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <span className="break-words">{comment.body}</span>
            <span className="text-gray-400 mx-1">–</span>
            <span className="text-orange-600 font-medium">{comment.author?.name}</span>
            <span className="text-gray-400 text-xs ml-2">
              {comment.createdAt ? formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true }) : ''}
            </span>
            {badgeInfo && (
              <span className={`ml-2 inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded border ${badgeInfo.color}`}>
                <span>{badgeInfo.icon}</span> {badgeInfo.label}
                {comment.badgeNote && <span className="font-normal italic ml-1">"{comment.badgeNote}"</span>}
                {canModerate() && (isOwnBadge || user?.role === 'admin') && (
                  <button
                    onClick={removeBadge}
                    className="ml-1 hover:text-red-600"
                    title="Remove badge"
                  >
                    <FiX size={12} />
                  </button>
                )}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleLike}
              disabled={liking || !user}
              className={`flex items-center gap-0.5 text-xs ${localLiked ? 'text-pink-600' : 'text-gray-500 hover:text-pink-600'} transition`}
              title={localLiked ? 'Unlike' : 'Like'}
            >
              <FiHeart className={localLiked ? 'fill-current' : ''} size={13} />
              <span>{localLikes}</span>
            </button>
            {user && depth === 0 && (
              <button
                onClick={() => setReplying(r => !r)}
                className="text-gray-500 hover:text-orange-600 text-xs flex items-center gap-0.5"
                title="Reply"
              >
                <FiCornerDownRight size={13} />
                <span>Reply</span>
              </button>
            )}
            {canModerate() && !comment.badge && !isOwn && (
              <select
                onChange={(e) => e.target.value && applyBadge(e.target.value)}
                className="text-xs border rounded px-1 py-0.5 opacity-0 group-hover:opacity-100 transition"
                defaultValue=""
                title="Badge this comment"
              >
                <option value="">+ Badge</option>
                {Object.entries(BADGE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v.icon} {v.label}</option>
                ))}
              </select>
            )}
            {(isOwn || user?.role === 'admin') && (
              <button
                onClick={handleDelete}
                className="text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition"
                title="Delete comment"
              >
                <FiTrash2 size={12} />
              </button>
            )}
          </div>
        </div>
        {replying && (
          <div className="mt-1 flex gap-2">
            <input
              value={replyBody}
              onChange={e => setReplyBody(e.target.value)}
              placeholder={`Reply to ${comment.author?.name}…`}
              className="flex-1 border rounded px-2 py-1 text-xs"
              maxLength={500}
              onKeyDown={e => { if (e.key === 'Enter') submitReply(); }}
              autoFocus
            />
            <button onClick={submitReply} className="bg-orange-600 text-white px-2 py-1 rounded text-xs">Reply</button>
            <button onClick={() => { setReplying(false); setReplyBody(''); }} className="text-gray-500 text-xs">Cancel</button>
          </div>
        )}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-1 space-y-0.5">
            {comment.replies.map(r => (
              <CommentItem
                key={r._id}
                comment={r}
                postId={postId}
                postType={postType}
                onChange={onChange}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const CommentsList = ({ comments = [], postId, postType, onChange }) => {
  const { user } = useAuth();
  const [newBody, setNewBody] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!newBody.trim() || submitting) return;
    setSubmitting(true);
    try {
      await api.post(`/comments/${postType}/${postId}`, { body: newBody });
      setNewBody('');
      setShowForm(false);
      toast.success('Comment added');
      if (onChange) onChange();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-4 pl-16">
      {comments.length > 0 && (
        <div className="border-l-2 border-gray-200 pl-4 space-y-0.5 mb-2">
          {comments.map(c => (
            <CommentItem
              key={c._id}
              comment={c}
              postId={postId}
              postType={postType}
              onChange={onChange}
            />
          ))}
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
              autoFocus
            />
            <button
              onClick={submit}
              disabled={submitting}
              className="bg-orange-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
            >
              {submitting ? '…' : 'Add'}
            </button>
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
