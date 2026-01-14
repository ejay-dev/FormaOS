/**
 * =========================================================
 * Comments & Mentions System
 * =========================================================
 * Rich commenting with @mentions and reactions
 */

import { createSupabaseServerClient as createClient } from '@/lib/supabase/server';
import { logActivity } from '@/lib/audit-trail';
import { sendNotification } from '@/lib/realtime';

export interface Comment {
  id: string;
  entity_type: 'task' | 'certificate' | 'evidence' | 'organization';
  entity_id: string;
  user_id: string;
  content: string;
  mentions: string[]; // Array of user IDs
  parent_id?: string; // For threaded replies
  edited: boolean;
  created_at: string;
  updated_at: string;
  user?: {
    full_name?: string;
    email?: string;
    avatar_url?: string;
  };
  reactions?: CommentReaction[];
  replies?: Comment[];
}

export interface CommentReaction {
  id: string;
  comment_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

/**
 * Create a comment
 */
export async function createComment(
  organizationId: string,
  userId: string,
  data: {
    entityType: Comment['entity_type'];
    entityId: string;
    content: string;
    parentId?: string;
  },
): Promise<Comment> {
  const supabase = await createClient();

  // Extract mentions from content (@username or @email)
  const mentions = extractMentions(data.content);

  // Get mentioned user IDs
  const mentionedUserIds = await resolveMentions(organizationId, mentions);

  // Create comment
  const { data: comment, error } = await supabase
    .from('comments')
    .insert({
      organization_id: organizationId,
      entity_type: data.entityType,
      entity_id: data.entityId,
      user_id: userId,
      content: data.content,
      mentions: mentionedUserIds,
      parent_id: data.parentId,
      created_at: new Date().toISOString(),
    })
    .select('*, profiles!user_id(full_name, email, avatar_url)')
    .single();

  if (error) {
    throw new Error(`Failed to create comment: ${error.message}`);
  }

  // Send notifications to mentioned users
  await Promise.all(
    mentionedUserIds.map((mentionedUserId) =>
      sendNotification(
        mentionedUserId,
        'You were mentioned in a comment',
        data.content.substring(0, 100),
        'info',
        `/tasks/${data.entityId}#comment-${comment.id}`,
      ),
    ),
  );

  // Log activity (using 'task' as closest entity type since comment isn't in ActivityEntity enum)
  await logActivity(organizationId, userId, 'create', 'task', {
    entityId: comment.id,
    entityName: `Comment on ${data.entityType}`,
    details: {
      entityType: data.entityType,
      entityId: data.entityId,
      mentions: mentionedUserIds.length,
    },
  });

  return {
    ...comment,
    user: comment.profiles,
    mentions: mentionedUserIds,
    edited: false,
    reactions: [],
  };
}

/**
 * Get comments for an entity
 */
export async function getComments(
  organizationId: string,
  entityType: Comment['entity_type'],
  entityId: string,
): Promise<Comment[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('comments')
    .select(
      `
      *,
      profiles!user_id(full_name, email, avatar_url),
      comment_reactions(id, user_id, emoji, created_at)
    `,
    )
    .eq('organization_id', organizationId)
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .is('parent_id', null) // Only top-level comments
    .order('created_at', { ascending: true });

  if (error || !data) {
    return [];
  }

  // Fetch replies for each comment
  const commentsWithReplies = await Promise.all(
    data.map(async (comment) => {
      const { data: replies } = await supabase
        .from('comments')
        .select(
          `
          *,
          profiles!user_id(full_name, email, avatar_url)
        `,
        )
        .eq('parent_id', comment.id)
        .order('created_at', { ascending: true });

      return {
        ...comment,
        user: comment.profiles,
        reactions: comment.comment_reactions || [],
        replies:
          replies?.map((reply) => ({
            ...reply,
            user: reply.profiles,
            reactions: [],
          })) || [],
      };
    }),
  );

  return commentsWithReplies;
}

/**
 * Update a comment
 */
export async function updateComment(
  commentId: string,
  userId: string,
  content: string,
): Promise<Comment> {
  const supabase = await createClient();

  // Verify user owns the comment
  const { data: existing } = await supabase
    .from('comments')
    .select('user_id, organization_id')
    .eq('id', commentId)
    .single();

  if (!existing || existing.user_id !== userId) {
    throw new Error('Unauthorized to edit this comment');
  }

  // Extract new mentions
  const mentions = extractMentions(content);
  const mentionedUserIds = await resolveMentions(
    existing.organization_id,
    mentions,
  );

  // Update comment
  const { data: comment, error } = await supabase
    .from('comments')
    .update({
      content,
      mentions: mentionedUserIds,
      edited: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', commentId)
    .select('*, profiles!user_id(full_name, email, avatar_url)')
    .single();

  if (error) {
    throw new Error(`Failed to update comment: ${error.message}`);
  }

  return {
    ...comment,
    user: comment.profiles,
    edited: true,
    reactions: [],
  };
}

/**
 * Delete a comment
 */
export async function deleteComment(
  commentId: string,
  userId: string,
): Promise<void> {
  const supabase = await createClient();

  // Verify user owns the comment
  const { data: existing } = await supabase
    .from('comments')
    .select('user_id, organization_id')
    .eq('id', commentId)
    .single();

  if (!existing || existing.user_id !== userId) {
    throw new Error('Unauthorized to delete this comment');
  }

  // Delete comment and its replies (cascade)
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId);

  if (error) {
    throw new Error(`Failed to delete comment: ${error.message}`);
  }

  // Log activity
  await logActivity(existing.organization_id, userId, 'delete', 'comment', {
    entityId: commentId,
  });
}

/**
 * Add reaction to comment
 */
export async function addReaction(
  commentId: string,
  userId: string,
  emoji: string,
): Promise<CommentReaction> {
  const supabase = await createClient();

  // Check if user already reacted with this emoji
  const { data: existing } = await supabase
    .from('comment_reactions')
    .select('id')
    .eq('comment_id', commentId)
    .eq('user_id', userId)
    .eq('emoji', emoji)
    .single();

  if (existing) {
    throw new Error('Already reacted with this emoji');
  }

  // Add reaction
  const { data, error } = await supabase
    .from('comment_reactions')
    .insert({
      comment_id: commentId,
      user_id: userId,
      emoji,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to add reaction: ${error.message}`);
  }

  return data;
}

/**
 * Remove reaction from comment
 */
export async function removeReaction(
  reactionId: string,
  userId: string,
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('comment_reactions')
    .delete()
    .eq('id', reactionId)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to remove reaction: ${error.message}`);
  }
}

/**
 * Extract @mentions from comment content
 */
function extractMentions(content: string): string[] {
  const mentionPattern = /@(\w+(?:\.\w+)*@?[\w.-]*)/g;
  const matches = content.match(mentionPattern);

  if (!matches) return [];

  return matches.map((match) => match.substring(1)); // Remove @ prefix
}

/**
 * Resolve mentions (names/emails) to user IDs
 */
async function resolveMentions(
  organizationId: string,
  mentions: string[],
): Promise<string[]> {
  if (mentions.length === 0) return [];

  const supabase = await createClient();

  // Get team members in organization
  const { data: members } = await supabase
    .from('team_members')
    .select('user_id, profiles!user_id(full_name, email)')
    .eq('organization_id', organizationId);

  if (!members) return [];

  // Match mentions to users
  const userIds: string[] = [];
  mentions.forEach((mention) => {
    const member = members.find((m: any) => {
      const profile = m.profiles;
      return (
        profile?.email?.toLowerCase().includes(mention.toLowerCase()) ||
        profile?.full_name?.toLowerCase().includes(mention.toLowerCase())
      );
    });

    if (member) {
      userIds.push(member.user_id);
    }
  });

  return [...new Set(userIds)]; // Remove duplicates
}

/**
 * Get comment count for entity
 */
export async function getCommentCount(
  entityType: Comment['entity_type'],
  entityId: string,
): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from('comments')
    .select('id', { count: 'exact', head: true })
    .eq('entity_type', entityType)
    .eq('entity_id', entityId);

  if (error) return 0;

  return count || 0;
}

/**
 * Get recent comments for user
 */
export async function getUserRecentComments(
  userId: string,
  limit = 10,
): Promise<Comment[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('comments')
    .select(
      `
      *,
      profiles!user_id(full_name, email, avatar_url)
    `,
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return data.map((comment) => ({
    ...comment,
    user: comment.profiles,
    reactions: [],
  }));
}

/**
 * Get comments where user was mentioned
 */
export async function getMentionedComments(
  userId: string,
  limit = 20,
): Promise<Comment[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('comments')
    .select(
      `
      *,
      profiles!user_id(full_name, email, avatar_url)
    `,
    )
    .contains('mentions', [userId])
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return data.map((comment) => ({
    ...comment,
    user: comment.profiles,
    reactions: [],
  }));
}

/**
 * Search comments
 */
export async function searchComments(
  organizationId: string,
  query: string,
  filters?: {
    entityType?: Comment['entity_type'];
    userId?: string;
    dateFrom?: string;
  },
): Promise<Comment[]> {
  const supabase = await createClient();

  let queryBuilder = supabase
    .from('comments')
    .select(
      `
      *,
      profiles!user_id(full_name, email, avatar_url)
    `,
    )
    .eq('organization_id', organizationId)
    .ilike('content', `%${query}%`);

  if (filters?.entityType) {
    queryBuilder = queryBuilder.eq('entity_type', filters.entityType);
  }

  if (filters?.userId) {
    queryBuilder = queryBuilder.eq('user_id', filters.userId);
  }

  if (filters?.dateFrom) {
    queryBuilder = queryBuilder.gte('created_at', filters.dateFrom);
  }

  const { data, error } = await queryBuilder
    .order('created_at', { ascending: false })
    .limit(50);

  if (error || !data) return [];

  return data.map((comment) => ({
    ...comment,
    user: comment.profiles,
    reactions: [],
  }));
}
