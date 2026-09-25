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
};

export type AuctionSummaryResponse = {
  id: string;
  title: string;
  status: AuctionStatus;
  categories: AuctionCategory[];
  itemCount: number;
  startTime: string;
  endTime: string;
};

export type AuctionRequest = {
  title: string;
  startTime: string;
  endTime: string;
  biddingItems: ItemRequest[];
  categories: AuctionCategory[];
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
