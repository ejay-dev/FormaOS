/**
 * New Participant Form Page
 */

import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { fetchSystemState } from "@/lib/system-state/server";
import { createParticipant } from "@/app/app/actions/care-operations";

function getEntityLabel(industry: string | null): string {
  switch (industry) {
    case "ndis":
      return "Participant";
    case "healthcare":
      return "Patient";
    case "aged_care":
      return "Resident";
    default:
      return "Client";
  }
}

export default async function NewParticipantPage() {
  const systemState = await fetchSystemState();
  if (!systemState) redirect("/auth/signin");

  const label = getEntityLabel(systemState.organization.industry);
  const isNDIS = systemState.organization.industry === "ndis";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/app/participants"
          className="p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Add New {label}</h1>
          <p className="text-muted-foreground">Enter {label.toLowerCase()} details</p>
        </div>
      </div>

      {/* Form */}
      <form action={createParticipant} className="space-y-6">
        {/* Basic Information */}
        <div className="rounded-xl border border-border p-6 space-y-4">
          <h2 className="text-lg font-semibold">Basic Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="field-34" className="block text-sm font-medium mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="full_name"
                required
                className="w-full px-3 py-2 rounded-lg border border-input bg-background"
                placeholder="Enter full name"
              />
            </div>
            <div>
              <label htmlFor="field-33" className="block text-sm font-medium mb-1">Preferred Name</label>
              <input id="field-33"
                type="text"
                name="preferred_name"
                className="w-full px-3 py-2 rounded-lg border border-input bg-background"
                placeholder="Nickname or preferred name"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="field-32" className="block text-sm font-medium mb-1">Date of Birth</label>
              <input id="field-32"
                type="date"
                name="date_of_birth"
                className="w-full px-3 py-2 rounded-lg border border-input bg-background"
              />
            </div>
            <div>
              <label htmlFor="field-31" className="block text-sm font-medium mb-1">Gender</label>
              <select id="field-31"
                name="gender"
                className="w-full px-3 py-2 rounded-lg border border-input bg-background"
              >
                <option value="">Select...</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="non_binary">Non-binary</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="field-30" className="block text-sm font-medium mb-1">Phone</label>
              <input id="field-30"
                type="tel"
                name="phone"
                className="w-full px-3 py-2 rounded-lg border border-input bg-background"
                placeholder="Phone number"
              />
            </div>
            <div>
              <label htmlFor="field-29" className="block text-sm font-medium mb-1">Email</label>
              <input id="field-29"
                type="email"
                name="email"
                className="w-full px-3 py-2 rounded-lg border border-input bg-background"
                placeholder="Email address"
              />
            </div>
          </div>

          <div>
            <label htmlFor="field-28" className="block text-sm font-medium mb-1">Address</label>
            <textarea id="field-28"
              name="address"
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background"
              placeholder="Full address"
            />
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="rounded-xl border border-border p-6 space-y-4">
          <h2 className="text-lg font-semibold">Emergency Contact</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="field-27" className="block text-sm font-medium mb-1">Contact Name</label>
              <input id="field-27"
                type="text"
                name="emergency_contact_name"
                className="w-full px-3 py-2 rounded-lg border border-input bg-background"
              />
            </div>
            <div>
              <label htmlFor="field-26" className="block text-sm font-medium mb-1">Contact Phone</label>
              <input id="field-26"
                type="tel"
                name="emergency_contact_phone"
                className="w-full px-3 py-2 rounded-lg border border-input bg-background"
              />
            </div>
            <div>
              <label htmlFor="field-25" className="block text-sm font-medium mb-1">Relationship</label>
              <input id="field-25"
                type="text"
                name="emergency_contact_relationship"
                className="w-full px-3 py-2 rounded-lg border border-input bg-background"
                placeholder="e.g., Parent, Spouse"
              />
            </div>
          </div>
        </div>

        {/* Funding & Care */}
        <div className="rounded-xl border border-border p-6 space-y-4">
          <h2 className="text-lg font-semibold">Funding & Care Details</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="field-24" className="block text-sm font-medium mb-1">Funding Type</label>
              <select id="field-24"
                name="funding_type"
                className="w-full px-3 py-2 rounded-lg border border-input bg-background"
              >
                <option value="">Select...</option>
                <option value="ndis">NDIS</option>
                <option value="chsp">CHSP</option>
                <option value="private">Private</option>
                <option value="dva">DVA</option>
                <option value="other">Other</option>
              </select>
            </div>
            {isNDIS && (
              <div>
                <label htmlFor="field-23" className="block text-sm font-medium mb-1">NDIS Number</label>
                <input id="field-23"
                  type="text"
                  name="ndis_number"
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background"
                  placeholder="NDIS participant number"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="field-22" className="block text-sm font-medium mb-1">External ID</label>
              <input id="field-22"
                type="text"
                name="external_id"
                className="w-full px-3 py-2 rounded-lg border border-input bg-background"
                placeholder="Reference number from other system"
              />
            </div>
            <div>
              <label htmlFor="field-21" className="block text-sm font-medium mb-1">Primary Diagnosis</label>
              <input id="field-21"
                type="text"
                name="primary_diagnosis"
                className="w-full px-3 py-2 rounded-lg border border-input bg-background"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="field-20" className="block text-sm font-medium mb-1">Care Status</label>
              <select id="field-20"
                name="care_status"
                className="w-full px-3 py-2 rounded-lg border border-input bg-background"
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="discharged">Discharged</option>
              </select>
            </div>
            <div>
              <label htmlFor="field-19" className="block text-sm font-medium mb-1">Risk Level</label>
              <select id="field-19"
                name="risk_level"
                className="w-full px-3 py-2 rounded-lg border border-input bg-background"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="emergency_flag" value="true" className="rounded" />
                <span className="text-sm">Emergency Flag</span>
              </label>
            </div>
          </div>
        </div>

        {/* Additional Notes */}
        <div className="rounded-xl border border-border p-6 space-y-4">
          <h2 className="text-lg font-semibold">Additional Information</h2>

          <div>
            <label htmlFor="field-18" className="block text-sm font-medium mb-1">Communication Needs</label>
            <textarea id="field-18"
              name="communication_needs"
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background"
              placeholder="Any communication preferences or requirements"
            />
          </div>

          <div>
            <label htmlFor="field-17" className="block text-sm font-medium mb-1">Cultural Considerations</label>
            <textarea id="field-17"
              name="cultural_considerations"
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background"
              placeholder="Cultural background, dietary requirements, etc."
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 justify-end">
          <Link
            href="/app/participants"
            className="px-4 py-2 rounded-lg border border-input hover:bg-muted transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            Create {label}
          </button>
        </div>
      </form>
    </div>
  );
}
