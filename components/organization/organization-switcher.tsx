'use client';

/**
 * =========================================================
 * Organization Switcher Component
 * =========================================================
 * Switch between multiple organizations
 */

import { useState, useEffect } from 'react';
import { Building2, Check, Plus, ChevronDown } from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  logo_url?: string;
  role: string;
}

interface OrganizationSwitcherProps {
  userId: string;
  currentOrgId?: string;
}

export default function OrganizationSwitcher({
  userId,
  currentOrgId,
}: OrganizationSwitcherProps) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrganizations();
  }, [userId]);

  const fetchOrganizations = async () => {
    try {
      const res = await fetch(`/api/organizations?userId=${userId}`);
      const data = await res.json();

      setOrganizations(data.organizations || []);

      // Set current org
      const current = data.organizations?.find(
        (org: Organization) => org.id === (currentOrgId || data.currentOrgId),
      );
      setCurrentOrg(current || data.organizations?.[0] || null);
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitch = async (orgId: string) => {
    try {
      // Update current organization
      await fetch('/api/organizations/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId: orgId }),
      });

      // Reload page to update context
      window.location.reload();
    } catch (error) {
      console.error('Failed to switch organization:', error);
    }
  };

  const handleCreateNew = () => {
    // Navigate to create organization page
    window.location.href = '/organizations/new';
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg animate-pulse">
        <div className="h-8 w-8 bg-gray-200 rounded" />
        <div className="h-4 w-24 bg-gray-200 rounded" />
      </div>
    );
  }

  if (!currentOrg) {
    return (
      <button
        onClick={handleCreateNew}
        className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        <Plus className="h-5 w-5" />
        <span className="font-medium">Create Organization</span>
      </button>
    );
  }

  return (
    <div className="relative">
      {/* Current Organization Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors min-w-0 sm:min-w-[200px] w-full sm:w-auto"
      >
        {currentOrg.logo_url ? (
          <img
            src={currentOrg.logo_url}
            alt={currentOrg.name}
            className="h-8 w-8 rounded object-cover"
          />
        ) : (
          <div className="h-8 w-8 rounded bg-blue-100 flex items-center justify-center">
            <Building2 className="h-5 w-5 text-blue-600" />
          </div>
        )}

        <div className="flex-1 text-left min-w-0">
          <div className="font-medium text-sm truncate">{currentOrg.name}</div>
          <div className="text-xs text-gray-500 capitalize">
            {currentOrg.role}
          </div>
        </div>

        <ChevronDown
          className={`h-5 w-5 text-gray-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden">
            {/* Organizations List */}
            <div className="max-h-64 overflow-y-auto">
              {organizations.map((org) => (
                <button
                  key={org.id}
                  onClick={() => handleSwitch(org.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${
                    org.id === currentOrg.id ? 'bg-blue-50' : ''
                  }`}
                >
                  {org.logo_url ? (
                    <img
                      src={org.logo_url}
                      alt={org.name}
                      className="h-8 w-8 rounded object-cover"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-5 w-5 text-gray-600" />
                    </div>
                  )}

                  <div className="flex-1 text-left min-w-0">
                    <div className="font-medium text-sm truncate">
                      {org.name}
                    </div>
                    <div className="text-xs text-gray-500 capitalize">
                      {org.role}
                    </div>
                  </div>

                  {org.id === currentOrg.id && (
                    <Check className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200" />

            {/* Create New Organization */}
            <button
              onClick={handleCreateNew}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-blue-600 font-medium"
            >
              <div className="h-8 w-8 rounded bg-blue-100 flex items-center justify-center">
                <Plus className="h-5 w-5" />
              </div>
              <span>Create New Organization</span>
            </button>

            {/* Organization Settings */}
            <button
              onClick={() => {
                window.location.href = '/settings/organization';
              }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-gray-700 border-t border-gray-200"
            >
              <Building2 className="h-5 w-5 text-gray-500 ml-2" />
              <span>Organization Settings</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
