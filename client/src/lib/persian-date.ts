import moment from "moment";
import "moment/locale/fa";

// تنظیم moment برای استفاده از تاریخ فارسی
moment.locale('fa');

// Set default timezone to Tehran
const tehranNow = () => {
  return moment().utcOffset('+03:30'); // Tehran UTC+3:30
};

// تابع تبدیل تاریخ میلادی به شمسی (تقریبی)
const convertToJalali = (date: Date) => {
  const jYear = date.getFullYear() - 621;
  const jMonth = date.getMonth() + 1;
  const jDay = date.getDate();
  return { jYear, jMonth, jDay };
};

export const formatPersianDate = (date?: Date | string) => {
  if (!date) {
    const now = tehranNow().toDate();
    const { jYear, jMonth, jDay } = convertToJalali(now);
    return `${jYear}/${jMonth.toString().padStart(2, '0')}/${jDay.toString().padStart(2, '0')}`;
  }
  
  const d = typeof date === 'string' ? new Date(date) : date;
  const { jYear, jMonth, jDay } = convertToJalali(d);
  return `${jYear}/${jMonth.toString().padStart(2, '0')}/${jDay.toString().padStart(2, '0')}`;
};

export const formatPersianDateTime = (date?: Date | string) => {
  if (!date) {
    const now = tehranNow();
    const persianDate = formatPersianDate(now.toDate());
    const time = now.format('HH:mm');
    return `${persianDate} ${time}`;
  }
  
  const momentDate = moment(date).utcOffset('+03:30');
  const persianDate = formatPersianDate(momentDate.toDate());
  const time = momentDate.format('HH:mm');
  return `${persianDate} ${time}`;
};

export const formatPersianTime = (date?: Date | string) => {
  if (!date) return tehranNow().format('HH:mm:ss');
  const momentDate = moment(date).utcOffset('+03:30');
  return momentDate.format('HH:mm:ss');
};

export const getPersianToday = () => {
  const now = tehranNow().toDate();
  return formatPersianDate(now);
};

export const getPersianNow = () => {
  return tehranNow().toDate();
};

export const convertPersianToGregorian = (persianDate: string) => {
  // تبدیل ساده تاریخ شمسی به میلادی (تقریبی)
  const [year, month, day] = persianDate.split('/').map(Number);
  return new Date(year + 621, month - 1, day);
};

export const formatNumber = (num: number) => {
  return num.toLocaleString('fa-IR');
};

export const formatPrice = (price: number) => {
  return price.toLocaleString('fa-IR');
};

export const getCurrentPersianDateTime = () => {
  const now = tehranNow();
  const persianDate = formatPersianDate(now.toDate());
  const time = now.format('HH:mm:ss');
  return `${persianDate} ${time}`;
};

export const getCurrentTehranTime = () => {
  return tehranNow().toDate();
};

export const getCurrentPersianDate = () => {
  return formatPersianDate();
};

// برای استفاده در فرم‌ها
export const formatPersianDateForInput = (date?: Date | string) => {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  const { jYear, jMonth, jDay } = convertToJalali(d);
  return `${jYear}-${jMonth.toString().padStart(2, '0')}-${jDay.toString().padStart(2, '0')}`;
};