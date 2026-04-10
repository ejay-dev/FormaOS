'use client';

import { Search, Bell, Settings, Sun } from 'lucide-react';
import { demoOrg, demoUsers } from './demo-data';

export default function DemoTopBar() {
  const currentUser = demoUsers[0]; // Sarah Chen

  return (
    <div className="flex-shrink-0">
      {/* Main topbar */}
      <div className="flex h-10 items-center justify-between border-b border-white/[0.08] bg-[#0a0f1e] px-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-[10px] text-white/40 font-mono">
          <span className="uppercase tracking-wider">Organization</span>
          <span className="text-white/20">&rsaquo;</span>
          <span className="text-white/60">{demoOrg.name}</span>
          <span className="text-white/20">&rsaquo;</span>
          <span className="text-cyan-400/60 uppercase tracking-wider">Admin</span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="flex items-center gap-1.5 rounded-md bg-white/[0.04] px-2.5 py-1 text-[10px] text-white/30 min-w-0 max-w-[180px] w-full">
            <Search className="h-3 w-3 flex-shrink-0 text-white/30" />
            <span className="truncate">Search...</span>
          </div>

          {/* Notifications */}
          <div className="relative">
            <Bell className="h-3.5 w-3.5 text-white/40" />
            <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-cyan-500 border border-[#0a0f1e] flex items-center justify-center">
              <span className="text-[6px] font-bold text-white">3</span>
            </span>
          </div>

          <Settings className="h-3.5 w-3.5 text-white/30" />
          <Sun className="h-3.5 w-3.5 text-white/30" />

          {/* Avatar */}
          <div className="flex items-center gap-1.5">
            <div className="h-5 w-5 rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center">
              <span className="text-[8px] font-bold text-white">{currentUser.avatar}</span>
            </div>
            <span className="hidden sm:block text-[10px] font-medium text-white/60 truncate max-w-[80px]">
              {currentUser.name.split(' ')[0]}
            </span>
          </div>

          {/* Trial badge */}
          <span className="rounded bg-amber-500/15 border border-amber-500/25 px-1.5 py-0.5 text-[9px] font-medium text-amber-400">
            14d left
          </span>
        </div>
      </div>

      {/* Compliance strip */}
      <div className="flex items-center gap-4 h-6 px-4 bg-[#080c18] border-b border-white/[0.06]">
        <span className="flex items-center gap-1.5 text-[10px]">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
          <span className="text-white/40">0 Overdue</span>
        </span>
        <span className="flex items-center gap-1.5 text-[10px]">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          <span className="text-white/40">0 Due Soon</span>
        </span>
        <span className="flex items-center gap-1.5 text-[10px]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="text-white/40">0 Completed</span>
        </span>
        <div className="flex-1" />
        <span className="flex items-center gap-1.5 text-[9px] text-white/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Last synced 2 min ago &bull; Live
        </span>
      </div>
    </div>
  );
}
