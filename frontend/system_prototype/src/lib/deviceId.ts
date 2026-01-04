// Device ID Management for Session Isolation
// Generates a unique ID per browser/device to isolate chat sessions

const DEVICE_ID_KEY = "campusflow_device_id";

/**
 * Get or generate a unique device identifier
 * This persists across page refreshes but is unique per browser
 */
export function getDeviceId(): string {
  // Check if we're in a browser environment
  if (typeof window === "undefined" || typeof localStorage === "undefined") {
    return "unknown";
  }

  // Try to get existing device ID
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);

  // Generate new one if it doesn't exist
  if (!deviceId) {
    deviceId = generateDeviceId();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
    console.log("[DeviceID] Generated new device ID:", deviceId);
  }

  return deviceId;
}

/**
 * Generate a unique device identifier
 */
function generateDeviceId(): string {
  // Use crypto.randomUUID if available (modern browsers)
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `device_${crypto.randomUUID()}`;
  }

  // Fallback: generate random string
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 15);
  return `device_${timestamp}_${random}`;
}

/**
 * Clear device ID (for testing or logout)
 */
export function clearDeviceId(): void {
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(DEVICE_ID_KEY);
  }
}

/**
 * Create fetch options with device ID header
 */
export function getFetchOptions(options: RequestInit = {}): RequestInit {
  const deviceId = getDeviceId();
  
  return {
    ...options,
    headers: {
      ...options.headers,
      "x-device-id": deviceId,
    },
  };
}
