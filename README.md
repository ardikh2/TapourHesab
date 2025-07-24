# سیستم حسابداری تپور - Supabase Edition

یک سیستم حسابداری کامل با React.js و Supabase

## راه‌اندازی پروژه

### 1. نصب وابستگی‌ها
```bash
npm install
```

### 2. تنظیم Supabase

1. یک پروژه جدید در [Supabase](https://supabase.com) ایجاد کنید
2. فایل `.env` را ایجاد کنید و متغیرهای زیر را اضافه کنید:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
PORT=5000
NODE_ENV=development
```

### 3. اجرای Migration

در پنل Supabase خود:
1. به بخش SQL Editor بروید
2. محتویات فایل `supabase/migrations/001_initial_schema.sql` را کپی و اجرا کنید

### 4. اجرای پروژه

```bash
npm run dev
```

## ویژگی‌های سیستم

- ✅ مدیریت مشتریان
- ✅ مدیریت کالاها
- ✅ صدور فاکتور و پیش‌فاکتور
- ✅ سیستم تخفیف
- ✅ گزارش‌گیری
- ✅ داشبورد تحلیلی
- ✅ خروجی Excel و PDF
- ✅ پشتیبان‌گیری و بازیابی
- ✅ طراحی فارسی و راست‌چین

## دپلوی

### Vercel
```bash
npm run build
```

### Netlify
```bash
npm run build
```

پروژه آماده دپلوی در پلتفرم‌های مختلف است.

## تکنولوژی‌های استفاده شده

- **Frontend**: React.js + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express.js
- **Database**: Supabase (PostgreSQL)
- **UI Components**: Radix UI + shadcn/ui
- **State Management**: TanStack Query
- **Build Tool**: Vite

## پشتیبانی

برای هرگونه سوال یا مشکل، لطفاً Issue ایجاد کنید.