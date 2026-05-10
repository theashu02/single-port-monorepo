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

const formatKey = (key: string) =>
  key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const formatValue = (value: LogMeta[string]) =>
  value === undefined || value === null ? "-" : String(value);

const formatPrettyLog = (
  level: "info" | "warn",
  event: string,
  payload: LogMeta,
) => {
  const {
    ts,
    event: _payloadEvent,
    onlineUsers,
    busyUsers,
    pendingInvites,
    activeChannels,
    ...meta
  } = payload;
  const metrics = [
    `online ${onlineUsers}`,
    `busy ${busyUsers}`,
    `invites ${pendingInvites}`,
    `channels ${activeChannels}`,
  ].join(" | ");
  const details = Object.entries(meta)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${formatKey(key)}: ${formatValue(value)}`)
    .join(" | ");

  return [
    `[websocket_service]`,
    `[${String(level).toUpperCase()}]`,
    String(ts),
    formatKey(event),
    `(${metrics})`,
    details,
  ]
    .filter(Boolean)
    .join(" ");
};

const shouldWriteJsonLogs = () => process.env.LOG_FORMAT === "json";

const writeLog = (
  level: "info" | "warn",
  event: string,
  meta: LogMeta = {},
) => {
  const payload = {
    ts: new Date().toISOString(),
    event,
    ...readMetrics(),
    ...meta,
  };
  const message = shouldWriteJsonLogs()
    ? `[websocket_service] ${JSON.stringify(payload)}`
    : formatPrettyLog(level, event, payload);

  console[level](message);
};

export const logInfo = (event: string, meta: LogMeta = {}) => {
  writeLog("info", event, meta);
};

export const logWarn = (event: string, meta: LogMeta = {}) => {
  writeLog("warn", event, meta);
};
