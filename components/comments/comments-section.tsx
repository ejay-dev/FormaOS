'use client';

/**
 * =========================================================
 * Comments Component
 * =========================================================
 * Rich commenting with mentions, reactions, and threading
 */

import { useState, useEffect } from 'react';
import {
  Send,
  ThumbsUp,
  Heart,
  Smile,
  Edit2,
  Trash2,
  Reply,
} from 'lucide-react';

interface Comment {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  edited: boolean;
  user?: {
    full_name?: string;
    email?: string;
    avatar_url?: string;
  };
  reactions?: Array<{
    id: string;
    user_id: string;
    emoji: string;
  }>;
  replies?: Comment[];
}

interface CommentsProps {
  entityType: 'task' | 'certificate' | 'evidence' | 'organization';
  entityId: string;
  currentUserId: string;
  orgId: string;
}

const EMOJI_OPTIONS = ['👍', '❤️', '😊', '🎉', '🚀', '👀'];

export default function Comments({
  entityType,
  entityId,
  currentUserId,
  orgId,
}: CommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComments();
  }, [entityType, entityId]);

  const fetchComments = async () => {
    try {
      const res = await fetch(
        `/api/comments?entityType=${entityType}&entityId=${entityId}&orgId=${orgId}`,
      );
      const data = await res.json();
      setComments(data.comments || []);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId,
          entityType,
          entityId,
          content: newComment,
          parentId: replyingTo,
        }),
      });

      setNewComment('');
      setReplyingTo(null);
      await fetchComments();
    } catch (error) {
      console.error('Failed to create comment:', error);
    }
  };

  const handleEdit = async (commentId: string) => {
    if (!editContent.trim()) return;

    try {
      await fetch(`/api/comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent }),
      });

      setEditingId(null);
      setEditContent('');
      await fetchComments();
    } catch (error) {
      console.error('Failed to update comment:', error);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Delete this comment?')) return;

    try {
      await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
      });

      await fetchComments();
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  const handleReaction = async (commentId: string, emoji: string) => {
    try {
      const comment = comments.find((c) => c.id === commentId);
      const existingReaction = comment?.reactions?.find(
        (r) => r.user_id === currentUserId && r.emoji === emoji,
      );

      if (existingReaction) {
        // Remove reaction
        await fetch(`/api/comments/reactions/${existingReaction.id}`, {
          method: 'DELETE',
        });
      } else {
        // Add reaction
        await fetch('/api/comments/reactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ commentId, emoji }),
        });
      }

      await fetchComments();
    } catch (error) {
      console.error('Failed to toggle reaction:', error);
    }
  };

  const renderComment = (comment: Comment, isReply = false) => {
    const isOwner = comment.user_id === currentUserId;
    const isEditing = editingId === comment.id;

    return (
      <div
        key={comment.id}
        className={`${isReply ? 'ml-12' : ''} mb-4`}
        id={`comment-${comment.id}`}
      >
        <div className="flex gap-3">
          {/* Avatar */}
          {comment.user?.avatar_url ? (
            <img
              src={comment.user.avatar_url}
              alt={comment.user.full_name || 'User'}
              className="h-8 w-8 rounded-full flex-shrink-0"
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 text-sm font-medium">
              {comment.user?.full_name?.[0] || comment.user?.email?.[0] || '?'}
            </div>
          )}

          {/* Comment body */}
          <div className="flex-1 min-w-0">
            <div className="bg-gray-50 rounded-lg p-3">
              {/* Header */}
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">
                    {comment.user?.full_name ||
                      comment.user?.email ||
                      'Unknown'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(comment.created_at).toLocaleString()}
                  </span>
                  {comment.edited && (
                    <span className="text-xs text-gray-400 italic">
                      (edited)
                    </span>
                  )}
                </div>

                {isOwner && !isEditing && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setEditingId(comment.id);
                        setEditContent(comment.content);
                      }}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      <Edit2 className="h-3 w-3 text-gray-500" />
                    </button>
                    <button
                      onClick={() => handleDelete(comment.id)}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      <Trash2 className="h-3 w-3 text-gray-500" />
                    </button>
                  </div>
                )}
              </div>

              {/* Content */}
              {isEditing ? (
                <div className="space-y-2">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(comment.id)}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(null);
                        setEditContent('');
                      }}
                      className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {comment.content}
                </p>
              )}
            </div>

            {/* Actions */}
            {!isEditing && (
              <div className="flex items-center gap-3 mt-2">
                {/* Reactions */}
                <div className="flex items-center gap-1">
                  {EMOJI_OPTIONS.map((emoji) => {
                    const count =
                      comment.reactions?.filter((r) => r.emoji === emoji)
                        .length || 0;
                    const userReacted = comment.reactions?.some(
                      (r) => r.user_id === currentUserId && r.emoji === emoji,
                    );

                    if (count === 0 && !userReacted) return null;

                    return (
                      <button
                        key={emoji}
                        onClick={() => handleReaction(comment.id, emoji)}
                        className={`px-2 py-0.5 text-xs rounded-full flex items-center gap-1 ${
                          userReacted
                            ? 'bg-blue-100 border border-blue-300'
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        <span>{emoji}</span>
                        {count > 0 && (
                          <span className="text-gray-600">{count}</span>
                        )}
                      </button>
                    );
                  })}

                  {/* Add reaction */}
                  <div className="relative group">
                    <button className="p-1 hover:bg-gray-100 rounded text-gray-500">
                      <Smile className="h-4 w-4" />
                    </button>
                    <div className="hidden group-hover:flex absolute bottom-full mb-1 bg-white border rounded-lg shadow-lg p-2 gap-1 z-10">
                      {EMOJI_OPTIONS.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => handleReaction(comment.id, emoji)}
                          className="hover:bg-gray-100 rounded p-1"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Reply button */}
                {!isReply && (
                  <button
                    onClick={() => setReplyingTo(comment.id)}
                    className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                  >
                    <Reply className="h-3 w-3" />
                    Reply
                  </button>
                )}
              </div>
            )}

            {/* Replies */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-4">
                {comment.replies.map((reply) => renderComment(reply, true))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-500">Loading comments...</div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Comment form */}
      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="flex-1">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={
              replyingTo
                ? 'Write a reply... (use @name to mention someone)'
                : 'Add a comment... (use @name to mention someone)'
            }
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
          />
          {replyingTo && (
            <button
              type="button"
              onClick={() => setReplyingTo(null)}
              className="text-xs text-gray-500 hover:text-gray-700 mt-1"
            >
              Cancel reply
            </button>
          )}
        </div>
        <button
          type="submit"
          disabled={!newComment.trim()}
          className="h-12 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Send className="h-4 w-4" />
          {replyingTo ? 'Reply' : 'Comment'}
        </button>
      </form>

      {/* Comments list */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          comments.map((comment) => renderComment(comment))
        )}
      </div>
    </div>
  );
}
