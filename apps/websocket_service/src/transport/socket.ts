export type PublishFn = (topic: string, data: string) => unknown;
export type SendFn = (data: string) => unknown;

export interface RealtimeSocket {
  raw: object;
  data: {
    query: Record<string, string | undefined>;
  };
  close: (code?: number, reason?: string) => unknown;
  subscribe: (topic: string) => unknown;
  unsubscribe: (topic: string) => unknown;
  publish: PublishFn;
  send: SendFn;
}

export const toRealtimeSocket = (socket: unknown): RealtimeSocket =>
  socket as RealtimeSocket;
