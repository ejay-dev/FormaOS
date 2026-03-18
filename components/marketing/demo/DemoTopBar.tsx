'use client';

import { Search, Bell } from 'lucide-react';
import { demoOrg, demoUsers } from './demo-data';

export default function DemoTopBar() {
  const currentUser = demoUsers[0]; // Sarah Chen

  return (
    <div className="flex h-10 items-center justify-between border-b border-white/[0.06] bg-[#0f1729]/60 px-4">
      {/* Search */}
      <div className="flex items-center gap-2 rounded-md bg-white/[0.04] px-2.5 py-1 text-[11px] text-slate-500 min-w-0 max-w-[220px] w-full">
        <Search className="h-3 w-3 flex-shrink-0 text-slate-500" />
        <span className="truncate">Search policies, evidence, tasks…</span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Org name */}
        <span className="hidden sm:block text-[11px] text-slate-400 truncate max-w-[140px]">
          {demoOrg.name}
        </span>

        {/* Notifications */}
        <div className="relative">
          <Bell className="h-3.5 w-3.5 text-slate-400" />
          <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-cyan-500 border border-[#0f1729] flex items-center justify-center">
            <span className="text-[7px] font-bold text-white">3</span>
          </span>
        </div>

        {/* Avatar */}
        <div className="flex items-center gap-1.5">
          <div className="h-5 w-5 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
            <span className="text-[8px] font-bold text-white">{currentUser.avatar}</span>
          </div>
          <span className="hidden sm:block text-[11px] font-medium text-slate-300 truncate max-w-[80px]">
            {currentUser.name.split(' ')[0]}
          </span>
        </div>
      </div>
    </div>
  );
}
