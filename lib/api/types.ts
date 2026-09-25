// Response envelope + resource types for the Yowimo API v1.
// Mirrors http://api-yowimo.test/docs exactly — only add fields once they appear there.

export interface CursorMeta {
  per_page: number;
  has_more_pages: boolean;
  next_cursor: string | null;
  prev_cursor: string | null;
}

export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
  meta?: CursorMeta;
}

export interface ApiFailure {
  success: false;
  message: string;
  errors?: Record<string, string[]> | Record<string, unknown>;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]> | Record<string, unknown>;

  constructor(message: string, status: number, errors?: ApiFailure['errors']) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }

  /** First validation message, if this was a 422. Handy for a single-line toast. */
  get firstValidationError(): string | undefined {
    if (!this.errors) return undefined;
    const firstKey = Object.keys(this.errors)[0];
    if (!firstKey) return undefined;
    const value = (this.errors as Record<string, unknown>)[firstKey];
    return Array.isArray(value) ? String(value[0]) : String(value);
  }
}

// ─── Resources ──────────────────────────────────────────────────────────────

export interface WalletSnapshot {
  balance: number;
  currency: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserResource {
  id: number;
  username: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  date_of_birth: string | null;
  country_code: string | null;
  interests: string[];
  privacy_settings: Record<string, unknown>;
  status: string;
  last_seen_at: string;
  created_at: string;
  updated_at: string;
  wallet: WalletSnapshot;
}

export interface UpdateProfilePayload {
  username?: string;
  avatar_url?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  display_name?: string | null;
  bio?: string | null;
  date_of_birth?: string | null;
  country_code?: string | null;
  interests?: string[] | null;
  privacy_settings?: Record<string, unknown> | null;
}

export type Intensity = 'chill' | 'medium' | 'wild';

export interface GameTypeResource {
  id: number;
  slug: string;
  name: string;
  emoji: string;
  tagline: string;
  audience: string;
  intensity: Intensity;
  cost: number;
  image_url: string | null;
  gradient: [string, string];
  created_at: string;
  updated_at: string;
}

export type PackCategory = 'spicy' | 'couples' | 'family' | 'corporate' | 'limited';

export interface PackCard {
  id: number;
  kind: 'truth' | 'dare';
  text: string;
  position: number;
}

export interface PackResource {
  id: number;
  slug: string;
  name: string;
  emoji: string;
  tag: string | null;
  category: PackCategory;
  description: string;
  price: number;
  truths_count: number;
  dares_count: number;
  cards_count: number;
  cover_image_url: string | null;
  gradient: [string, string];
  is_featured: boolean;
  game_type: { id: number; slug: string } | null;
  preview_cards: PackCard[];
  /** Present on every pack endpoint (list, featured, detail) — batched per page, not per pack. */
  owned_by_me: boolean;
  created_at: string;
  updated_at: string;
}

export interface PackPurchaseResult {
  id: number;
  pack_id: number;
  wallet_transaction: WalletTransactionResource;
  purchased_at: string;
}

export interface TokenBundleResource {
  id: number;
  slug: string;
  name: string;
  tokens: number;
  price: number;
  currency: string;
  badge: string | null;
  gradient: [string, string];
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

/** At most one of these — give neither to charge the caller's default saved card. */
export interface PurchaseTokenBundlePayload {
  payment_reference?: string;
  payment_method_id?: number;
}

export interface PaymentMethodResource {
  id: number;
  provider: string;
  card_type: string;
  last4: string;
  exp_month: string;
  exp_year: string;
  bank: string;
  is_default: boolean;
  created_at: string;
}

export type WalletTransactionType =
  | 'top_up'
  | 'purchase'
  | 'refund'
  | 'bonus'
  | 'adjustment'
  | 'reward';

export interface WalletTransactionResource {
  id: number;
  type: WalletTransactionType;
  amount: number;
  balance_after: number;
  description: string;
  created_at: string;
}

export interface BadgeResource {
  id: number;
  key: string;
  name: string;
  description: string;
  icon: string;
  created_at: string;
}

export interface UserBadgeResource {
  id: number;
  badge: BadgeResource;
  earned_at: string;
}

export type PartyMode = 'online' | 'hybrid' | 'in_person';
export type PartyVisibility = 'public' | 'private';
export type PartyStatus = 'draft' | 'scheduled' | 'live' | 'ended';

export interface PartyLocation {
  venue_name?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

export interface PartySummary {
  id: number;
  room_code?: string; // only present for host, or on public parties — check `'room_code' in data`
  title: string;
  mode: PartyMode;
  visibility: PartyVisibility;
  status: PartyStatus;
  max_players: number;
  players_count: number;
  likes_count: number;
  liked_by_me: boolean;
  joined_by_me: boolean;
  host: { id: number; username: string };
}

export interface PartyDetail extends Omit<PartySummary, 'host'> {
  description: string | null;
  is_sponsored: boolean;
  sponsor_name: string | null;
  tags: string[];
  starts_at: string | null;
  location: PartyLocation | null;
  cover_image_url: string | null;
  gradient: [string, string];
  host: { id: number; username: string; display_name: string; avatar_url: string | null };
  game_type: { id: number; slug: string } | null;
  pack: { id: number; slug: string } | null;
  created_at: string;
  updated_at: string;
}

/** A locally-picked file, shaped for a multipart FormData part (RN's fetch expects this exact
 * `{ uri, name, type }` object rather than a real File/Blob). */
export interface LocalImageFile {
  uri: string;
  name: string;
  type: string;
}

export interface CreatePartyPayload {
  title: string;
  description?: string | null;
  game_type_id?: number | null;
  pack_id?: number | null;
  mode: PartyMode;
  visibility: PartyVisibility;
  max_players?: number;
  starts_at?: string | null;
  save_as_draft?: boolean;
  location?: PartyLocation;
  tags?: string[];
  /** jpeg/png/webp, max 8MB. Sending this forces the request into multipart/form-data. */
  cover_image?: LocalImageFile | null;
}

export interface GameCard {
  id: number;
  kind: 'truth' | 'dare';
  text: string;
  position: number;
}

export interface GameTurn {
  id: number;
  position: number;
  user_id: number;
  card: GameCard;
  started_at: string;
  completed_at: string | null;
  expires_at: string;
  is_afk: boolean;
}

export interface GameRound {
  id: number;
  number: number;
  started_at: string;
  completed_at: string | null;
}

export interface GameSessionResource {
  id: number;
  party_id: number;
  status: 'running' | 'completed';
  rounds_count: number;
  current_round_number: number;
  started_at: string;
  ended_at: string | null;
  current_round: GameRound;
  current_turn: GameTurn;
}

export interface NotificationResource {
  id: number;
  title: string;
  body: string;
  type: string;
  metadata: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

export interface FriendResource {
  friendship_id: number;
  friend: { id: number; username: string; display_name: string; avatar_url: string | null };
  accepted_at: string;
}

export type FriendRequestStatus = 'pending' | 'accepted' | 'rejected';

export interface FriendRequestResource {
  id: number;
  status: FriendRequestStatus;
  sender: { id: number; username: string };
  receiver: { id: number; username: string };
  accepted_at: string | null;
  created_at: string;
}
