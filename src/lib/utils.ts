/**
 * Parse PostgreSQL array string into JavaScript array
 * Handles arrays like: {item1,item2,item3} or {"item 1","item 2","item 3"}
 */
export function parsePostgreSQLArray(pgArray: string | string[] | null): string[] {
  // If it's already an array, return it
  if (Array.isArray(pgArray)) {
    return pgArray;
  }
  
  // If null or undefined, return empty array
  if (!pgArray) {
    return [];
  }
  
  // If it's not a string, convert to string
  const arrayString = String(pgArray);
  
  // Remove outer braces and split by comma
  const cleaned = arrayString.replace(/^\{|\}$/g, '');
  
  // If empty string after cleaning, return empty array
  if (!cleaned.trim()) {
    return [];
  }
  
  // Split by comma and clean each item
  return cleaned
    .split(',')
    .map(item => {
      // Remove quotes and trim whitespace
      return item.replace(/^"(.*)"$/, '$1').trim();
    })
    .filter(item => item.length > 0); // Remove empty items
}

/**
 * Format date string to readable format
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Format time string to readable format
 */
export function formatTime(timeString: string): string {
  if (!timeString) return '';
  return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}
