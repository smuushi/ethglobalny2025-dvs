import { GameNFT } from "../schemas/nft";

/**
 * Security utilities for protected game downloads
 */

/**
 * Generate a secure download URL for a game
 * This creates a backdoor URL that requires wallet authentication and NFT ownership verification
 */
export function generateSecureDownloadUrl(game: GameNFT): string {
  // Use the underlying game ID as the secure identifier
  // This allows all owners of the same game to use the same download URL
  // while still requiring NFT ownership verification for access
  const secureId = game.gameId || game.id; // Primary identifier (Game ID, fallback to NFT ID)

  return `/download/${secureId}`;
}

/**
 * Alternative secure download URL using game ID
 * Useful when you want to reference by game ID instead of NFT ID
 */
export function generateSecureDownloadUrlByGameId(game: GameNFT): string {
  return `/download/${game.gameId}`;
}

/**
 * Alternative secure download URL using Walrus blob ID
 * Useful for shared game files across multiple NFTs
 */
export function generateSecureDownloadUrlByBlobId(game: GameNFT): string {
  return `/download/${game.walrusBlobId}`;
}

/**
 * Validate if a given URL is a secure download URL
 */
export function isSecureDownloadUrl(url: string): boolean {
  return url.startsWith("/download/") && url.length > 10;
}

/**
 * Extract game identifier from secure download URL
 */
export function extractGameIdFromSecureUrl(url: string): string | null {
  const match = url.match(/\/download\/(.+)$/);
  return match ? match[1] : null;
}

/**
 * Create shareable secure download link with domain
 * This can be shared externally but still requires wallet auth
 */
export function createShareableSecureLink(
  game: GameNFT,
  domain: string = window.location.origin,
): string {
  const secureUrl = generateSecureDownloadUrl(game);
  return `${domain}${secureUrl}`;
}

/**
 * Security headers for download protection
 * These can be used to prevent direct CDN access
 */
export const SECURE_DOWNLOAD_HEADERS = {
  "X-Requested-With": "ColdCache-Secure",
  "X-Download-Source": "Protected-NFT-Gate",
  "Cache-Control": "no-cache, no-store, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
} as const;

/**
 * Generate a temporary access token for additional security
 * This could be used with a backend service for extra protection
 */
export function generateTemporaryAccessToken(
  gameId: string,
  userAddress: string,
): string {
  const timestamp = Date.now();
  const payload = `${gameId}:${userAddress}:${timestamp}`;

  // Simple base64 encoding for demo purposes
  // In production, use proper JWT or similar with server-side validation
  return btoa(payload);
}

/**
 * Validate temporary access token
 */
export function validateTemporaryAccessToken(
  token: string,
  gameId: string,
  userAddress: string,
  maxAgeMs: number = 300000, // 5 minutes
): boolean {
  try {
    const decoded = atob(token);
    const [tokenGameId, tokenAddress, tokenTimestamp] = decoded.split(":");

    const timestamp = parseInt(tokenTimestamp);
    const now = Date.now();

    return (
      tokenGameId === gameId &&
      tokenAddress === userAddress &&
      now - timestamp < maxAgeMs
    );
  } catch {
    return false;
  }
}

/**
 * Security logging for download attempts
 */
export function logSecureDownloadAttempt(
  gameId: string,
  userAddress: string | null,
  success: boolean,
  reason?: string,
): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    gameId: gameId.substring(0, 12) + "...",
    userAddress: userAddress
      ? userAddress.substring(0, 12) + "..."
      : "Not connected",
    success,
    reason,
    userAgent: navigator.userAgent.substring(0, 50),
  };

  console.log("🔐 Secure Download Attempt:", logEntry);

  // In production, send to analytics/monitoring service
  // analytics.track('secure_download_attempt', logEntry);
}
