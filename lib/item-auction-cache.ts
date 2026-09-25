/**
 * The bidding-service bid DTOs don't include auctionId, and item detail
 * doesn't return it either, so there's no API call that maps an itemId back
 * to its parent auction. Every bid in this app is placed from an item page
 * reached through its auction, though, so we cache that mapping locally the
 * moment we see it and reuse it anywhere we only have an itemId (e.g. My Bids).
 */
const STORAGE_KEY = "bidder.itemAuctionMap";

function readMap(): Record<string, string> {
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function rememberItemAuction(itemId: string, auctionId: string) {
  const map = readMap();
  if (map[itemId] === auctionId) return;
  map[itemId] = auctionId;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function getAuctionForItem(itemId: string): string | undefined {
  return readMap()[itemId];
}
