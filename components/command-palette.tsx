'use client';

import { useEffect, useState, useCallback } from 'react';
import { Command } from 'cmdk';
import { useRouter } from 'next/navigation';
import {
  Home,
  FileText,
  Users,
  Settings,
  Search,
  File,
  BarChart,
  Shield,
  Mail,
} from 'lucide-react';

interface CommandItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
  category: string;
}

export default function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Cmd+K or Ctrl+K to open
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const commands: CommandItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <Home className="w-4 h-4" />,
      action: () => router.push('/app'),
      category: 'Navigation',
    },
    {
      id: 'forms',
      label: 'Forms',
      icon: <FileText className="w-4 h-4" />,
      action: () => router.push('/app/forms'),
      category: 'Navigation',
    },
    {
      id: 'policies',
      label: 'Policies',
      icon: <Shield className="w-4 h-4" />,
      action: () => router.push('/app/policies'),
      category: 'Navigation',
    },
    {
      id: 'tasks',
      label: 'Tasks',
      icon: <File className="w-4 h-4" />,
      action: () => router.push('/app/tasks'),
      category: 'Navigation',
    },
    {
      id: 'team',
      label: 'Team Members',
      icon: <Users className="w-4 h-4" />,
      action: () => router.push('/app/people'),
      category: 'Navigation',
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: <BarChart className="w-4 h-4" />,
      action: () => router.push('/app/analytics'),
      category: 'Navigation',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="w-4 h-4" />,
      action: () => router.push('/app/settings'),
      category: 'Settings',
    },
    {
      id: 'email-prefs',
      label: 'Email Preferences',
      icon: <Mail className="w-4 h-4" />,
      action: () => router.push('/app/settings/email-preferences'),
      category: 'Settings',
    },
  ];

  const handleSelect = useCallback((item: CommandItem) => {
    setOpen(false);
    setSearch('');
    item.action();
  }, []);

  if (!open) return null;

  return (
    <div className="command-palette">
      <div className="command-backdrop" onClick={() => setOpen(false)} />
      
      <Command className="command-dialog">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
          <Search className="w-5 h-5 text-slate-400" />
          <Command.Input
            value={search}
            onValueChange={setSearch}
            placeholder="Search FormaOS..."
            className="flex-1 bg-transparent outline-none text-base placeholder:text-slate-400"
          />
          <kbd className="px-2 py-1 text-xs font-mono bg-white/10 border border-white/10 rounded">
            ESC
          </kbd>
        </div>

        <Command.List className="max-h-[400px] overflow-y-auto p-2">
          <Command.Empty className="px-4 py-8 text-center text-sm text-slate-400">
            No results found.
          </Command.Empty>

          {Array.from(new Set(commands.map((c) => c.category))).map((category) => (
            <Command.Group
              key={category}
              heading={category}
              className="px-2 py-2"
            >
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                {category}
              </div>
              {commands
                .filter((c) => c.category === category)
                .map((item) => (
                  <Command.Item
                    key={item.id}
                    value={item.label}
                    onSelect={() => handleSelect(item)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer
                             hover:bg-white/10 transition-colors duration-150
                             data-[selected=true]:bg-white/10"
                  >
                    <div className="text-slate-400">{item.icon}</div>
                    <span className="flex-1 text-sm font-medium text-slate-100">
                      {item.label}
                    </span>
                  </Command.Item>
                ))}
            </Command.Group>
          ))}
        </Command.List>

        <div className="border-t border-white/10 px-4 py-2 text-xs text-slate-400 flex items-center justify-between">
          <span>Navigate with ↑↓ • Select with ↵</span>
          <span className="font-mono">Cmd+K to close</span>
        </div>
      </Command>
    </div>
  );
}