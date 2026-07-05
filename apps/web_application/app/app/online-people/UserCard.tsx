import React, { memo, useMemo } from 'react';
import { MessageCircle, Shield, Zap } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { OnlineUser } from './OnlinePresenceProvider';
import { type ChatPhase } from '@/lib/redux/slices/chatSlice';
import { getInitials, getAvatarUrl } from '@/lib/utils/presenceUtils';

interface UserCardProps {
  user: OnlineUser;
  isCurrentUser: boolean;
  canChat: boolean;
  isActivePeer: boolean;
  isLocalChatLocked: boolean;
  chatPhase: ChatPhase;
  onChat: (user: OnlineUser) => void;
}

const UserCard = memo<UserCardProps>(function UserCard({
  user,
  isCurrentUser,
  canChat,
  isActivePeer,
  isLocalChatLocked,
  chatPhase,
  onChat,
}) {
  const avatar = useMemo(() => getAvatarUrl(user.id, user.name), [user.id, user.name]);
  const isWaiting = isActivePeer && chatPhase === 'awaiting-accept';
  const isChatting = isActivePeer && chatPhase === 'open';
  const isBusyPhase = isActivePeer && chatPhase === 'busy';
  const isExpired = isActivePeer && chatPhase === 'expired';
  const isTargetBusy = !isCurrentUser && user.isBusy;

  const buttonLabel = isCurrentUser
    ? 'You'
    : isWaiting
      ? 'Waiting…'
      : isChatting
        ? 'Chatting'
        : isBusyPhase || isTargetBusy
          ? 'Busy'
          : isExpired
            ? 'Timed out'
            : 'Message';

  const buttonDisabled =
    !canChat || isCurrentUser || isTargetBusy || isBusyPhase || isWaiting || isLocalChatLocked;

  const handleChat = () => onChat(user);

  return (
    <Card className="group relative w-full overflow-hidden border border-border bg-card shadow-sm transition-all duration-200 hover:border-primary/30 hover:shadow-md rounded-4xl p-0">
      <CardContent className="p-3">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0 transition-transform duration-300 group-hover:scale-105">
            <Avatar className="h-12 w-12 ring-2 ring-background">
              <AvatarImage src={avatar} alt={`${user.name}'s avatar`} className="object-cover" />
              <AvatarFallback className="bg-muted text-sm font-semibold text-muted-foreground">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>

            <span
              aria-label={user.isBusy ? 'Busy' : 'Available'}
              className={cn(
                'absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-background',
                user.isBusy ? 'bg-amber-500' : 'bg-emerald-500'
              )}
            >
              {!user.isBusy && <Zap className="h-2.5 w-2.5 text-white" />}
            </span>
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-base font-semibold text-foreground">{user.name}</span>
              {isCurrentUser && <Shield className="h-4 w-4 shrink-0 text-primary" />}
            </div>

            <Badge
              variant="secondary"
              className={cn(
                'h-5 w-fit rounded-md px-2 text-[10px] font-semibold uppercase tracking-wider transition-colors',
                user.isBusy
                  ? 'bg-amber-500/10 text-amber-600 group-hover:bg-amber-500/20 dark:text-amber-400'
                  : 'bg-emerald-500/10 text-emerald-600 group-hover:bg-emerald-500/20 dark:text-emerald-400'
              )}
            >
              {user.isBusy ? 'Occupied' : 'Available'}
            </Badge>
          </div>
        </div>

        <Separator className="my-4 transition-colors group-hover:bg-border/60" />

        <Button
          size="sm"
          variant={isTargetBusy || isCurrentUser ? 'secondary' : 'default'}
          disabled={buttonDisabled}
          onClick={handleChat}
          className="w-full text-xs font-semibold rounded-xl shadow-none transition-all"
          aria-label={`${buttonLabel} — ${user.name}`}
        >
          <MessageCircle className="mr-1.5 h-4 w-4" />
          {buttonLabel}
        </Button>
      </CardContent>
    </Card>
  );
});

export default UserCard;
