import { FRIENDS, PARTIES } from "@/data/mock";
import { getRandomBytesAsync } from "expo-crypto";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

export interface ChatMessage {
  id: string;
  who: string;
  initials: string;
  text?: string;
  audioUri?: string;
  audioDurationMs?: number;
  mine?: boolean;
}

const REACTION_LINES = [
  "😂😂😂",
  "wait what 💀",
  "no way",
  "who's turn next?",
  "🔥🔥🔥",
  "lol same",
  "I'm dead 😭",
  "let's gooo 🚀",
];

const firstName = (name: string) => name.split(" ")[0];

function seedMessages(partyId: string): ChatMessage[] {
  const party = PARTIES.find((p) => p.id === partyId);
  if (!party) return [];

  const seed: ChatMessage[] = [
    {
      id: `${partyId}-m1`,
      who: party.host,
      initials: party.hostAvatar,
      text: "Welcome in, glad you could make it! 🎉",
    },
  ];

  FRIENDS.slice(0, 3).forEach((f, i) => {
    seed.push({
      id: `${partyId}-m${i + 2}`,
      who: firstName(f.name),
      initials: f.initials,
      text: ["Let's GO 🚀", "Setting up drinks 🥤", "This is going to be wild 😂"][i],
    });
  });

  return seed;
}

interface ChatContextType {
  getMessages: (partyId: string) => ChatMessage[];
  sendMessage: (partyId: string, text: string) => void;
  sendVoiceNote: (partyId: string, uri: string, durationMs: number) => void;
  unreadCount: (partyId: string) => number;
  enterChat: (partyId: string) => void;
  leaveChat: () => void;
  blockUser: (who: string) => void;
  isBlocked: (who: string) => boolean;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// New messages "arrive" on a timer to simulate a live party chat, so the
// Discover unread badge has something to react to even without a backend.
const SIMULATED_MESSAGE_INTERVAL_MS = 15000;

async function secureRandomIndex(length: number): Promise<number> {
  if (length <= 0) {
    throw new Error("Cannot select from an empty array");
  }

  const randomBytes = await getRandomBytesAsync(4);
  const randomValue =
    ((randomBytes[0] << 24) |
      (randomBytes[1] << 16) |
      (randomBytes[2] << 8) |
      randomBytes[3]) >>> 0;

  return randomValue % length;
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const [messagesByParty, setMessagesByParty] = useState<Record<string, ChatMessage[]>>(
    () => {
      const initial: Record<string, ChatMessage[]> = {};
      PARTIES.forEach((p) => {
        initial[p.id] = seedMessages(p.id);
      });
      return initial;
    }
  );
  const [unreadByParty, setUnreadByParty] = useState<Record<string, number>>({});
  const [blockedUsers, setBlockedUsers] = useState<Set<string>>(new Set());

  const activePartyIdRef = useRef<string | null>(null);
  const blockedUsersRef = useRef(blockedUsers);

  useEffect(() => {
    blockedUsersRef.current = blockedUsers;
  }, [blockedUsers]);

  useEffect(() => {
    const interval = setInterval(async () => {
      const pool = FRIENDS.filter((f) => !blockedUsersRef.current.has(firstName(f.name)));
      if (pool.length === 0 || PARTIES.length === 0 || REACTION_LINES.length === 0) return;

      const [partyIndex, senderIndex, reactionIndex] = await Promise.all([
        secureRandomIndex(PARTIES.length),
        secureRandomIndex(pool.length),
        secureRandomIndex(REACTION_LINES.length),
      ]);

      const party = PARTIES[partyIndex];
      const sender = pool[senderIndex];
      const text = REACTION_LINES[reactionIndex];

      const msg: ChatMessage = {
        id: `sim-${party.id}-${Date.now()}`,
        who: firstName(sender.name),
        initials: sender.initials,
        text,
      };

      setMessagesByParty((prev) => ({
        ...prev,
        [party.id]: [...(prev[party.id] ?? []), msg],
      }));

      if (activePartyIdRef.current !== party.id) {
        setUnreadByParty((prev) => ({ ...prev, [party.id]: (prev[party.id] ?? 0) + 1 }));
      }
    }, SIMULATED_MESSAGE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  const getMessages = (partyId: string) =>
    (messagesByParty[partyId] ?? []).filter((m) => !blockedUsers.has(m.who));

  const sendMessage = (partyId: string, text: string) => {
    const msg: ChatMessage = { id: `you-${Date.now()}`, who: "You", initials: "Y", text, mine: true };
    setMessagesByParty((prev) => ({ ...prev, [partyId]: [...(prev[partyId] ?? []), msg] }));
  };

  const sendVoiceNote = (partyId: string, uri: string, durationMs: number) => {
    const msg: ChatMessage = {
      id: `you-${Date.now()}`,
      who: "You",
      initials: "Y",
      audioUri: uri,
      audioDurationMs: durationMs,
      mine: true,
    };
    setMessagesByParty((prev) => ({ ...prev, [partyId]: [...(prev[partyId] ?? []), msg] }));
  };

  const unreadCount = (partyId: string) => unreadByParty[partyId] ?? 0;

  const enterChat = (partyId: string) => {
    activePartyIdRef.current = partyId;
    setUnreadByParty((prev) => (prev[partyId] ? { ...prev, [partyId]: 0 } : prev));
  };

  const leaveChat = () => {
    activePartyIdRef.current = null;
  };

  const blockUser = (who: string) => setBlockedUsers((prev) => new Set(prev).add(who));
  const isBlocked = (who: string) => blockedUsers.has(who);

  return (
    <ChatContext.Provider
      value={{
        getMessages,
        sendMessage,
        sendVoiceNote,
        unreadCount,
        enterChat,
        leaveChat,
        blockUser,
        isBlocked,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
