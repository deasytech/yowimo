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
  xp: number;
  last_seen_at: string;
  created_at: string;
  updated_at: string;
  wallet: WalletSnapshot;
}

/** GET /users/me/stats — lifetime totals for the Profile screen's stat tiles. Split off
 * GET /users/me (which is a plain auth-check hit constantly elsewhere) since these are
 * aggregate queries. No streak field yet — that needs a product decision first. */
export interface ProfileStatsResource {
  parties_count: number;
  mvp_count: number;
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
  /** Deck a party inherits when the host doesn't pick one (see the create-party deck picker). */
  default_pack_id: number | null;
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
  /** How many of this pack's cards are flagged is_preview — the subset a host who hasn't
   * purchased the pack can still play with, instead of the full cards_count. */
  preview_cards_count: number;
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
  | 'reward'
  | 'party_entry'
  | 'referral'
  | 'sponsor'
  | 'free_party_guest_cost';

export interface WalletTransactionResource {
  id: number;
  type: WalletTransactionType;
  amount: number;
  balance_after: number;
  description: string;
  created_at: string;
}

/** GET /ad-rewards/progress — how many rewarded ads the host has watched today, and whether
 * they still can. `daily_cap`/`tokens_per_ad` are backend config, not constants — never
 * hard-code either client-side, they can change without a release. `can_earn` is the
 * authoritative gate (`enabled && remaining > 0`, computed server-side) — check it before
 * minting a session rather than re-deriving it from the other fields, so a disabled/exhausted
 * state is caught before round-tripping through a 422/503. */
export interface AdRewardProgressResource {
  watched_today: number;
  daily_cap: number;
  tokens_per_ad: number;
  remaining: number;
  next_reset_at: string;
  enabled: boolean;
  can_earn: boolean;
  server_date: string;
}

/** POST /ad-rewards/sessions — a single-use token to attach as the rewarded ad's SSV customData.
 * 503s if the quest is currently disabled (see AdRewardProgressResource.enabled) — check
 * progress.can_earn before calling this rather than relying on the error. */
export interface AdRewardSessionResource {
  token: string;
  expires_at: string;
}

/** GET /referrals/summary. `reward_amount` is backend config, not a constant — never hard-code
 * it client-side (same reasoning as AdRewardProgressResource's tokens_per_ad/daily_cap), since
 * it can change without a release and both the Wallet banner and this screen need to reflect
 * whatever it currently is. */
export interface ReferralSummaryResource {
  referral_code: string;
  referred_count: number;
  tokens_earned: number;
  reward_amount: number;
}

export interface ClaimReferralCodePayload {
  code: string;
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

export type FriendshipStatus = 'self' | 'none' | 'friends' | 'request_sent' | 'request_received';

/** GET /users/{id} — another user's profile, as returned by PublicUserResource: a deliberately
 * small, public-safe subset of UserResource (never email, wallet, date of birth, etc.). */
export interface PublicUserResource {
  id: number;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  interests: string[];
  country_code: string | null;
  xp: number;
  badges: UserBadgeResource[];
  stats: {
    friends_count: number;
    parties_joined_count: number;
    parties_created_count: number;
  };
  friendship: { id: number | null; status: FriendshipStatus };
}

export type PartyMode = 'online' | 'hybrid' | 'in_person';
export type PartyVisibility = 'public' | 'private';
/** `pending_sponsorship`: created with a sponsor requested; hidden from Discover and not
 * joinable/startable until the sponsor pays, then it becomes scheduled or live on its own. */
export type PartyStatus =
  | 'draft'
  | 'pending_sponsorship'
  | 'scheduled'
  | 'live'
  | 'ended'
  | 'cancelled';
export type PartyMembershipStatus = 'active' | 'left' | 'removed';

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

/** A row from GET /users/me/parties/joined — the membership record, not a bare party. */
export interface PartyMembership {
  membership_status: PartyMembershipStatus;
  joined_at: string;
  left_at: string | null;
  party: PartyDetail;
}

/** What a sponsor covers: just the host's creation fee, or the creation fee plus every guest's
 * entry fee (max_players - 1 guests, since the host doesn't pay to join their own party). */
export type SponsorshipScope = 'creation_fee' | 'full_party';
export type SponsorshipStatus = 'pending' | 'paid' | 'cancelled' | 'expired';

export interface PartySponsorship {
  id: number;
  scope: SponsorshipScope;
  status: SponsorshipStatus;
  /** Tokens the sponsor pays (or has paid) — server-computed and authoritative. */
  amount: number;
  sponsor: { id: number; username: string; display_name: string; avatar_url: string | null } | null;
}

export interface PartyDetail extends Omit<PartySummary, 'host'> {
  description: string | null;
  is_sponsored: boolean;
  sponsor_name: string | null;
  /** Tokens a guest pays to join. Absent/0 means free. */
  entry_fee?: number;
  sponsorship?: PartySponsorship | null;
  tags: string[];
  starts_at: string | null;
  location: PartyLocation | null;
  cover_image_url: string | null;
  gradient: [string, string];
  host: { id: number; username: string; display_name: string; avatar_url: string | null };
  game_type: { id: number; slug: string } | null;
  /** The API sends the full pack resource; these are the fields the lobby/deck UI reads. */
  pack: { id: number; slug: string; name: string; emoji: string; cards_count: number } | null;
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
  /** Tokens each guest pays to join; omit or 0 for a free party. */
  entry_fee?: number;
  /** The host is asking a friend to sponsor — the host isn't charged the creation fee at
   * create time when this covers it. The invite itself is minted afterwards. */
  sponsorship_scope?: SponsorshipScope;
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
  is_skipped: boolean;
}

export interface GameRound {
  id: number;
  number: number;
  started_at: string;
  completed_at: string | null;
}

export type GameSessionStatus = 'running' | 'paused' | 'voting' | 'completed' | 'ended';

export interface GameSessionResource {
  id: number;
  party_id: number;
  status: GameSessionStatus;
  rounds_count: number;
  current_round_number: number;
  started_at: string;
  ended_at: string | null;
  current_round: GameRound;
  current_turn: GameTurn;
  // Only present on GET /game/{id} and GET /parties/{party}/game — the start/next-turn/
  // complete/skip/pause/resume responses omit these.
  host_id?: number;
  pack_id?: number;
  /** Every player in play order, including anyone who has left (positions never shift). */
  turn_order?: number[];
  /** turn_order without players who left — render this for "who's still playing." */
  active_player_ids?: number[];
  current_turn_index?: number;
  turn_seconds?: number;
  paused_at?: string | null;
  paused_turn_remaining_seconds?: number | null;
  voting_ends_at?: string | null;
}

export interface CreateGameSessionPayload {
  /** One of 5, 10, 15, 20. Omit to default to 10. */
  rounds?: 5 | 10 | 15 | 20;
  /** One of 15, 30, 45, 60, 90 seconds per turn. Omit to default to 30. */
  turn_seconds?: 15 | 30 | 45 | 60 | 90;
}

export type PartyPlayerStatus = 'active' | 'left';

/** Pass-and-play, no account of their own — added by the host via POST /parties/{party}/players.
 * `user_id`/`user` are always null for these; `guest_name`/`guest_emoji`/`join_mode` are always
 * null for a real account. Guests aren't dealt a turn in the game engine yet. */
export type PlayerJoinMode = 'local' | 'remote';

export interface PartyPlayerResource {
  user_id: number | null;
  user: { id: number; username: string; display_name: string; avatar_url: string | null } | null;
  guest_name: string | null;
  guest_emoji: string | null;
  join_mode: PlayerJoinMode | null;
  is_host: boolean;
  status: PartyPlayerStatus;
  is_ready: boolean;
  joined_at: string;
  left_at: string | null;
}

export interface AddGuestPlayerPayload {
  guest_name: string;
  guest_emoji?: string;
  join_mode: PlayerJoinMode;
}

export interface GameStanding {
  user: { id: number; username: string; display_name: string; avatar_url: string | null };
  xp: number;
  votes: { winner: number; funny: number; creativity: number };
  turns: { completed: number; skipped: number; afk: number };
  is_mvp: boolean;
}

export interface GameResultsResource {
  game_session_id: number;
  status: GameSessionStatus;
  standings: GameStanding[];
}

export type ReactionEmoji = '🔥' | '😂' | '❤️' | '😱' | '👏' | '💀' | '🤯' | '👀' | '✨';

export type VoteCategory = 'winner' | 'funny' | 'creativity';

export interface VoteResource {
  id: number;
  turn_id: number;
  voter_id: number;
  category: VoteCategory;
  created_at: string;
}

export type PushTokenPlatform = 'ios' | 'android';

export interface PushTokenResource {
  id: number;
  platform: PushTokenPlatform;
  created_at: string;
  updated_at: string;
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

/** POST /parties/{party}/video-token — a short-lived LiveKit access token. v0 scope: one room
 * per party (`party-{id}`), everyone can publish/subscribe audio+video, no host controls. */
export interface VideoTokenResource {
  token: string;
  url: string;
  room: string;
}

export interface FriendResource {
  friendship_id: number;
  // `username` is nullable in the DB and never backfilled for an account provisioned without
  // one (e.g. onboarding doesn't collect it) — genuinely null at runtime, not just defensive
  // typing.
  friend: { id: number; username: string | null; display_name: string; avatar_url: string | null; xp: number };
  accepted_at: string;
}

export type FriendRequestStatus = 'pending' | 'accepted' | 'rejected';

export interface FriendRequestResource {
  id: number;
  status: FriendRequestStatus;
  sender: { id: number; username: string | null; display_name: string | null; avatar_url: string | null };
  receiver: { id: number; username: string | null; display_name: string | null; avatar_url: string | null };
  accepted_at: string | null;
  created_at: string;
}


/** POST /parties/{party}/sponsorship-invites — a shareable link a sponsor opens to pay. */
export interface SponsorshipInviteResource {
  token: string;
  url: string;
  scope: SponsorshipScope;
  amount: number;
  status: SponsorshipStatus;
  expires_at: string | null;
  party: {
    id: number;
    title: string;
    max_players: number;
    entry_fee: number;
    cover_image_url: string | null;
    gradient: [string, string];
    host: { id: number; username: string; display_name: string; avatar_url: string | null };
  };
}

/** GET /sponsors/me — lifetime totals for the Sponsor Center header. */
export interface SponsorSummaryResource {
  players_covered: number;
  parties_count: number;
  tokens_spent: number;
}

/** A row from GET /sponsors/me/sponsorships. `tokens_spent` is net of any end-of-party refund
 * for guest slots that never filled. */
export interface SponsorshipListItem {
  id: number;
  status: SponsorshipStatus;
  covered_guest_count: number;
  tokens_spent: number;
  paid_at: string | null;
  party: { id: number; title: string; status?: PartyStatus; cover_image_url?: string | null };
}
