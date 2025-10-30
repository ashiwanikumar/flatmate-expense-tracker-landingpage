/**
 * IPv4 Detection Utility
 * Detects client's IPv4 address even on IPv6-only networks
 * Uses ipify API which specifically returns IPv4
 */

let cachedIPv4: string | null = null;
let ipv4DetectionPromise: Promise<string | null> | null = null;

/**
 * Detect client's IPv4 address using ipify API
 * Results are cached for 1 hour to avoid excessive API calls
 */
export async function detectIPv4(): Promise<string | null> {
  // Return cached IPv4 if available and not expired
  if (cachedIPv4) {
    return cachedIPv4;
  }

  // Return existing promise if detection is already in progress
  if (ipv4DetectionPromise) {
    return ipv4DetectionPromise;
  }

  // Start new detection
  ipv4DetectionPromise = (async () => {
    try {
      // Use ipv4.icanhazip.com which is IPv4-only
      // This forces the browser to use IPv4 connection even on IPv6 networks
      const response = await fetch('https://ipv4.icanhazip.com', {
        method: 'GET',
        cache: 'no-cache',
      });

      if (!response.ok) {
        console.warn('IPv4 detection failed:', response.statusText);
        return null;
      }

      const ipv4 = (await response.text()).trim();

      // Validate IPv4 format
      if (ipv4 && /^(\d{1,3}\.){3}\d{1,3}$/.test(ipv4)) {
        cachedIPv4 = ipv4;

        // Cache for 1 hour
        setTimeout(() => {
          cachedIPv4 = null;
        }, 60 * 60 * 1000);

        return ipv4;
      }

      return null;
    } catch (error) {
      console.warn('IPv4 detection error:', error);
      return null;
    } finally {
      // Clear promise after 5 seconds to allow retry if failed
      setTimeout(() => {
        ipv4DetectionPromise = null;
      }, 5000);
    }
  })();

  return ipv4DetectionPromise;
}

/**
 * Get cached IPv4 address (non-blocking)
 */
export function getCachedIPv4(): string | null {
  return cachedIPv4;
}

/**
 * Clear cached IPv4 address
 */
export function clearIPv4Cache(): void {
  cachedIPv4 = null;
  ipv4DetectionPromise = null;
}
