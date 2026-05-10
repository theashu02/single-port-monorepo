export type OnlineUser = {
  id: string;
  name: string;
};

export type ServerMsg =
  | {
      type: "snapshot";
      users: OnlineUser[];
    }
  | {
      type: "user_joined";
      user: OnlineUser;
    }
  | {
      type: "user_left";
      userId: string;
    }
  | {
      type: "chat_invite";
      from: string;
      channel: string;
    }
  | {
      type: "chat_ready";
      channel: string;
    }
  | {
      type: "chat_message";
      from: string;
      text: string;
    };

export type ClientMsg =
  | {
      type: "chat_request";
      targetId: string;
    }
  | {
      type: "accept_chat";
      fromId: string;
    }
  | {
      type: "chat_message";
      channel: string;
      text: string;
    };
