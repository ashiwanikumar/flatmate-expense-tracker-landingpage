/**
 * Utility functions for handling PDF downloads
 */

/**
 * Download a PDF blob as a file
 * @param blob - PDF blob data
 * @param filename - Name of the file to download
 */
export const downloadPdfBlob = (blob: Blob, filename: string) => {
  // Create a blob URL
  const url = window.URL.createObjectURL(blob);

  // Create a temporary anchor element to trigger download
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;

  // Append to body, click, and remove
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up the blob URL
  window.URL.revokeObjectURL(url);
};

/**
 * Get month name from month number
 * @param month - Month number (1-12)
 * @returns Month name
 */
export const getMonthName = (month: number): string => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month - 1] || 'Unknown';
};

/**
 * Generate filename for user receipt
 * @param userName - User name
 * @param month - Month number
 * @param year - Year
 * @returns Formatted filename
 */
export const generateUserReceiptFilename = (
  userName: string,
  month: number,
  year: number
): string => {
  const sanitizedName = userName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
  const monthName = getMonthName(month);
  return `Receipt_${sanitizedName}_${monthName}_${year}.pdf`;
};

/**
 * Generate filename for all members receipt
 * @param month - Month number
 * @param year - Year
 * @returns Formatted filename
 */
export const generateAllMembersReceiptFilename = (
  month: number,
  year: number
): string => {
  const monthName = getMonthName(month);
  return `All_Members_Receipt_${monthName}_${year}.pdf`;
};
