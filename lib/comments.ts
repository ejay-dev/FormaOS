/**
 * =========================================================
 * Comments & Mentions System
 * =========================================================
 * Rich commenting with @mentions and reactions
 */

import { createSupabaseServerClient as createClient } from '@/lib/supabase/server';
import { logAuditEventCore } from '@/lib/audit/log-audit-event';
import { sendNotification } from '@/lib/notifications/send';

// Confirms the (entityType, entityId) actually exists in the requesting org.
// Without this check, a user can post or read comments addressed at another
// org's entity id — the comment row itself stays in the user's org, but the
// foreign id is a confirmation oracle for cross-tenant existence.
async function entityBelongsToOrg(
  supabase: Awaited<ReturnType<typeof createClient>>,
  entityType: Comment['entity_type'],
  entityId: string,
  organizationId: string,
): Promise<boolean> {
  if (entityType === 'organization') {
    return entityId === organizationId;
  }
  const table =
    entityType === 'task'
      ? 'org_tasks'
      : entityType === 'evidence'
        ? 'org_evidence'
        : entityType === 'certificate'
          ? 'org_certifications'
          : null;
  if (!table) return false;
  const { data } = await supabase
    .from(table)
    .select('organization_id')
    .eq('id', entityId)
    .eq('organization_id', organizationId)
    .maybeSingle();
  return Boolean(data);
}

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

  if (
    !(await entityBelongsToOrg(
      supabase,
      data.entityType,
      data.entityId,
      organizationId,
    ))
  ) {
    throw new Error('Entity not found');
  }

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

  // M2 (2026-05-26): migrated from lib/audit-trail (non-chained
  // activity_logs) to lib/audit/log-audit-event (hash-chained
  // org_audit_log). Drops the legacy 'task' entity-type hack — the
  // canonical writer takes the real entity_type string.
  await logAuditEventCore({
    organizationId,
    actorUserId: userId,
    actorRole: null,
    actionType: 'COMMENT_CREATED',
    entityType: 'comment',
    entityId: comment.id,
    afterState: {
      target_entity_type: data.entityType,
      target_entity_id: data.entityId,
      mention_count: mentionedUserIds.length,
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

  if (
    !(await entityBelongsToOrg(supabase, entityType, entityId, organizationId))
  ) {
    return [];
  }

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
    data.map(
      async (comment: {
        id: string;
        profiles?:
          | { full_name?: string; email?: string; avatar_url?: string }
          | { full_name?: string; email?: string; avatar_url?: string }[];
        comment_reactions?: CommentReaction[];
        [key: string]: unknown;
      }) => {
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

        const {
          profiles: _p,
          comment_reactions: _cr,
          ...commentRest
        } = comment;
        const commentProfile = Array.isArray(comment.profiles)
          ? comment.profiles[0]
          : comment.profiles;
        return {
          ...commentRest,
          user: commentProfile,
          reactions: comment.comment_reactions || [],
          replies:
            replies?.map(
              (reply: {
                profiles?:
                  | { full_name?: string; email?: string; avatar_url?: string }
                  | {
                      full_name?: string;
                      email?: string;
                      avatar_url?: string;
                    }[];
                [key: string]: unknown;
              }) => {
                const { profiles: _rp, ...replyRest } = reply;
                const replyProfile = Array.isArray(reply.profiles)
                  ? reply.profiles[0]
                  : reply.profiles;
                return {
                  ...replyRest,
                  user: replyProfile,
                  reactions: [] as CommentReaction[],
                };
              },
            ) || [],
        } as Comment;
      },
    ),
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
  callerOrgId: string,
): Promise<Comment> {
  const supabase = await createClient();

  // Verify user owns the comment and it belongs to caller's org
  const { data: existing } = await supabase
    .from('comments')
    .select('user_id, organization_id')
    .eq('id', commentId)
    .maybeSingle();

  if (!existing || existing.organization_id !== callerOrgId) {
    throw new Error('Unauthorized to edit this comment');
  }

  if (existing.user_id !== userId) {
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
  callerOrgId: string,
): Promise<void> {
  const supabase = await createClient();

  // Verify user owns the comment and it belongs to caller's org
  const { data: existing } = await supabase
    .from('comments')
    .select('user_id, organization_id')
    .eq('id', commentId)
    .maybeSingle();

  if (!existing || existing.organization_id !== callerOrgId) {
    throw new Error('Unauthorized to delete this comment');
  }

  if (existing.user_id !== userId) {
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

  await logAuditEventCore({
    organizationId: existing.organization_id,
    actorUserId: userId,
    actorRole: null,
    actionType: 'COMMENT_DELETED',
    entityType: 'comment',
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
  callerOrgId: string,
): Promise<CommentReaction> {
  const supabase = await createClient();

  // Verify the comment belongs to the caller's org
  const { data: comment } = await supabase
    .from('comments')
    .select('organization_id')
    .eq('id', commentId)
    .maybeSingle();

  if (!comment || comment.organization_id !== callerOrgId) {
    throw new Error('Unauthorized to react to this comment');
  }

  // Check if user already reacted with this emoji
  const { data: existing } = await supabase
    .from('comment_reactions')
    .select('id')
    .eq('comment_id', commentId)
    .eq('user_id', userId)
    .eq('emoji', emoji)
    .maybeSingle();

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
  callerOrgId: string,
): Promise<void> {
  const supabase = await createClient();

  // Verify the reaction's parent comment belongs to the caller's org
  const { data: reaction } = await supabase
    .from('comment_reactions')
    .select('comment_id')
    .eq('id', reactionId)
    .eq('user_id', userId)
    .maybeSingle();

  if (!reaction) {
    throw new Error('Unauthorized to remove this reaction');
  }

  const { data: comment } = await supabase
    .from('comments')
    .select('organization_id')
    .eq('id', reaction.comment_id)
    .maybeSingle();

  if (!comment || comment.organization_id !== callerOrgId) {
    throw new Error('Unauthorized to remove this reaction');
  }

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
    const member = members.find((m) => {
      const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
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

  return data.map(
    (comment: {
      profiles?:
        | { full_name?: string; email?: string; avatar_url?: string }
        | { full_name?: string; email?: string; avatar_url?: string }[];
      [key: string]: unknown;
    }) => {
      const { profiles: _p, ...commentRest } = comment;
      const profile = Array.isArray(comment.profiles)
        ? comment.profiles[0]
        : comment.profiles;
      return {
        ...commentRest,
        user: profile,
        reactions: [] as CommentReaction[],
      } as Comment;
    },
  );
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

  return data.map(
    (comment: {
      profiles?:
        | { full_name?: string; email?: string; avatar_url?: string }
        | { full_name?: string; email?: string; avatar_url?: string }[];
      [key: string]: unknown;
    }) => {
      const { profiles: _p, ...commentRest } = comment;
      const profile = Array.isArray(comment.profiles)
        ? comment.profiles[0]
        : comment.profiles;
      return {
        ...commentRest,
        user: profile,
        reactions: [] as CommentReaction[],
      } as Comment;
    },
  );
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

  return data.map(
    (comment: {
      profiles?:
        | { full_name?: string; email?: string; avatar_url?: string }
        | { full_name?: string; email?: string; avatar_url?: string }[];
      [key: string]: unknown;
    }) => {
      const { profiles: _p, ...commentRest } = comment;
      const profile = Array.isArray(comment.profiles)
        ? comment.profiles[0]
        : comment.profiles;
      return {
        ...commentRest,
        user: profile,
        reactions: [] as CommentReaction[],
      } as Comment;
    },
  );
}
