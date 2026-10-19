export interface ApiMessage {
  type: "WARNING" | "INFO" | "ERROR";
  content: string | null;
}

export interface ApiResponse<T> {
  data: T | null;
  completedAt: string;
  requestId: string;
  messages: ApiMessage[];
}

export type ContactType = "EMAIL" | "PHONE" | "APP";

export type PreferredContactMethod = {
  type: ContactType | null;
  value: string | null;
  appUserId: string;
};

export type AppUser = {
  id: string;
  fullName: string;
  contact: PreferredContactMethod;
};

export type AuctionStatus = "UPCOMING" | "LIVE" | "PAUSED" | "CLOSED";

export const AUCTION_CATEGORIES = [
  "ELECTRONICS",
  "VEHICLES",
  "REAL_ESTATE",
  "ART_AND_COLLECTIBLES",
  "JEWELLERY_AND_WATCHES",
  "FASHION_AND_ACCESSORIES",
  "FURNITURE_AND_HOME",
  "SPORTS_AND_OUTDOORS",
  "BOOKS_AND_MEDIA",
  "TOYS_AND_GAMES",
  "INDUSTRIAL_AND_MACHINERY",
  "ANTIQUES",
  "OTHER",
] as const;

export type AuctionCategory = (typeof AUCTION_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<AuctionCategory, string> = {
  ELECTRONICS: "Electronics",
  VEHICLES: "Vehicles",
  REAL_ESTATE: "Real Estate",
  ART_AND_COLLECTIBLES: "Art & Collectibles",
  JEWELLERY_AND_WATCHES: "Jewellery & Watches",
  FASHION_AND_ACCESSORIES: "Fashion & Accessories",
  FURNITURE_AND_HOME: "Furniture & Home",
  SPORTS_AND_OUTDOORS: "Sports & Outdoors",
  BOOKS_AND_MEDIA: "Books & Media",
  TOYS_AND_GAMES: "Toys & Games",
  INDUSTRIAL_AND_MACHINERY: "Industrial & Machinery",
  ANTIQUES: "Antiques",
  OTHER: "Other",
};

/** Where the winner collects the goods. Stored on the auction as JSON; every field but `instructions` is required. */
export type PickupLocation = {
  unit: number;
  street: string;
  city: string;
  postalCode: string;
  state: string;
  country: string;
  /** Free-text pickup instructions (e.g. "buzz #4, use the loading dock"). Optional, max 512 chars. */
  instructions: string | null;
};

export type ItemRequest = {
  id?: string | null;
  title: string;
  description: string;
  minimumPrice: number | null;
};

export type ItemResponse = {
  id: string;
  title: string;
  description: string;
  minimumPrice: number | null;
  priceSoldAt: number | null;
  highestBidId: string | null;
  highestBidAmount: number | null;
  acceptingBids: boolean;
  /** Incremented by `itemApi.view` (not `getById`), except when the auction owner views it. */
  viewCount: number;
};

export type ItemSummaryResponse = {
  id: string;
  auctionId: string;
  title: string;
  description: string;
  minimumPrice: number | null;
  sold: boolean;
};

export type AuctionResponse = {
  id: string;
  ownerId: string;
  title: string;
  auctionStatus: AuctionStatus;
  categories: AuctionCategory[];
  items: ItemResponse[];
  startTime: string;
  endTime: string;
  /** Null for auctions created before pickup locations existed. */
  pickupLocation: PickupLocation | null;
};

export type AuctionSummaryResponse = {
  id: string;
  title: string;
  status: AuctionStatus;
  categories: AuctionCategory[];
  itemCount: number;
  startTime: string;
  endTime: string;
  pickupLocation: PickupLocation | null;
};

export type AuctionRequest = {
  title: string;
  startTime: string;
  endTime: string;
  biddingItems: ItemRequest[];
  categories: AuctionCategory[];
  /** Required on both create and update — catalog-service rejects the request without it. */
  pickupLocation: PickupLocation;
};

export type BidStatus =
  | "PENDING_VALIDATION"
  | "ACTIVE"
  | "OUTBID"
  | "WINNER"
  | "REJECTED"
  | "WITHDRAWN";

export type BidSummaryResponse = {
  id: string;
  itemId: string;
  bidderId: string;
  amount: number;
  status: BidStatus;
  statusDescription: string | null;
  placedAt: string;
  expiresAt: string | null;
};

export type NotificationStatus = "SENT" | "OPENED" | "FAILED_TO_SEND";
export type NotificationType =
  | "ACTION_REQUIRED"
  | "SUCCESS"
  | "INFO"
  | "WARNING"
  | "ERROR";

export type NotificationResponse = {
  type: NotificationType;
  status: NotificationStatus;
  subject: string;
};

export type PageResponse<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
};
