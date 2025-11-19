/**
 * Domain Helper Utility
 * Replaces Figma preview URLs with custom domain
 */

// Your custom domain
export const CUSTOM_DOMAIN = "https://santascertifiedletter.com";

/**
 * Get the current URL but with custom domain instead of Figma preview
 * Preserves all query parameters and paths
 */
export function getCustomDomainUrl(url?: string): string {
  const currentUrl = url || window.location.href;
  
  try {
    const urlObj = new URL(currentUrl);
    
    // If it's a Figma preview URL, replace with custom domain
    if (urlObj.hostname.includes('figma')) {
      // Build new URL with custom domain but same path and params
      return `${CUSTOM_DOMAIN}${urlObj.pathname}${urlObj.search}${urlObj.hash}`;
    }
    
    // Already using custom domain or localhost, return as is
    return currentUrl;
  } catch (e) {
    // If URL parsing fails, return original
    console.error('Error parsing URL:', e);
    return currentUrl;
  }
}

/**
 * Get order link with custom domain
 */
export function getOrderLink(token: string): string {
  return `${CUSTOM_DOMAIN}/?token=${token}`;
}

/**
 * Get shareable URL with custom domain
 */
export function getShareableUrl(path: string = '', params: Record<string, string> = {}): string {
  const searchParams = new URLSearchParams(params);
  const queryString = searchParams.toString();
  
  return `${CUSTOM_DOMAIN}${path}${queryString ? '?' + queryString : ''}`;
}

/**
 * Copy custom domain URL to clipboard
 */
export async function copyCustomUrlToClipboard(url?: string): Promise<boolean> {
  const customUrl = getCustomDomainUrl(url);
  
  try {
    await navigator.clipboard.writeText(customUrl);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    // Fallback method
    try {
      const textArea = document.createElement('textarea');
      textArea.value = customUrl;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch (fallbackError) {
      console.error('Fallback copy also failed:', fallbackError);
      return false;
    }
  }
}
