/**
 * Utility functions for phone number handling
 */

/**
 * Format phone number for WhatsApp API
 * Removes spaces, dashes, parentheses and ensures it's in international format
 */
export function formatPhoneForWhatsApp(phoneNumber: string): string {
  // Remove common formatting characters
  let cleaned = phoneNumber.replace(/[\s\-()]/g, '');
  
  // If it doesn't start with +, assume it's a local number and add country code
  // For Algeria: +213
  if (!cleaned.startsWith('+')) {
    // Remove leading 0 if present (common in local numbers)
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    cleaned = '+213' + cleaned;
  }
  
  return cleaned;
}

/**
 * Generate WhatsApp link for desktop app
 * Uses whatsapp:// protocol to open WhatsApp Desktop application
 */
export function getWhatsAppLink(phoneNumber: string): string {
  const formatted = formatPhoneForWhatsApp(phoneNumber);
  const link = `whatsapp://send?phone=${formatted}`;
  console.log("DEBUG: WhatsApp Link:", link);
  return link;
}

/**
 * Handle WhatsApp click event with fallback for custom protocol handling
 * Use this in onClick handlers to ensure the WhatsApp Desktop app opens
 */
export function handleWhatsAppClick(e: React.MouseEvent<HTMLAnchorElement>, phoneNumber: string): void {
  e.preventDefault();
  e.stopPropagation();
  
  const link = getWhatsAppLink(phoneNumber);
  console.log("DEBUG: Opening WhatsApp with:", link);
  
  // Try opening with window.open first (for better protocol handling)
  try {
    window.open(link, '_blank');
  } catch (error) {
    console.error("DEBUG: Error opening WhatsApp:", error);
    // Fallback: try regular href navigation
    window.location.href = link;
  }
}

/**
 * Generate tel: link for direct calling
 */
export function getTelLink(phoneNumber: string): string {
  return `tel:${phoneNumber}`;
}
