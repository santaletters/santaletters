/**
 * Affiliate Tracking Utility
 * 
 * Implements LAST-CLICK attribution with 30-day cookie duration
 * 
 * How it works:
 * 1. When a user clicks an affiliate link (?ref=affiliateId), their info is stored
 * 2. The attribution lasts for 30 days
 * 3. If they click ANOTHER affiliate link within 30 days, it OVERRIDES (last-click wins)
 * 4. If they make a purchase within 30 days, the affiliate gets credit
 * 5. After 30 days, the attribution expires
 */

const STORAGE_KEY = 'affiliate_attribution';
const COOKIE_DURATION_DAYS = 30; // 30-day attribution window

export interface AffiliateAttribution {
  affiliateId: string;
  subIds: Record<string, string>;
  timestamp: number; // When the attribution was set
  expiresAt: number; // When it expires
  campaign?: string; // Optional campaign parameter
}

/**
 * Store or update affiliate attribution (LAST-CLICK)
 * This is called when a user lands on the site with ?ref= parameter
 */
export function setAffiliateAttribution(
  affiliateId: string, 
  subIds: Record<string, string> = {},
  campaign?: string
): void {
  try {
    const now = Date.now();
    const expiresAt = now + (COOKIE_DURATION_DAYS * 24 * 60 * 60 * 1000); // 30 days from now
    
    const attribution: AffiliateAttribution = {
      affiliateId,
      subIds,
      timestamp: now,
      expiresAt,
      campaign
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(attribution));
    
    console.log(`✅ Affiliate attribution set (LAST-CLICK): ${affiliateId}`, {
      campaign,
      subIds,
      expiresIn: `${COOKIE_DURATION_DAYS} days`,
      expiresAt: new Date(expiresAt).toISOString()
    });
  } catch (error) {
    console.error('Failed to set affiliate attribution:', error);
  }
}

/**
 * Get current affiliate attribution (if not expired)
 * This is called when a user makes a purchase to determine which affiliate gets credit
 */
export function getAffiliateAttribution(): AffiliateAttribution | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return null;
    }
    
    const attribution: AffiliateAttribution = JSON.parse(stored);
    const now = Date.now();
    
    // Check if attribution has expired
    if (now > attribution.expiresAt) {
      console.log('⏰ Affiliate attribution expired, clearing...');
      clearAffiliateAttribution();
      return null;
    }
    
    // Calculate days remaining
    const daysRemaining = Math.ceil((attribution.expiresAt - now) / (24 * 60 * 60 * 1000));
    
    console.log(`✅ Valid affiliate attribution found: ${attribution.affiliateId}`, {
      campaign: attribution.campaign,
      daysRemaining,
      setAt: new Date(attribution.timestamp).toISOString()
    });
    
    return attribution;
  } catch (error) {
    console.error('Failed to get affiliate attribution:', error);
    return null;
  }
}

/**
 * Clear affiliate attribution (e.g., after expiration or manual reset)
 */
export function clearAffiliateAttribution(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log('🧹 Affiliate attribution cleared');
  } catch (error) {
    console.error('Failed to clear affiliate attribution:', error);
  }
}

/**
 * Check if there's a valid affiliate attribution
 */
export function hasValidAttribution(): boolean {
  return getAffiliateAttribution() !== null;
}

/**
 * Get attribution info for display/debugging
 */
export function getAttributionInfo(): string | null {
  const attribution = getAffiliateAttribution();
  if (!attribution) {
    return null;
  }
  
  const daysRemaining = Math.ceil((attribution.expiresAt - Date.now()) / (24 * 60 * 60 * 1000));
  return `Affiliate: ${attribution.affiliateId} (${daysRemaining} days remaining)`;
}
