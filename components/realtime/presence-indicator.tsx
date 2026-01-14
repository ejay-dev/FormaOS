'use client';

import { usePresence } from '@/lib/realtime';
import { Users } from 'lucide-react';
import { motion } from 'framer-motion';

interface PresenceIndicatorProps {
  room: string;
  currentUser: {
    id: string;
    email: string;
  };
}

export function PresenceIndicator({
  room,
  currentUser,
}: PresenceIndicatorProps) {
  const { onlineUsers } = usePresence(room, currentUser);

  const otherUsers = onlineUsers.filter(
    (u: any) => u.user_id !== currentUser.id,
  );

  if (otherUsers.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg"
    >
      <Users className="h-4 w-4 text-green-600" />
      <div className="flex -space-x-2">
        {otherUsers.slice(0, 3).map((user: any, index) => (
          <div
            key={user.user_id}
            className="relative inline-block"
            title={user.user_email}
          >
            <div className="h-8 w-8 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center text-white text-xs font-medium">
              {user.user_email.charAt(0).toUpperCase()}
            </div>
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-white" />
          </div>
        ))}
      </div>
      <span className="text-sm text-green-700 font-medium">
        {otherUsers.length} {otherUsers.length === 1 ? 'person' : 'people'}{' '}
        viewing
      </span>
    </motion.div>
  );
}
