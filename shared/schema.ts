import { pgTable, text, serial, integer, boolean, timestamp, decimal, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  address: text("address"),
  phone: varchar("phone", { length: 20 }),
  nationalId: varchar("national_id", { length: 10 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  quantity: integer("quantity").notNull().default(0),
  purchasePrice: decimal("purchase_price", { precision: 15, scale: 2 }),
  salePrice: decimal("sale_price", { precision: 15, scale: 2 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: integer("invoice_number").notNull().unique(),
  customerId: integer("customer_id").notNull(),
  type: varchar("type", { length: 20 }).notNull(), // 'invoice' or 'pre-invoice'
  subtotal: decimal("subtotal", { precision: 15, scale: 2 }).notNull(),
  discountType: varchar("discount_type", { length: 10 }).default('percent'), // 'percent' or 'amount'
  discountValue: decimal("discount_value", { precision: 15, scale: 2 }).default('0'),
  discountAmount: decimal("discount_amount", { precision: 15, scale: 2 }).default('0'),
  total: decimal("total", { precision: 15, scale: 2 }).notNull(),
  status: varchar("status", { length: 20 }).default('draft'), // 'draft', 'final', 'converted'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const invoiceItems = pgTable("invoice_items", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").notNull(),
  productId: integer("product_id").notNull(),
  quantity: integer("quantity").notNull(),
  price: decimal("price", { precision: 15, scale: 2 }).notNull(),
  total: decimal("total", { precision: 15, scale: 2 }).notNull(),
});

// Relations
export const customersRelations = relations(customers, ({ many }) => ({
  invoices: many(invoices),
}));

export const productsRelations = relations(products, ({ many }) => ({
  invoiceItems: many(invoiceItems),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  customer: one(customers, {
    fields: [invoices.customerId],
    references: [customers.id],
  }),
  items: many(invoiceItems),
}));

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id],
  }),
  product: one(products, {
    fields: [invoiceItems.productId],
    references: [products.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  invoiceNumber: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInvoiceItemSchema = createInsertSchema(invoiceItems).omit({
  id: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;

export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type InsertInvoiceItem = z.infer<typeof insertInvoiceItemSchema>;

// Extended types for API responses
export type InvoiceWithDetails = Invoice & {
  customer: Customer;
  items: (InvoiceItem & { product: Product })[];
};

export type ProductWithLowStock = Product & {
  isLowStock: boolean;
};
