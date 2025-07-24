import {
  users,
  customers,
  products,
  invoices,
  invoiceItems,
  type User,
  type InsertUser,
  type Customer,
  type InsertCustomer,
  type Product,
  type InsertProduct,
  type Invoice,
  type InsertInvoice,
  type InvoiceItem,
  type InsertInvoiceItem,
  type InvoiceWithDetails,
  type ProductWithLowStock,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, like, and, gte, lte, sql } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Customers
  getCustomers(search?: string): Promise<Customer[]>;
  getCustomer(id: number): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer>;
  deleteCustomer(id: number): Promise<boolean>;

  // Products
  getProducts(search?: string): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: number): Promise<boolean>;
  getLowStockProducts(): Promise<ProductWithLowStock[]>;

  // Invoices
  getInvoices(filters?: {
    type?: string;
    customerId?: number;
    startDate?: string;
    endDate?: string;
    search?: string;
  }): Promise<InvoiceWithDetails[]>;
  getInvoice(id: number): Promise<InvoiceWithDetails | undefined>;
  createInvoice(invoice: InsertInvoice, items: InsertInvoiceItem[]): Promise<InvoiceWithDetails>;
  updateInvoice(id: number, invoice: Partial<InsertInvoice>, items?: InsertInvoiceItem[]): Promise<InvoiceWithDetails>;
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

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Customers
  async getCustomers(search?: string): Promise<Customer[]> {
    let query = db.select().from(customers);
    
    if (search) {
      query = query.where(
        sql`${customers.firstName} || ' ' || ${customers.lastName} ILIKE ${`%${search}%`}`
      );
    }
    
    return await query.orderBy(asc(customers.firstName));
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer || undefined;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [newCustomer] = await db.insert(customers).values(customer).returning();
    return newCustomer;
  }

  async updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer> {
    const [updatedCustomer] = await db
      .update(customers)
      .set(customer)
      .where(eq(customers.id, id))
      .returning();
    return updatedCustomer;
  }

  async deleteCustomer(id: number): Promise<boolean> {
    const result = await db.delete(customers).where(eq(customers.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Products
  async getProducts(search?: string): Promise<Product[]> {
    let query = db.select().from(products);
    
    if (search) {
      query = query.where(like(products.name, `%${search}%`));
    }
    
    return await query.orderBy(asc(products.name));
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product> {
    const [updatedProduct] = await db
      .update(products)
      .set(product)
      .where(eq(products.id, id))
      .returning();
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getLowStockProducts(): Promise<ProductWithLowStock[]> {
    const lowStockProducts = await db
      .select()
      .from(products)
      .where(sql`${products.quantity} < 5`)
      .orderBy(asc(products.quantity));
    
    return lowStockProducts.map(product => ({
      ...product,
      isLowStock: true,
    }));
  }

  // Invoices
  async getInvoices(filters?: {
    type?: string;
    customerId?: number;
    startDate?: string;
    endDate?: string;
    search?: string;
  }): Promise<InvoiceWithDetails[]> {
    let query = db
      .select()
      .from(invoices)
      .leftJoin(customers, eq(invoices.customerId, customers.id));

    const conditions = [];
    
    if (filters?.type) {
      conditions.push(eq(invoices.type, filters.type));
    }
    
    if (filters?.customerId) {
      conditions.push(eq(invoices.customerId, filters.customerId));
    }
    
    if (filters?.startDate) {
      conditions.push(gte(invoices.createdAt, new Date(filters.startDate)));
    }
    
    if (filters?.endDate) {
      conditions.push(lte(invoices.createdAt, new Date(filters.endDate)));
    }
    
    if (filters?.search) {
      conditions.push(
        sql`${invoices.invoiceNumber}::text ILIKE ${`%${filters.search}%`}`
      );
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const result = await query.orderBy(desc(invoices.createdAt));
    
    // Get items for each invoice
    const invoicesWithDetails: InvoiceWithDetails[] = [];
    
    for (const row of result) {
      const items = await db
        .select()
        .from(invoiceItems)
        .leftJoin(products, eq(invoiceItems.productId, products.id))
        .where(eq(invoiceItems.invoiceId, row.invoices.id));
      
      invoicesWithDetails.push({
        ...row.invoices,
        customer: row.customers!,
        items: items.map(item => ({
          ...item.invoice_items,
          product: item.products!,
        })),
      });
    }
    
    return invoicesWithDetails;
  }

  async getInvoice(id: number): Promise<InvoiceWithDetails | undefined> {
    const [invoice] = await db
      .select()
      .from(invoices)
      .leftJoin(customers, eq(invoices.customerId, customers.id))
      .where(eq(invoices.id, id));
    
    if (!invoice) return undefined;
    
    const items = await db
      .select()
      .from(invoiceItems)
      .leftJoin(products, eq(invoiceItems.productId, products.id))
      .where(eq(invoiceItems.invoiceId, id));
    
    return {
      ...invoice.invoices,
      customer: invoice.customers!,
      items: items.map(item => ({
        ...item.invoice_items,
        product: item.products!,
      })),
    };
  }

  async createInvoice(invoice: InsertInvoice, items: InsertInvoiceItem[]): Promise<InvoiceWithDetails> {
    const invoiceNumber = await this.getNextInvoiceNumber();
    
    const [newInvoice] = await db
      .insert(invoices)
      .values({ ...invoice, invoiceNumber })
      .returning();
    
    // Insert items
    if (items && items.length > 0) {
      const invoiceItemsWithId = items.map(item => ({
        ...item,
        invoiceId: newInvoice.id,
      }));
      
      await db.insert(invoiceItems).values(invoiceItemsWithId);
      
      // Update product quantities if this is a final invoice
      if (invoice.type === 'invoice') {
        for (const item of items) {
          await db
            .update(products)
            .set({
              quantity: sql`${products.quantity} - ${item.quantity}`,
            })
            .where(eq(products.id, item.productId));
        }
      }
    }
    
    return (await this.getInvoice(newInvoice.id))!;
  }

  async updateInvoice(id: number, invoice: Partial<InsertInvoice>, items?: InsertInvoiceItem[]): Promise<InvoiceWithDetails> {
    const [updatedInvoice] = await db
      .update(invoices)
      .set({ ...invoice, updatedAt: new Date() })
      .where(eq(invoices.id, id))
      .returning();
    
    if (items) {
      // Delete existing items
      await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, id));
      
      // Insert new items
      const invoiceItemsWithId = items.map(item => ({
        ...item,
        invoiceId: id,
      }));
      
      await db.insert(invoiceItems).values(invoiceItemsWithId);
    }
    
    return (await this.getInvoice(id))!;
  }

  async deleteInvoice(id: number): Promise<boolean> {
    await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, id));
    const result = await db.delete(invoices).where(eq(invoices.id, id));
    return (result.rowCount || 0) > 0;
  }

  async convertPreInvoiceToInvoice(id: number): Promise<InvoiceWithDetails> {
    const preInvoice = await this.getInvoice(id);
    if (!preInvoice || preInvoice.type !== 'pre-invoice') {
      throw new Error('پیش‌فاکتور یافت نشد');
    }
    
    // Update invoice type and status
    await db
      .update(invoices)
      .set({ 
        type: 'invoice', 
        status: 'final',
        updatedAt: new Date() 
      })
      .where(eq(invoices.id, id));
    
    // Update product quantities
    for (const item of preInvoice.items) {
      await db
        .update(products)
        .set({
          quantity: sql`${products.quantity} - ${item.quantity}`,
        })
        .where(eq(products.id, item.productId));
    }
    
    return (await this.getInvoice(id))!;
  }

  async getNextInvoiceNumber(): Promise<number> {
    const [lastInvoice] = await db
      .select({ invoiceNumber: invoices.invoiceNumber })
      .from(invoices)
      .orderBy(desc(invoices.invoiceNumber))
      .limit(1);
    
    return lastInvoice ? lastInvoice.invoiceNumber + 1 : 1001;
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
    const [todaySalesResult] = await db
      .select({
        total: sql<string>`COALESCE(SUM(${invoices.total}), 0)`,
        count: sql<number>`COUNT(*)`,
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.type, 'invoice'),
          gte(invoices.createdAt, today),
          sql`${invoices.createdAt} < ${tomorrow}`
        )
      );
    
    // Month's sales
    const [monthSalesResult] = await db
      .select({
        total: sql<string>`COALESCE(SUM(${invoices.total}), 0)`,
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.type, 'invoice'),
          gte(invoices.createdAt, startOfMonth)
        )
      );
    
    // Low stock count
    const [lowStockResult] = await db
      .select({
        count: sql<number>`COUNT(*)`,
      })
      .from(products)
      .where(sql`${products.quantity} < 5`);
    
    return {
      todaySales: todaySalesResult.total || '0',
      todayInvoices: todaySalesResult.count || 0,
      monthSales: monthSalesResult.total || '0',
      lowStockCount: lowStockResult.count || 0,
    };
  }

  async getRecentInvoices(limit = 5): Promise<InvoiceWithDetails[]> {
    return await this.getInvoices({ type: 'invoice' });
  }

  async getTopProducts(limit = 5): Promise<Array<Product & { soldQuantity: number }>> {
    const result = await db
      .select({
        id: products.id,
        name: products.name,
        quantity: products.quantity,
        purchasePrice: products.purchasePrice,
        salePrice: products.salePrice,
        description: products.description,
        createdAt: products.createdAt,
        soldQuantity: sql<number>`COALESCE(SUM(${invoiceItems.quantity}), 0)`,
      })
      .from(products)
      .leftJoin(invoiceItems, eq(products.id, invoiceItems.productId))
      .leftJoin(invoices, and(
        eq(invoiceItems.invoiceId, invoices.id),
        eq(invoices.type, 'invoice')
      ))
      .groupBy(products.id)
      .orderBy(desc(sql`COALESCE(SUM(${invoiceItems.quantity}), 0)`))
      .limit(limit);
    
    return result;
  }
}

export const storage = new DatabaseStorage();
