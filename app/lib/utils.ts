 /** 
  * Formats a file size in bytes to a human-readable string (KB, MB, GB).
  * @param bytes - The file size in bytes,
  * @returns A formatted string representing the file size.
  */
 export function formatSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  // Deetermine the appropriate size unit by calculating the log
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  // Format to 2 dcimal places and round
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
 }

 export const generateUUID = () => crypto.randomUUID();