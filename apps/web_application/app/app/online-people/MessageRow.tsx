"use client";

import React, { memo, useMemo } from "react";
import type { ChatMessage } from "@/lib/redux/slices/chatSlice";

const MessageRow = memo(
  ({ msg, isMine }: { msg: ChatMessage; isMine: boolean }) => {
    const time = useMemo(
      () =>
        new Date(msg.ts).toLocaleTimeString(undefined, {
          hour: "2-digit",
          minute: "2-digit",
        }),
      [msg.ts],
    );

    const isSystem = msg.fromId === "__system__";

    if (isSystem) {
      return (
        <div className="flex justify-center my-2">
          <span className="text-[10px] text-muted-foreground/60 bg-muted/30 px-3 py-1 rounded-full">
            {msg.text}
          </span>
        </div>
      );
    }

    return (
      <div className={`flex ${isMine ? "justify-end" : "justify-start"} mb-2`}>
        <div
          className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${isMine ? "bg-primary text-primary-foreground rounded-br-sm shadow-md shadow-primary/20" : "glass border border-border text-foreground rounded-bl-sm bg-card/50"}`}
        >
          <p className="wrap-break-words">{msg.text}</p>
          <p
            className={`mt-0.5 text-[10px] ${isMine ? "text-primary-foreground/60 text-right" : "text-muted-foreground/60"}`}
          >
            {time}
          </p>
        </div>
      </div>
    );
  },
);

MessageRow.displayName = "MessageRow";

export default MessageRow;
