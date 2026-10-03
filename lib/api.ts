import type {
  ApiResponse,
  AppUser,
  AuctionRequest,
  AuctionResponse,
  AuctionStatus,
  AuctionSummaryResponse,
  BidSummaryResponse,
  ContactType,
  ItemResponse,
  ItemSummaryResponse,
  NotificationResponse,
  NotificationStatus,
  PageResponse,
  PreferredContactMethod,
} from "./types";

const GATEWAY_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export class ApiError extends Error {
  status: number;
  messages: string[];

  constructor(status: number, messages: string[]) {
    super(messages[0] ?? `Request failed with status ${status}`);
    this.status = status;
    this.messages = messages;
  }
}

async function request<T>(
  path: string,
  init?: RequestInit,
): Promise<ApiResponse<T>> {
  const res = await fetch(`${GATEWAY_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (res.status === 401 || res.status === 403) {
    let messages: string[] = [];
    try {
      const body = (await res.json()) as ApiResponse<T>;
      messages = (body.messages ?? [])
        .map((m) => m.content)
        .filter((c): c is string => !!c);
    } catch {
      // gateway-level 401s return an empty body
    }
    throw new ApiError(res.status, messages.length ? messages : ["Please sign in to continue."]);
  }

  let body: ApiResponse<T>;
  try {
    body = (await res.json()) as ApiResponse<T>;
  } catch {
    throw new ApiError(res.status, ["Something went wrong. Please try again."]);
  }

  if (!res.ok) {
    const messages = (body.messages ?? [])
      .map((m) => m.content)
      .filter((c): c is string => !!c);
    throw new ApiError(res.status, messages.length ? messages : ["Something went wrong. Please try again."]);
  }

  return body;
}

function get<T>(path: string) {
  return request<T>(path, { method: "GET" }).then((r) => r.data as T);
}
function post<T>(path: string, body?: unknown) {
  return request<T>(path, {
    method: "POST",
    body: body === undefined ? undefined : JSON.stringify(body),
  }).then((r) => r.data as T);
}
function put<T>(path: string, body?: unknown) {
  return request<T>(path, {
    method: "PUT",
    body: body === undefined ? undefined : JSON.stringify(body),
  }).then((r) => r.data as T);
}

// -- identity-and-auth --------------------------------------------------

export const authApi = {
  register: (input: {
    fullName: string;
    email?: string;
    phoneNumber?: string;
    password: string;
  }) => post<string>("/identity-and-auth/api/v1/auth/register", input),

  login: (input: { email?: string; phoneNumber?: string; password: string }) =>
    post<string>("/identity-and-auth/api/v1/auth/login", input),

  logout: () => post<boolean>("/identity-and-auth/api/v1/auth/logout"),

  sendPasswordResetLink: (contact: string) =>
    post<boolean>("/identity-and-auth/api/v1/auth/password/reset/send-link", {
      contact,
    }),

  setNewPassword: (token: string, password: string) =>
    put<boolean>(
      `/identity-and-auth/api/v1/auth/password/reset/set-password/${token}`,
      { password },
    ),

  sendVerificationLink: (contactType: ContactType) =>
    post<boolean>(
      "/identity-and-auth/api/v1/auth/account-verification/send-link",
      { contactType },
    ),

  verifyAccount: (token: string) =>
    put<boolean>("/identity-and-auth/api/v1/auth/account-verification/verify", {
      token,
    }),

  isVerified: () =>
    get<boolean>("/identity-and-auth/api/v1/auth/account-verification/is-verified"),
};

export const appUserApi = {
  getById: (appUserId: string) =>
    get<AppUser>(`/identity-and-auth/api/v1/app-user/${appUserId}`),

  getContacts: () =>
    get<Record<ContactType, string>>(
      "/identity-and-auth/api/v1/app-user/contacts",
    ),

  getPreferredContactMethod: () =>
    get<PreferredContactMethod>(
      "/identity-and-auth/api/v1/app-user/contacts/preferred-contact-method",
    ),

  setPreferredContactMethod: (contactType: ContactType, contact?: string) =>
    put<boolean>(
      "/identity-and-auth/api/v1/app-user/contacts/preferred-contact-method",
      { contactType, contact },
    ),
};

// -- catalog --------------------------------------------------------------

export const auctionApi = {
  create: (input: AuctionRequest) =>
    post<string>("/catalog/api/v1/auction", input),

  update: (auctionId: string, input: AuctionRequest) =>
    put<string>(`/catalog/api/v1/auction/${auctionId}`, input),

  updateStatus: (auctionId: string, status: AuctionStatus) =>
    put<string>(`/catalog/api/v1/auction/${auctionId}/status/${status}`),

  getById: (auctionId: string) =>
    get<AuctionResponse>(`/catalog/api/v1/auction/${auctionId}`),

  getItems: (auctionId: string) =>
    get<ItemSummaryResponse[]>(`/catalog/api/v1/auction/${auctionId}/items`),

  getMyAuctions: (params: { page: number; size: number }) => {
    const qs = new URLSearchParams({
      page: String(params.page),
      size: String(params.size),
    });
    return get<PageResponse<AuctionSummaryResponse>>(
      `/catalog/api/v1/auction/my-auctions?${qs.toString()}`,
    );
  },

  search: (params: {
    title?: string;
    status?: AuctionStatus;
    startAfter?: string;
    endBefore?: string;
    page: number;
    size: number;
  }) => {
    const qs = new URLSearchParams({
      page: String(params.page),
      size: String(params.size),
    });
    if (params.title) qs.set("title", params.title);
    if (params.status) qs.set("status", params.status);
    if (params.startAfter) qs.set("startAfter", params.startAfter);
    if (params.endBefore) qs.set("endBefore", params.endBefore);
    return get<PageResponse<AuctionSummaryResponse>>(
      `/catalog/api/v1/auction/search?${qs.toString()}`,
    );
  },
};

export const itemApi = {
  getById: (itemId: string) =>
    get<ItemResponse>(`/catalog/api/v1/item/${itemId}`),
};

// -- bidding ----------------------------------------------------------------

export const bidApi = {
  create: (input: {
    auctionId: string;
    itemId: string;
    amount: number;
    expiresAt?: string;
  }) => post<string>("/bidding/api/v1/bid", input),

  update: (
    bidId: string,
    input: {
      auctionId: string;
      itemId: string;
      amount: number;
      expiresAt?: string;
    },
  ) => put<string>(`/bidding/api/v1/bid/${bidId}`, input),

  accept: (bidId: string) =>
    post<boolean>(`/bidding/api/v1/bid/accept/${bidId}`),

  reject: (bidId: string, rejectReason: string) =>
    post<boolean>(`/bidding/api/v1/bid/reject/${bidId}`, { rejectReason }),

  searchByIds: (bidIds: string[]) => {
    const qs = bidIds.map((id) => `bidIds=${encodeURIComponent(id)}`).join("&");
    return request<BidSummaryResponse[]>(
      `/bidding/api/v1/bid/search?${qs}`,
      { method: "GET" },
    );
  },

  getMyBids: () =>
    get<BidSummaryResponse[]>("/bidding/api/v1/bid/search/my-bids"),

  /** Top 10 bids for the item, ranked by amount (descending) — not the full history. */
  getTopTenForItem: (itemId: string) =>
    get<BidSummaryResponse[]>(`/bidding/api/v1/bid/item/${itemId}/top-ten-bids`),
};

// -- notification -----------------------------------------------------------

export const notificationApi = {
  getHistory: (params: { contactType?: ContactType; page: number; size: number }) => {
    const qs = new URLSearchParams({
      page: String(params.page),
      size: String(params.size),
    });
    if (params.contactType) qs.set("contactType", params.contactType);
    return get<PageResponse<NotificationResponse>>(
      `/notification/api/v1/notification/inbox?${qs.toString()}`,
    );
  },

  updateStatus: (notificationId: string, status: NotificationStatus) =>
    put<string>(
      `/notification/api/v1/notification/${notificationId}?status=${status}`,
    ),
};
