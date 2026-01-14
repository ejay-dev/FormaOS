/**
 * =========================================================
 * File Versioning System
 * =========================================================
 * Track and manage versions of uploaded evidence files
 */

import { createSupabaseServerClient as createClient } from '@/lib/supabase/server';
import { logActivity } from './audit-trail';
import { sendNotification } from './realtime';

export interface FileVersion {
  id?: string;
  file_id: string;
  version_number: number;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_by: string;
  change_summary?: string;
  checksum: string;
  created_at?: string;
}

export interface FileMetadata {
  id?: string;
  organization_id: string;
  entity_type: 'evidence' | 'certificate' | 'document';
  entity_id: string;
  file_name: string;
  current_version: number;
  total_versions: number;
  created_at?: string;
  updated_at?: string;
}

export interface VersionComparison {
  version1: FileVersion;
  version2: FileVersion;
  differences: {
    sizeChange: number;
    sizeDelta: string;
    nameChanged: boolean;
    typeChanged: boolean;
    uploaderChanged: boolean;
    timeDelta: number;
  };
}

/**
 * Create initial file record
 */
export async function createFile(
  organizationId: string,
  entityType: 'evidence' | 'certificate' | 'document',
  entityId: string,
  file: {
    name: string;
    path: string;
    size: number;
    mimeType: string;
    uploadedBy: string;
    checksum: string;
  },
): Promise<FileMetadata> {
  const supabase = await createClient();

  // Create file metadata
  const { data: fileMetadata, error: metadataError } = await supabase
    .from('file_metadata')
    .insert({
      organization_id: organizationId,
      entity_type: entityType,
      entity_id: entityId,
      file_name: file.name,
      current_version: 1,
      total_versions: 1,
    })
    .select()
    .single();

  if (metadataError) {
    throw new Error(`Failed to create file metadata: ${metadataError.message}`);
  }

  // Create initial version
  const { error: versionError } = await supabase.from('file_versions').insert({
    file_id: fileMetadata.id,
    version_number: 1,
    file_name: file.name,
    file_path: file.path,
    file_size: file.size,
    mime_type: file.mimeType,
    uploaded_by: file.uploadedBy,
    checksum: file.checksum,
    change_summary: 'Initial upload',
  });

  if (versionError) {
    throw new Error(`Failed to create file version: ${versionError.message}`);
  }

  await logActivity({
    organization_id: organizationId,
    user_id: file.uploadedBy,
    action: 'create',
    entity_type: 'file',
    entity_id: fileMetadata.id,
    entity_name: file.name,
    metadata: { entity_type: entityType, entity_id: entityId, version: 1 },
  });

  return fileMetadata;
}

/**
 * Upload new version of existing file
 */
export async function uploadNewVersion(
  fileId: string,
  userId: string,
  file: {
    name: string;
    path: string;
    size: number;
    mimeType: string;
    checksum: string;
  },
  changeSummary?: string,
): Promise<FileVersion> {
  const supabase = await createClient();

  // Get current file metadata
  const { data: fileMetadata } = await supabase
    .from('file_metadata')
    .select('*')
    .eq('id', fileId)
    .single();

  if (!fileMetadata) {
    throw new Error('File not found');
  }

  const newVersionNumber = fileMetadata.current_version + 1;

  // Create new version
  const { data: newVersion, error: versionError } = await supabase
    .from('file_versions')
    .insert({
      file_id: fileId,
      version_number: newVersionNumber,
      file_name: file.name,
      file_path: file.path,
      file_size: file.size,
      mime_type: file.mimeType,
      uploaded_by: userId,
      checksum: file.checksum,
      change_summary: changeSummary || 'Updated file',
    })
    .select()
    .single();

  if (versionError) {
    throw new Error(`Failed to create file version: ${versionError.message}`);
  }

  // Update file metadata
  await supabase
    .from('file_metadata')
    .update({
      file_name: file.name,
      current_version: newVersionNumber,
      total_versions: newVersionNumber,
      updated_at: new Date().toISOString(),
    })
    .eq('id', fileId);

  await logActivity({
    organization_id: fileMetadata.organization_id,
    user_id: userId,
    action: 'update',
    entity_type: 'file',
    entity_id: fileId,
    entity_name: file.name,
    metadata: {
      version: newVersionNumber,
      change_summary: changeSummary,
    },
  });

  // Notify relevant users
  await sendNotification({
    organization_id: fileMetadata.organization_id,
    user_id: userId,
    type: 'file_version_uploaded',
    title: 'New File Version',
    message: `${file.name} has been updated to version ${newVersionNumber}`,
    link: `/evidence/${fileMetadata.entity_id}`,
    metadata: {
      file_id: fileId,
      version: newVersionNumber,
      entity_type: fileMetadata.entity_type,
      entity_id: fileMetadata.entity_id,
    },
  });

  return newVersion;
}

/**
 * Get all versions of a file
 */
export async function getFileVersions(fileId: string): Promise<FileVersion[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('file_versions')
    .select('*, profiles!uploaded_by(full_name, email)')
    .eq('file_id', fileId)
    .order('version_number', { ascending: false });

  if (error) return [];

  return data || [];
}

/**
 * Get specific version
 */
export async function getFileVersion(
  fileId: string,
  versionNumber: number,
): Promise<FileVersion | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('file_versions')
    .select('*')
    .eq('file_id', fileId)
    .eq('version_number', versionNumber)
    .single();

  if (error) return null;

  return data;
}

/**
 * Restore previous version (creates new version with old content)
 */
export async function restoreVersion(
  fileId: string,
  versionNumber: number,
  userId: string,
  reason?: string,
): Promise<FileVersion> {
  const supabase = await createClient();

  // Get the version to restore
  const versionToRestore = await getFileVersion(fileId, versionNumber);
  if (!versionToRestore) {
    throw new Error('Version not found');
  }

  // Get current metadata
  const { data: fileMetadata } = await supabase
    .from('file_metadata')
    .select('*')
    .eq('id', fileId)
    .single();

  if (!fileMetadata) {
    throw new Error('File not found');
  }

  // Create new version with restored content
  const newVersionNumber = fileMetadata.current_version + 1;
  const changeSummary = reason
    ? `Restored version ${versionNumber}: ${reason}`
    : `Restored version ${versionNumber}`;

  const { data: newVersion, error } = await supabase
    .from('file_versions')
    .insert({
      file_id: fileId,
      version_number: newVersionNumber,
      file_name: versionToRestore.file_name,
      file_path: versionToRestore.file_path,
      file_size: versionToRestore.file_size,
      mime_type: versionToRestore.mime_type,
      uploaded_by: userId,
      checksum: versionToRestore.checksum,
      change_summary: changeSummary,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to restore version: ${error.message}`);
  }

  // Update metadata
  await supabase
    .from('file_metadata')
    .update({
      current_version: newVersionNumber,
      total_versions: newVersionNumber,
      updated_at: new Date().toISOString(),
    })
    .eq('id', fileId);

  await logActivity({
    organization_id: fileMetadata.organization_id,
    user_id: userId,
    action: 'restore',
    entity_type: 'file',
    entity_id: fileId,
    entity_name: versionToRestore.file_name,
    metadata: {
      restored_version: versionNumber,
      new_version: newVersionNumber,
      reason,
    },
  });

  return newVersion;
}

/**
 * Compare two versions
 */
export async function compareVersions(
  fileId: string,
  version1Number: number,
  version2Number: number,
): Promise<VersionComparison | null> {
  const version1 = await getFileVersion(fileId, version1Number);
  const version2 = await getFileVersion(fileId, version2Number);

  if (!version1 || !version2) {
    return null;
  }

  const sizeChange = version2.file_size - version1.file_size;
  const sizeDelta =
    sizeChange > 0 ? `+${formatBytes(sizeChange)}` : formatBytes(sizeChange);

  const time1 = new Date(version1.created_at!).getTime();
  const time2 = new Date(version2.created_at!).getTime();
  const timeDelta = time2 - time1;

  return {
    version1,
    version2,
    differences: {
      sizeChange,
      sizeDelta,
      nameChanged: version1.file_name !== version2.file_name,
      typeChanged: version1.mime_type !== version2.mime_type,
      uploaderChanged: version1.uploaded_by !== version2.uploaded_by,
      timeDelta,
    },
  };
}

/**
 * Delete old versions (keep only N most recent)
 */
export async function pruneOldVersions(
  fileId: string,
  keepCount: number,
): Promise<number> {
  const supabase = await createClient();

  const versions = await getFileVersions(fileId);

  if (versions.length <= keepCount) {
    return 0; // Nothing to prune
  }

  // Delete old versions (keep the most recent keepCount)
  const versionsToDelete = versions.slice(keepCount);
  const versionIds = versionsToDelete.map((v) => v.id).filter(Boolean);

  if (versionIds.length === 0) {
    return 0;
  }

  const { error } = await supabase
    .from('file_versions')
    .delete()
    .in('id', versionIds);

  if (error) {
    throw new Error(`Failed to prune versions: ${error.message}`);
  }

  // Update total_versions count
  await supabase
    .from('file_metadata')
    .update({
      total_versions: keepCount,
    })
    .eq('id', fileId);

  return versionsToDelete.length;
}

/**
 * Get file history with change logs
 */
export async function getFileHistory(
  fileId: string,
): Promise<
  Array<FileVersion & { uploader?: { full_name: string; email: string } }>
> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('file_versions')
    .select(
      `
      *,
      profiles!uploaded_by(full_name, email)
    `,
    )
    .eq('file_id', fileId)
    .order('version_number', { ascending: false });

  if (error) return [];

  return (
    data?.map((version) => ({
      ...version,
      uploader: version.profiles,
    })) || []
  );
}

/**
 * Get version statistics
 */
export async function getVersionStats(organizationId: string): Promise<{
  totalFiles: number;
  totalVersions: number;
  averageVersionsPerFile: number;
  mostVersionedFiles: Array<{
    fileId: string;
    fileName: string;
    versions: number;
  }>;
  recentVersions: FileVersion[];
}> {
  const supabase = await createClient();

  // Get file metadata
  const { data: files } = await supabase
    .from('file_metadata')
    .select('*')
    .eq('organization_id', organizationId);

  const totalFiles = files?.length || 0;
  const totalVersions =
    files?.reduce((sum, file) => sum + file.total_versions, 0) || 0;
  const averageVersionsPerFile =
    totalFiles > 0 ? Math.round(totalVersions / totalFiles) : 0;

  // Get most versioned files
  const mostVersionedFiles = (files || [])
    .sort((a, b) => b.total_versions - a.total_versions)
    .slice(0, 5)
    .map((file) => ({
      fileId: file.id!,
      fileName: file.file_name,
      versions: file.total_versions,
    }));

  // Get recent versions across all files
  const fileIds = files?.map((f) => f.id) || [];
  const { data: recentVersions } = await supabase
    .from('file_versions')
    .select('*')
    .in('file_id', fileIds)
    .order('created_at', { ascending: false })
    .limit(10);

  return {
    totalFiles,
    totalVersions,
    averageVersionsPerFile,
    mostVersionedFiles,
    recentVersions: recentVersions || [],
  };
}

/**
 * Calculate file checksum (for detecting changes)
 */
export async function calculateChecksum(fileBuffer: Buffer): Promise<string> {
  const crypto = await import('crypto');
  return crypto.createHash('sha256').update(fileBuffer).digest('hex');
}

/**
 * Format bytes to human-readable size
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
  const value = bytes / Math.pow(k, i);

  return `${value.toFixed(2)} ${sizes[i]}`;
}

/**
 * Get file by entity
 */
export async function getFilesByEntity(
  organizationId: string,
  entityType: 'evidence' | 'certificate' | 'document',
  entityId: string,
): Promise<FileMetadata[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('file_metadata')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('updated_at', { ascending: false });

  if (error) return [];

  return data || [];
}

/**
 * Check if file has been modified (by checksum)
 */
export async function hasFileChanged(
  fileId: string,
  newChecksum: string,
): Promise<boolean> {
  const supabase = await createClient();

  const { data: fileMetadata } = await supabase
    .from('file_metadata')
    .select('current_version')
    .eq('id', fileId)
    .single();

  if (!fileMetadata) {
    return false;
  }

  const currentVersion = await getFileVersion(
    fileId,
    fileMetadata.current_version,
  );

  return currentVersion?.checksum !== newChecksum;
}
