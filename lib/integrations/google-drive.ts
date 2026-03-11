/**
 * =========================================================
 * Google Drive Integration
 * =========================================================
 * Link and import evidence documents from Google Drive.
 * Uses Google Drive API v3.
 *
 * Auth: OAuth 2.0 (Google Cloud Console)
 */

import { createSupabaseServerClient as createClient } from '@/lib/supabase/server';

export interface GoogleDriveConfig {
  organizationId: string;
  accessToken: string;
  refreshToken: string;
  folderId?: string;
  enabled: boolean;
}

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size: string;
  webViewLink: string;
  modifiedTime: string;
  owners?: Array<{ displayName: string; emailAddress: string }>;
}

const DRIVE_API = 'https://www.googleapis.com/drive/v3';

/**
 * Get Google Drive config for an organization
 */
async function getDriveConfig(orgId: string): Promise<GoogleDriveConfig | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('integration_configs')
    .select('*')
    .eq('organization_id', orgId)
    .eq('provider', 'google_drive')
    .eq('enabled', true)
    .maybeSingle();

  if (!data) return null;
  const config = data.config as Record<string, unknown>;

  return {
    organizationId: orgId,
    accessToken: config.access_token as string,
    refreshToken: config.refresh_token as string,
    folderId: config.folder_id as string | undefined,
    enabled: true,
  };
}

/**
 * List files from configured Google Drive folder
 */
export async function listDriveFiles(
  orgId: string,
  options?: {
    query?: string;
    pageSize?: number;
    pageToken?: string;
    mimeType?: string;
  },
): Promise<{
  success: boolean;
  files?: DriveFile[];
  nextPageToken?: string;
  error?: string;
}> {
  const config = await getDriveConfig(orgId);
  if (!config) return { success: false, error: 'Google Drive not configured' };

  const queryParts: string[] = ['trashed = false'];

  if (config.folderId) {
    queryParts.push(`'${config.folderId}' in parents`);
  }
  if (options?.query) {
    // Sanitise user input for Drive query — only allow alphanumeric, spaces, hyphens, underscores
    const safe = options.query.replace(/[^a-zA-Z0-9 _-]/g, '');
    queryParts.push(`name contains '${safe}'`);
  }
  if (options?.mimeType) {
    const safeMime = options.mimeType.replace(/'/g, '');
    queryParts.push(`mimeType = '${safeMime}'`);
  }

  const params = new URLSearchParams({
    q: queryParts.join(' and '),
    fields: 'nextPageToken, files(id, name, mimeType, size, webViewLink, modifiedTime, owners)',
    pageSize: String(options?.pageSize ?? 20),
    orderBy: 'modifiedTime desc',
  });

  if (options?.pageToken) params.set('pageToken', options.pageToken);

  try {
    const response = await fetch(`${DRIVE_API}/files?${params}`, {
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      return { success: false, error: `Drive API error: ${response.status}` };
    }

    const result = await response.json();
    return {
      success: true,
      files: result.files as DriveFile[],
      nextPageToken: result.nextPageToken,
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Link a Google Drive file as evidence in FormaOS
 */
export async function linkDriveFileAsEvidence(
  orgId: string,
  fileId: string,
  controlId: string,
): Promise<{ success: boolean; evidenceId?: string; error?: string }> {
  const config = await getDriveConfig(orgId);
  if (!config) return { success: false, error: 'Google Drive not configured' };

  // Fetch file metadata
  const fileResponse = await fetch(
    `${DRIVE_API}/files/${encodeURIComponent(fileId)}?fields=id,name,mimeType,size,webViewLink,modifiedTime,md5Checksum`,
    {
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        Accept: 'application/json',
      },
    },
  );

  if (!fileResponse.ok) {
    return { success: false, error: `Failed to fetch file: ${fileResponse.status}` };
  }

  const file = await fileResponse.json();

  // Store as linked evidence
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('org_evidence')
    .insert({
      organization_id: orgId,
      name: file.name,
      file_type: file.mimeType,
      file_size: parseInt(file.size || '0', 10),
      storage_type: 'google_drive',
      external_url: file.webViewLink,
      external_id: file.id,
      checksum: file.md5Checksum ?? null,
      control_id: controlId,
    })
    .select('id')
    .single();

  if (error) return { success: false, error: error.message };

  // Store sync log
  await supabase.from('integration_sync_log').insert({
    organization_id: orgId,
    provider: 'google_drive',
    local_entity_type: 'evidence',
    local_entity_id: data.id,
    remote_entity_id: file.id,
    remote_url: file.webViewLink,
    sync_type: 'pull',
  });

  return { success: true, evidenceId: data.id };
}

/**
 * Download a Drive file's content (for evidence snapshots)
 */
export async function downloadDriveFile(
  orgId: string,
  fileId: string,
): Promise<{ success: boolean; content?: ArrayBuffer; mimeType?: string; error?: string }> {
  const config = await getDriveConfig(orgId);
  if (!config) return { success: false, error: 'Google Drive not configured' };

  try {
    const response = await fetch(
      `${DRIVE_API}/files/${encodeURIComponent(fileId)}?alt=media`,
      {
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
        },
      },
    );

    if (!response.ok) {
      return { success: false, error: `Download failed: ${response.status}` };
    }

    const content = await response.arrayBuffer();
    const mimeType = response.headers.get('content-type') ?? undefined;
    return { success: true, content, mimeType };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
