export type LogMeta = Record<
  string,
  string | number | boolean | null | undefined
>;

export interface ServiceMetrics {
  onlineUsers: number;
  busyUsers: number;
  pendingInvites: number;
  activeChannels: number;
}

let readMetrics = (): ServiceMetrics => ({
  onlineUsers: 0,
  busyUsers: 0,
  pendingInvites: 0,
  activeChannels: 0,
});

export const configureLoggerMetrics = (reader: () => ServiceMetrics) => {
  readMetrics = reader;
};

const writeLog = (
  level: "info" | "warn",
  event: string,
  meta: LogMeta = {},
) => {
  console[level](
    `[websocket_service] ${JSON.stringify({
      ts: new Date().toISOString(),
      event,
      ...readMetrics(),
      ...meta,
    })}`,
  );
};

export const logInfo = (event: string, meta: LogMeta = {}) => {
  writeLog("info", event, meta);
};

export const logWarn = (event: string, meta: LogMeta = {}) => {
  writeLog("warn", event, meta);
};
