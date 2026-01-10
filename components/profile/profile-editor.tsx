"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";
import { updateOrganization } from "@/app/app/actions/org";
import { Mail, Phone, User as UserIcon, Building2, Image, Loader2, CheckCircle2 } from "lucide-react";

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

type ProfileEditorProps = {
  userId: string;
  orgId: string;
  role: string | null;
  userEmail: string;
  orgName: string;
  orgDomain?: string | null;
  orgRegistrationNumber?: string | null;
  profile: {
    full_name: string | null;
    phone: string | null;
    avatar_path: string | null;
  } | null;
  avatarUrl?: string | null;
};

export function ProfileEditor({
  userId,
  orgId,
  role,
  userEmail,
  orgName,
  orgDomain,
  orgRegistrationNumber,
  profile,
  avatarUrl,
}: ProfileEditorProps) {
  const supabase = useMemo(() => createSupabaseClient(), []);
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [email, setEmail] = useState(userEmail ?? "");
  const [organizationName, setOrganizationName] = useState(orgName ?? "");
  const [currentAvatarPath, setCurrentAvatarPath] = useState(profile?.avatar_path ?? null);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(avatarUrl ?? null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);

  const isAdmin = role === "owner" || role === "admin";

  useEffect(() => {
    if (!previewUrl) return undefined;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const handleFileChange = (selected: File | null) => {
    setError(null);
    setSuccess(null);
    setFile(null);
    setPreviewUrl(null);

    if (!selected) return;
    if (!ALLOWED_TYPES.includes(selected.type)) {
      setError("Please upload a JPG, PNG, or WebP image.");
      return;
    }
    if (selected.size > MAX_AVATAR_SIZE) {
      setError("Image size must be 5MB or less.");
      return;
    }

    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
  };

  const refreshAvatarUrl = async (path: string | null) => {
    if (!path) {
      setCurrentAvatarUrl(null);
      return;
    }

    const { data, error: signedError } = await supabase.storage
      .from("user-avatars")
      .createSignedUrl(path, 60 * 60 * 12);

    if (signedError) {
      console.error("Failed to create signed URL:", signedError.message);
      setCurrentAvatarUrl(null);
      return;
    }

    setCurrentAvatarUrl(data?.signedUrl ?? null);
  };

  const handleRemoveAvatar = async () => {
    if (!currentAvatarPath) return;
    setRemoving(true);
    setError(null);
    setSuccess(null);
    try {
      await supabase.storage.from("user-avatars").remove([currentAvatarPath]);
      const { error: profileError } = await supabase
        .from("user_profiles")
        .upsert(
          {
            user_id: userId,
            organization_id: orgId,
            avatar_path: null,
            full_name: fullName,
            phone,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );

      if (profileError) throw profileError;

      setCurrentAvatarPath(null);
      setCurrentAvatarUrl(null);
      setPreviewUrl(null);
      setFile(null);
      setSuccess("Profile photo removed.");
    } catch (removeError: any) {
      setError(removeError?.message ?? "Failed to remove profile photo.");
    } finally {
      setRemoving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      let avatarPath = currentAvatarPath;

      if (file) {
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${orgId}/avatars/${userId}-${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("user-avatars")
          .upload(path, file, { contentType: file.type, upsert: true });

        if (uploadError) throw uploadError;

        avatarPath = path;
      }

      const { error: profileError } = await supabase.from("user_profiles").upsert(
        {
          user_id: userId,
          organization_id: orgId,
          full_name: fullName.trim() || null,
          phone: phone.trim() || null,
          avatar_path: avatarPath,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

      if (profileError) throw profileError;

      if (email.trim() && email.trim() !== userEmail) {
        const { error: authError } = await supabase.auth.updateUser({
          email: email.trim(),
        });
        if (authError) throw authError;
      }

      if (isAdmin && organizationName.trim() && organizationName.trim() !== orgName) {
        await updateOrganization({
          name: organizationName.trim(),
          domain: orgDomain ?? undefined,
          registrationNumber: orgRegistrationNumber ?? undefined,
        });
      }

      setCurrentAvatarPath(avatarPath);
      if (file) {
        await refreshAvatarUrl(avatarPath ?? null);
      }
      setPreviewUrl(null);
      setFile(null);
      setSuccess("Profile updated successfully.");
    } catch (saveError: any) {
      setError(saveError?.message ?? "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10 shadow-sm space-y-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-100 tracking-tight">Profile & Contact</h2>
          <p className="text-sm text-slate-400">
            Update your contact details and display preferences.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 px-6 py-3 text-xs font-black uppercase tracking-[0.2em] text-slate-100 transition hover:bg-white/10 disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          Save changes
        </button>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 text-center lg:w-[220px]">
          <div className="relative h-24 w-24 overflow-hidden rounded-2xl border border-white/10 bg-white/10">
            {previewUrl || currentAvatarUrl ? (
              <img
                src={previewUrl ?? currentAvatarUrl ?? ""}
                alt="Profile avatar"
                className="h-full w-full object-cover"
                onError={() => setCurrentAvatarUrl(null)}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-slate-300">
                <UserIcon className="h-10 w-10" />
              </div>
            )}
          </div>
          <div className="space-y-2">
            <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Profile Photo</div>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-100 hover:bg-white/10">
              <Image className="h-4 w-4" />
              {previewUrl ? "Change" : "Upload"}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(event) => handleFileChange(event.target.files?.[0] ?? null)}
              />
            </label>
            <button
              type="button"
              onClick={handleRemoveAvatar}
              disabled={!currentAvatarPath || removing}
              className="w-full rounded-xl border border-white/10 bg-transparent px-4 py-2 text-[11px] font-semibold text-slate-300 hover:bg-white/10 disabled:opacity-50"
            >
              {removing ? "Removing..." : "Remove photo"}
            </button>
            <p className="text-[10px] text-slate-500">JPG, PNG, or WebP up to 5MB.</p>
          </div>
        </div>

        <div className="flex-1 space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Full name</label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/10 py-3 pl-10 pr-4 text-sm font-semibold text-slate-100 focus:outline-white/20"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Phone number</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/10 py-3 pl-10 pr-4 text-sm font-semibold text-slate-100 focus:outline-white/20"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/10 py-3 pl-10 pr-4 text-sm font-semibold text-slate-100 focus:outline-white/20"
                />
              </div>
              <p className="text-[10px] text-slate-500">
                Email updates require verification through your auth provider.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Organization name</label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={organizationName}
                  onChange={(event) => setOrganizationName(event.target.value)}
                  disabled={!isAdmin}
                  className="w-full rounded-2xl border border-white/10 bg-white/10 py-3 pl-10 pr-4 text-sm font-semibold text-slate-100 focus:outline-white/20 disabled:opacity-60"
                />
              </div>
              {!isAdmin ? (
                <p className="text-[10px] text-slate-500">Only administrators can update org details.</p>
              ) : null}
            </div>
          </div>

          {error ? (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-200">
              {error}
            </div>
          ) : null}
          {success ? (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-200">
              {success}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
