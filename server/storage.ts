import { supabase } from "./db";
import type {
  Customer,
  Product,
  Invoice,
  InvoiceItem,
  InvoiceWithDetails,
} from "../client/src/lib/supabase";

export interface IStorage {
  // Customers
  getCustomers(search?: string): Promise<Customer[]>;
  getCustomer(id: number): Promise<Customer | undefined>;
  createCustomer(customer: Omit<Customer, 'id' | 'created_at'>): Promise<Customer>;
  updateCustomer(id: number, customer: Partial<Omit<Customer, 'id' | 'created_at'>>): Promise<Customer>;
  deleteCustomer(id: number): Promise<boolean>;

  // Products
  getProducts(search?: string): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: Omit<Product, 'id' | 'created_at'>): Promise<Product>;
  updateProduct(id: number, product: Partial<Omit<Product, 'id' | 'created_at'>>): Promise<Product>;
  deleteProduct(id: number): Promise<boolean>;
  getLowStockProducts(): Promise<Product[]>;

  // Invoices
  getInvoices(filters?: {
    type?: string;
    customerId?: number;
    startDate?: string;
    endDate?: string;
    search?: string;
  }): Promise<InvoiceWithDetails[]>;
  getInvoice(id: number): Promise<InvoiceWithDetails | undefined>;
  createInvoice(invoice: Omit<Invoice, 'id' | 'invoice_number' | 'created_at' | 'updated_at'>, items: Omit<InvoiceItem, 'id' | 'invoice_id'>[]): Promise<InvoiceWithDetails>;
  updateInvoice(id: number, invoice: Partial<Omit<Invoice, 'id' | 'invoice_number' | 'created_at' | 'updated_at'>>, items?: Omit<InvoiceItem, 'id' | 'invoice_id'>[]): Promise<InvoiceWithDetails>;
  deleteInvoice(id: number): Promise<boolean>;
  convertPreInvoiceToInvoice(id: number): Promise<InvoiceWithDetails>;
  getNextInvoiceNumber(): Promise<number>;

  // Analytics
  getDashboardStats(): Promise<{
    todaySales: string;
    todayInvoices: number;
    monthSales: string;
    lowStockCount: number;
  }>;
  getRecentInvoices(limit?: number): Promise<InvoiceWithDetails[]>;
  getTopProducts(limit?: number): Promise<Array<Product & { soldQuantity: number }>>;
}

export class SupabaseStorage implements IStorage {
  // Customers
  async getCustomers(search?: string): Promise<Customer[]> {
    let query = supabase.from('customers').select('*');
    
    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
    }
    
    const { data, error } = await query.order('first_name');
    if (error) throw error;
    return data || [];
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data || undefined;
  }

  async createCustomer(customer: Omit<Customer, 'id' | 'created_at'>): Promise<Customer> {
    const { data, error } = await supabase
      .from('customers')
      .insert(customer)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateCustomer(id: number, customer: Partial<Omit<Customer, 'id' | 'created_at'>>): Promise<Customer> {
    const { data, error } = await supabase
      .from('customers')
      .update(customer)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async deleteCustomer(id: number): Promise<boolean> {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);
    
    return !error;
  }

  // Products
  async getProducts(search?: string): Promise<Product[]> {
    let query = supabase.from('products').select('*');
    
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }
    
    const { data, error } = await query.order('name');
    if (error) throw error;
    return data || [];
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data || undefined;
  }

  async createProduct(product: Omit<Product, 'id' | 'created_at'>): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .insert(product)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateProduct(id: number, product: Partial<Omit<Product, 'id' | 'created_at'>>): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .update(product)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async deleteProduct(id: number): Promise<boolean> {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
    
    return !error;
  }

  async getLowStockProducts(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .lt('quantity', 5)
      .order('quantity');
    
    if (error) throw error;
    return data || [];
  }

  // Invoices
  async getInvoices(filters?: {
    type?: string;
    customerId?: number;
    startDate?: string;
    endDate?: string;
    search?: string;
  }): Promise<InvoiceWithDetails[]> {
    let query = supabase
      .from('invoices')
      .select(`
        *,
        customer:customers(*),
        items:invoice_items(
          *,
          product:products(*)
        )
      `);

    if (filters?.type) {
      query = query.eq('type', filters.type);
    }
    
    if (filters?.customerId) {
      query = query.eq('customer_id', filters.customerId);
    }
    
    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate);
    }
    
    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate);
    }
    
    if (filters?.search) {
      query = query.ilike('invoice_number', `%${filters.search}%`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    
    return (data || []).map(invoice => ({
      ...invoice,
      customer: invoice.customer,
      items: invoice.items || []
    }));
  }

  async getInvoice(id: number): Promise<InvoiceWithDetails | undefined> {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        customer:customers(*),
        items:invoice_items(
          *,
          product:products(*)
        )
      `)
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    if (!data) return undefined;
    
    return {
      ...data,
      customer: data.customer,
      items: data.items || []
    };
  }

  async createInvoice(invoice: Omit<Invoice, 'id' | 'invoice_number' | 'created_at' | 'updated_at'>, items: Omit<InvoiceItem, 'id' | 'invoice_id'>[]): Promise<InvoiceWithDetails> {
    const invoiceNumber = await this.getNextInvoiceNumber();
    
    const { data: newInvoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({ ...invoice, invoice_number: invoiceNumber })
      .select()
      .single();
    
    if (invoiceError) throw invoiceError;
    
    // Insert items
    if (items && items.length > 0) {
      const invoiceItemsWithId = items.map(item => ({
        ...item,
        invoice_id: newInvoice.id,
      }));
      
      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(invoiceItemsWithId);
      
      if (itemsError) throw itemsError;
      
      // Update product quantities if this is a final invoice
      if (invoice.type === 'invoice') {
        for (const item of items) {
          const { error: updateError } = await supabase.rpc('update_product_quantity', {
            product_id: item.product_id,
            quantity_change: -item.quantity
          });
          
          if (updateError) throw updateError;
        }
      }
    }
    
    const result = await this.getInvoice(newInvoice.id);
    if (!result) throw new Error('Failed to retrieve created invoice');
    return result;
  }

  async updateInvoice(id: number, invoice: Partial<Omit<Invoice, 'id' | 'invoice_number' | 'created_at' | 'updated_at'>>, items?: Omit<InvoiceItem, 'id' | 'invoice_id'>[]): Promise<InvoiceWithDetails> {
    const { data: updatedInvoice, error: invoiceError } = await supabase
      .from('invoices')
      .update({ ...invoice, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (invoiceError) throw invoiceError;
    
    if (items) {
      // Delete existing items
      await supabase.from('invoice_items').delete().eq('invoice_id', id);
      
      // Insert new items
      const invoiceItemsWithId = items.map(item => ({
        ...item,
        invoice_id: id,
      }));
      
      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(invoiceItemsWithId);
      
      if (itemsError) throw itemsError;
    }
    
    const result = await this.getInvoice(id);
    if (!result) throw new Error('Failed to retrieve updated invoice');
    return result;
  }

  async deleteInvoice(id: number): Promise<boolean> {
    const { error: itemsError } = await supabase
      .from('invoice_items')
      .delete()
      .eq('invoice_id', id);
    
    if (itemsError) return false;
    
    const { error: invoiceError } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id);
    
    return !invoiceError;
  }

  async convertPreInvoiceToInvoice(id: number): Promise<InvoiceWithDetails> {
    const preInvoice = await this.getInvoice(id);
    if (!preInvoice || preInvoice.type !== 'pre-invoice') {
      throw new Error('پیش‌فاکتور یافت نشد');
    }
    
    // Update invoice type and status
    const { error: updateError } = await supabase
      .from('invoices')
      .update({ 
        type: 'invoice', 
        status: 'final',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
    
    if (updateError) throw updateError;
    
    // Update product quantities
    for (const item of preInvoice.items) {
      const { error: quantityError } = await supabase.rpc('update_product_quantity', {
        product_id: item.product_id,
        quantity_change: -item.quantity
      });
      
      if (quantityError) throw quantityError;
    }
    
    const result = await this.getInvoice(id);
    if (!result) throw new Error('Failed to retrieve converted invoice');
    return result;
  }

  async getNextInvoiceNumber(): Promise<number> {
    const { data, error } = await supabase
      .from('invoices')
      .select('invoice_number')
      .order('invoice_number', { ascending: false })
      .limit(1);
    
    if (error) throw error;
    return data && data.length > 0 ? data[0].invoice_number + 1 : 1001;
  }

  // Analytics
  async getDashboardStats(): Promise<{
    todaySales: string;
    todayInvoices: number;
    monthSales: string;
    lowStockCount: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // Today's sales
    const { data: todayData, error: todayError } = await supabase
      .from('invoices')
      .select('total')
      .eq('type', 'invoice')
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString());
    
    if (todayError) throw todayError;
    
    // Month's sales
    const { data: monthData, error: monthError } = await supabase
      .from('invoices')
      .select('total')
      .eq('type', 'invoice')
      .gte('created_at', startOfMonth.toISOString());
    
    if (monthError) throw monthError;
    
    // Low stock count
    const { count: lowStockCount, error: stockError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .lt('quantity', 5);
    
    if (stockError) throw stockError;
    
    const todaySales = (todayData || []).reduce((sum, inv) => sum + parseFloat(inv.total.toString()), 0);
    const monthSales = (monthData || []).reduce((sum, inv) => sum + parseFloat(inv.total.toString()), 0);
    
    return {
      todaySales: todaySales.toString(),
      todayInvoices: (todayData || []).length,
      monthSales: monthSales.toString(),
      lowStockCount: lowStockCount || 0,
    };
  }

  async getRecentInvoices(limit = 5): Promise<InvoiceWithDetails[]> {
    return await this.getInvoices({ type: 'invoice' });
  }

  async getTopProducts(limit = 5): Promise<Array<Product & { soldQuantity: number }>> {
    const { data, error } = await supabase.rpc('get_top_products', { limit_count: limit });
    
    if (error) throw error;
    return data || [];
  }
}

export const storage = new SupabaseStorage();