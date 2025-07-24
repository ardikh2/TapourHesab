import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Customer {
  id: number;
  first_name: string;
  last_name: string;
  address?: string;
  phone?: string;
  national_id?: string;
  notes?: string;
  created_at: string;
}

export interface Product {
  id: number;
  name: string;
  quantity: number;
  purchase_price?: number;
  sale_price: number;
  description?: string;
  created_at: string;
}

export interface Invoice {
  id: number;
  invoice_number: number;
  customer_id: number;
  type: 'invoice' | 'pre-invoice';
  subtotal: number;
  discount_type: 'percent' | 'amount';
  discount_value: number;
  discount_amount: number;
  total: number;
  status: 'draft' | 'final';
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id: number;
  invoice_id: number;
  product_id: number;
  quantity: number;
  price: number;
  total: number;
}

export interface InvoiceWithDetails extends Invoice {
  customer: Customer;
  items: (InvoiceItem & { product: Product })[];
}