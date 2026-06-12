'use client';

import { useState } from 'react';
import { createAsset } from '@/app/app/registers/actions';
import {
  Plus,
  Loader2,
  ShieldAlert,
  User,
  Laptop,
  CheckCircle2,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import { useComplianceAction } from '@/components/compliance-system';
import { z } from 'zod';

const createAssetSchema = z.object({
  name: z
    .string()
    .min(1, 'Asset name is required')
    .max(200, 'Asset name must be under 200 characters'),
  type: z.enum(['hardware', 'software', 'data', 'people']),
  owner: z
    .string()
    .min(1, 'Owner is required')
    .max(200, 'Owner must be under 200 characters'),
  criticality: z.enum(['low', 'medium', 'high', 'critical']),
});

/**
 * =========================================================
 * CREATE ASSET SHEET
 * Node Type: Control (teal)
 * Creates a new control node in the compliance graph
 * =========================================================
 */

export function CreateAssetSheet() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const { nodeCreated, reportError } = useComplianceAction();

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setValidationError(null);

    const parsed = createAssetSchema.safeParse({
      name: formData.get('name'),
      type: formData.get('type'),
      owner: formData.get('owner'),
      criticality: formData.get('criticality'),
    });

    if (!parsed.success) {
      setValidationError(parsed.error.issues[0]?.message ?? 'Invalid input');
      setLoading(false);
      return;
    }

    try {
      // The Server Action handles Auth, Validation, and DB Insertion
      await createAsset(formData);

      // Get the asset name for feedback
      const assetName = formData.get('name') as string;

      // Show success state briefly
      setSuccess(true);

      // Report to compliance system
      nodeCreated('control', assetName);

      // Close after brief success animation
      setTimeout(() => {
        setOpen(false);
        setSuccess(false);
      }, 1000);
    } catch (error: unknown) {
      reportError({
        title: 'Asset creation failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) setSuccess(false);
      }}
    >
      <SheetTrigger asChild>
        <button className="group flex items-center gap-2 rounded-xl bg-foreground px-4 py-2 text-sm font-bold text-background hover:opacity-90 transition-all shadow-lg motion-safe:active:scale-[0.98]">
          <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform" />
          Add Asset
        </button>
      </SheetTrigger>

      <SheetContent side="right" className="sm:max-w-md">
        {success ? (
          <div className="flex flex-col items-center justify-center h-full animate-in fade-in zoom-in-95 duration-300">
            <div className="h-20 w-20 rounded-full bg-success/10 flex items-center justify-center mb-4 border-2 border-success/20">
              <CheckCircle2 className="h-10 w-10 text-success" />
            </div>
            <h3 className="text-xl font-bold text-foreground">
              Asset Registered
            </h3>
            <p className="text-sm text-muted-foreground mt-2 text-center">
              New control node added to your compliance graph
            </p>
          </div>
        ) : (
          <form action={handleSubmit} className="flex flex-col h-full">
            <SheetHeader className="mb-6">
              <SheetTitle className="flex items-center gap-2">
                <div className="h-6 w-6 rounded bg-muted flex items-center justify-center">
                  <div className="h-2 w-2 rounded-sm bg-muted-foreground" />
                </div>
                Register New Asset
              </SheetTitle>
              <SheetDescription>
                Map your asset inventory and assign ownership. This creates a
                Control node.
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 space-y-6">
              {validationError && (
                <div className="p-3 rounded-xl border border-destructive/20 bg-destructive/10 text-sm text-destructive">
                  {validationError}
                </div>
              )}

              {/* 1. Asset Name */}
              <div className="space-y-2">
                <label
                  htmlFor="field-89"
                  className="text-xs font-bold uppercase text-muted-foreground tracking-wider"
                >
                  Asset Name
                </label>
                <div className="relative">
                  <Laptop className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    id="field-89"
                    required
                    name="name"
                    placeholder="e.g. AWS Production Cluster"
                    className="w-full rounded-xl border border-border pl-10 p-3 text-sm outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring transition-all"
                  />
                </div>
              </div>

              {/* 2. Asset Type */}
              <div className="space-y-2">
                <label
                  htmlFor="field-88"
                  className="text-xs font-bold uppercase text-muted-foreground tracking-wider"
                >
                  Category
                </label>
                <select
                  id="field-88"
                  name="type"
                  className="w-full rounded-xl border border-border p-3 text-sm outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring bg-surface-1"
                >
                  <option value="hardware">Hardware (Laptops, Servers)</option>
                  <option value="software">Software (SaaS, Apps)</option>
                  <option value="data">Data (Databases, Customer Lists)</option>
                  <option value="people">People (Key Personnel)</option>
                </select>
              </div>

              {/* 3. Owner (New Requirement) */}
              <div className="space-y-2">
                <label
                  htmlFor="field-87"
                  className="text-xs font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1"
                >
                  <User className="h-3 w-3" />
                  Owner
                </label>
                <input
                  required
                  name="owner"
                  placeholder="e.g. DevOps Team or CTO"
                  className="w-full rounded-xl border border-border p-3 text-sm outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring transition-colors"
                />
                <p className="text-xs text-muted-foreground">
                  The person or team responsible for this asset.
                </p>
              </div>

              {/* 4. Criticality */}
              <div className="space-y-2 pt-2">
                <label
                  htmlFor="field-86"
                  className="text-xs font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1"
                >
                  <ShieldAlert className="h-3 w-3 text-warning" />
                  Risk Level
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    name="criticality"
                    className="col-span-2 w-full rounded-xl border border-border p-3 text-sm outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring bg-surface-1"
                  >
                    <option value="low">Low - Internal Data</option>
                    <option value="medium">Medium - Operational</option>
                    <option value="high">High - Confidential</option>
                    <option value="critical">
                      Critical - Mission Critical
                    </option>
                  </select>
                </div>
              </div>
            </div>

            <SheetFooter className="border-t border-border pt-4 mt-auto">
              <button
                disabled={loading}
                type="submit"
                className="w-full flex justify-center items-center gap-2 rounded-xl bg-foreground py-4 text-sm font-bold text-background disabled:opacity-70 hover:opacity-90 transition-all shadow-lg motion-safe:active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Creating Node...</span>
                  </>
                ) : (
                  'Save to Register'
                )}
              </button>
            </SheetFooter>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}
