export function getCurrentPersianDate(): string {
  const now = new Date();
  
  // Simple Persian date conversion (approximation)
  // In production, you'd use a proper library like moment-jalaali
  const year = now.getFullYear() - 621;
  const month = now.getMonth() + 1;
  const day = now.getDate();
  
  return `${year}/${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}`;
}

export function getCurrentPersianDateTime(): string {
  const now = new Date();
  const date = getCurrentPersianDate();
  const time = now.toLocaleTimeString('fa-IR', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
  
  return `${date} - ${time}`;
}

export function formatPersianDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  // Simple Persian date conversion (approximation)
  const year = d.getFullYear() - 621;
  const month = d.getMonth() + 1;
  const day = d.getDate();
  
  return `${year}/${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}`;
}
