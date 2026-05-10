const userBusyWith = new Map<string, string>();
const inviteTimers = new Map<string, ReturnType<typeof setTimeout>>();
const channelMembers = new Map<string, readonly [string, string]>();

export const roomId = (a: string, b: string) =>
  `room:${[a, b].sort().map(encodeURIComponent).join("|")}`;

const usersInChannel = (channel: string): string[] => {
  const members = channelMembers.get(channel);
  if (members) return [...members];

  const inferred: string[] = [];
  for (const [userId, busyChannel] of userBusyWith) {
    if (busyChannel === channel) inferred.push(userId);
  }
  return inferred;
};

const clearInviteTimer = (channel: string) => {
  const timer = inviteTimers.get(channel);
  if (!timer) return;

  clearTimeout(timer);
  inviteTimers.delete(channel);
};

const releaseChannel = (channel: string): readonly string[] => {
  const members = usersInChannel(channel);
  clearInviteTimer(channel);

  if (members.length === 0) {
    channelMembers.delete(channel);
    return [];
  }

  for (const userId of members) {
    if (userBusyWith.get(userId) === channel) {
      userBusyWith.delete(userId);
    }
  }

  for (const [userId, busyChannel] of userBusyWith) {
    if (busyChannel === channel) {
      userBusyWith.delete(userId);
    }
  }

  channelMembers.delete(channel);
  return Array.from(new Set(members));
};

export const chatStore = {
  busyUserCount: () => userBusyWith.size,
  pendingInviteCount: () => inviteTimers.size,
  activeChannelCount: () => channelMembers.size,

  hasBusyUser: (userId: string) => userBusyWith.has(userId),
  getBusyChannel: (userId: string) => userBusyWith.get(userId),
  markChannelBusy: (channel: string, userA: string, userB: string) => {
    const members = [userA, userB] as const;
    channelMembers.set(channel, members);
    userBusyWith.set(userA, channel);
    userBusyWith.set(userB, channel);
    return members;
  },

  getChannelMembers: (channel: string) => channelMembers.get(channel),
  releaseChannel,

  getInviteTimer: (channel: string) => inviteTimers.get(channel),
  setInviteTimer: (channel: string, timer: ReturnType<typeof setTimeout>) =>
    inviteTimers.set(channel, timer),
  deleteInviteTimer: (channel: string) => inviteTimers.delete(channel),
  clearInviteTimer,
};
