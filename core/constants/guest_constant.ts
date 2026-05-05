export function generateNickname() {
  const adjs = ["Silent", "Cool", "Happy", "Brave", "Clever", "Swift", "Wild", "Neon"];
  const nouns = ["Fox", "Panda", "Wolf", "Tiger", "Bear", "Hawk", "Dragon", "Lion"];
  const num = Math.floor(Math.random() * 1000);
  return `${adjs[Math.floor(Math.random() * adjs.length)]}${nouns[Math.floor(Math.random() * nouns.length)]}${num}`;
}

export const AVATAR_SEEDS = ["Felix", "Aneka", "Jasper", "Leo", "Midnight", "Oscar", "Luna", "Oliver", "Max", "Bella", "Charlie", "Lucy"];
export const INTEREST_OPTIONS = ["Music", "Gaming", "Tech", "Travel", "Sports", "Art", "Movies", "Food", "Fitness", "Fashion", "Crypto", "Business"];
export const GENDER_OPTIONS = ["Male", "Female", "Other", "Prefer not to say"];

export const variants = {
  enter: (direction: number) => ({ x: direction > 0 ? 80 : -80, opacity: 0, scale: 0.96 }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit: (direction: number) => ({ x: direction < 0 ? 80 : -80, opacity: 0, scale: 0.96 }),
};

export const transition = { type: "spring" as const, stiffness: 260, damping: 28 };

export interface GuestSessionData {
  guest_id: string;
  session_token: string;
  nickname?: string;
  is_guest?: boolean;
}

export interface CreateGuestPayload {
  nickname: string;
  avatar_id: string;
  gender: string | null;
  interests: string[];
  age_confirmed: boolean;
  terms_accepted: boolean;
}

export const AvatarURL = "https://api.dicebear.com/9.x/adventurer/svg?seed"