const BASE = "http://localhost:8080/api/v1";

export type BidStatus = "WINNER" | "REJECTED" | "ACTIVE" | "OUTBID" | "WITHDRAWN";

export type AuctionCategory =
  | "ELECTRONICS"
  | "VEHICLES"
  | "REAL_ESTATE"
  | "ART_AND_COLLECTIBLES"
  | "JEWELLERY_AND_WATCHES"
  | "FASHION_AND_ACCESSORIES"
  | "FURNITURE_AND_HOME"
  | "SPORTS_AND_OUTDOORS"
  | "BOOKS_AND_MEDIA"
  | "TOYS_AND_GAMES"
  | "INDUSTRIAL_AND_MACHINERY"
  | "ANTIQUES"
  | "OTHER";

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  const json = await res.json();
  if (!res.ok) {
    const msg = json?.messages?.[0]?.content;
    throw new Error(msg || `${res.status}`);
  }
  return json.data as T;
}

function qs(params: Record<string, string | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v != null) as [string, string][];
  const s = new URLSearchParams(entries).toString();
  return s ? `?${s}` : "";
}

export const api = {
  logout: () => req<boolean>("/auth/logout", { method: "POST" }),

  login: (body: { email?: string; phoneNumber?: string; password: string }) =>
    req<string>("/auth/login", { method: "POST", body: JSON.stringify(body) }),

  register: (body: {
    fullName: string;
    email?: string;
    phoneNumber?: string;
    password: string;
  }) =>
    req<string>("/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  createAuction: (body: {
    title: string;
    startTime: string;
    endTime: string;
    biddingItems: { title: string; description?: string; minimumPrice?: number }[];
    categories?: AuctionCategory[];
  }) =>
    req<string>("/auction", { method: "POST", body: JSON.stringify(body) }),

  searchAuctions: (params: {
    title?: string;
    status?: "OPEN" | "PAUSED" | "CLOSED";
    startAfter?: string;
    endBefore?: string;
  }) =>
    req<{
      id: string;
      title: string;
      status: string;
      categories?: AuctionCategory[];
      itemCount: number;
      startTime: string;
      endTime: string;
    }[]>(
      `/auction/search${qs(params)}`
    ),

  getAuction: (auctionId: string) =>
    req<{
      id: string;
      title: string;
      status: string;
      categories?: AuctionCategory[];
      itemCount: number;
      startTime: string;
      endTime: string;
    }>(`/auction/${auctionId}`),

  getAuctionItems: (auctionId: string) =>
    req<{
      id: string;
      auctionId: string;
      title: string;
      description?: string;
      minimumPrice?: number;
      sold: boolean;
      bidCount: number;
    }[]>(`/auction/${auctionId}/items`),

  getMyAuctions: () =>
    req<{
      id: string;
      title: string;
      status: string;
      categories?: AuctionCategory[];
      itemCount: number;
      startTime: string;
      endTime: string;
    }[]>("/auction/my-auctions"),

  updateAuction: (
    auctionId: string,
    body: {
      title: string;
      startTime: string;
      endTime: string;
      biddingItems: {
        id?: string;
        title: string;
        description?: string;
        minimumPrice?: number;
      }[];
      categories?: AuctionCategory[];
    }
  ) =>
    req<string>(`/auction/${auctionId}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  createBid: (body: {
    auctionId: string;
    itemId: string;
    amount: number;
    placedAt: string;
    expiresAt?: string;
  }) =>
    req<string>("/bid", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  getMyBids: () =>
    req<{
      id: string;
      itemId: string;
      itemName: string;
      amount: number;
      status: BidStatus | null;
      placedAt: string;
      expiresAt?: string;
    }[]>("/bid/my-bids"),

  acceptBid: (bidId: string) =>
    req<boolean>(`/bid/accept/${bidId}`, { method: "POST" }),

  rejectBid: (bidId: string, rejectReason?: string) =>
    req<boolean>(`/bid/reject/${bidId}`, {
      method: "POST",
      body: JSON.stringify({ rejectReason }),
    }),

  getBid: (bidId: string) =>
    req<{
      id: string;
      amount: number;
      status: BidStatus | null;
      placedAt: string;
      expiresAt?: string;
    }>(`/bid/${bidId}`),

  updateBid: (
    bidId: string,
    body: {
      auctionId: string;
      itemId: string;
      amount: number;
      placedAt: string;
      accepted?: boolean;
      rejected?: boolean;
      expiresAt?: string;
      rejectReason?: string;
    }
  ) =>
    req<string>(`/bid/${bidId}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  sendPasswordResetLink: (method: "EMAIL" | "MOBILE", contact: string) =>
    req<boolean>(`/auth/password/reset-by/${method}`, {
      method: "POST",
      body: JSON.stringify({
        email: method === "EMAIL" ? contact : undefined,
        phoneNumber: method === "MOBILE" ? contact : undefined,
        password: "",
      }),
    }),

  resetPassword: (
    hashCode: string,
    method: "EMAIL" | "MOBILE",
    contact: string,
    password: string
  ) =>
    req<boolean>(`/auth/password/reset/${hashCode}${qs({ resetMethod: method })}`, {
      method: "POST",
      body: JSON.stringify({
        email: method === "EMAIL" ? contact : undefined,
        phoneNumber: method === "MOBILE" ? contact : undefined,
        password,
      }),
    }),

  getItem: (itemId: string) =>
    req<{
      id: string;
      title: string;
      description?: string;
      minimumPrice?: number;
      highestBid: { id: string; amount: number; status: BidStatus | null; placedAt: string; expiresAt?: string } | null;
      bids: { id: string; amount: number; status: BidStatus | null; placedAt: string; expiresAt?: string }[];
      priceSoldAt?: number;
    }>(`/item/${itemId}`),
};
