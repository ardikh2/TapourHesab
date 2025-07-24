import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCustomerSchema, insertProductSchema, insertInvoiceSchema, insertInvoiceItemSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Customers
  app.get("/api/customers", async (req, res) => {
    try {
      const search = req.query.search as string;
      const customers = await storage.getCustomers(search);
      res.json(customers);
    } catch (error) {
      res.status(500).json({ message: "خطا در دریافت لیست مشتریان" });
    }
  });

  app.get("/api/customers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const customer = await storage.getCustomer(id);
      if (!customer) {
        return res.status(404).json({ message: "مشتری یافت نشد" });
      }
      res.json(customer);
    } catch (error) {
      res.status(500).json({ message: "خطا در دریافت اطلاعات مشتری" });
    }
  });

  app.post("/api/customers", async (req, res) => {
    try {
      const customerData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(customerData);
      res.status(201).json(customer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "اطلاعات وارد شده نامعتبر است", errors: error.errors });
      }
      res.status(500).json({ message: "خطا در ایجاد مشتری" });
    }
  });

  app.put("/api/customers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const customerData = insertCustomerSchema.partial().parse(req.body);
      const customer = await storage.updateCustomer(id, customerData);
      res.json(customer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "اطلاعات وارد شده نامعتبر است", errors: error.errors });
      }
      res.status(500).json({ message: "خطا در بروزرسانی مشتری" });
    }
  });

  app.delete("/api/customers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteCustomer(id);
      if (!success) {
        return res.status(404).json({ message: "مشتری یافت نشد" });
      }
      res.json({ message: "مشتری با موفقیت حذف شد" });
    } catch (error) {
      res.status(500).json({ message: "خطا در حذف مشتری" });
    }
  });

  // Products
  app.get("/api/products", async (req, res) => {
    try {
      const search = req.query.search as string;
      const products = await storage.getProducts(search);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "خطا در دریافت لیست کالاها" });
    }
  });

  app.get("/api/products/low-stock", async (req, res) => {
    try {
      const products = await storage.getLowStockProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "خطا در دریافت کالاهای کم موجود" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getProduct(id);
      if (!product) {
        return res.status(404).json({ message: "کالا یافت نشد" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "خطا در دریافت اطلاعات کالا" });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "اطلاعات وارد شده نامعتبر است", errors: error.errors });
      }
      res.status(500).json({ message: "خطا در ایجاد کالا" });
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const productData = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(id, productData);
      res.json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "اطلاعات وارد شده نامعتبر است", errors: error.errors });
      }
      res.status(500).json({ message: "خطا در بروزرسانی کالا" });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteProduct(id);
      if (!success) {
        return res.status(404).json({ message: "کالا یافت نشد" });
      }
      res.json({ message: "کالا با موفقیت حذف شد" });
    } catch (error) {
      res.status(500).json({ message: "خطا در حذف کالا" });
    }
  });

  // Invoices
  app.get("/api/invoices", async (req, res) => {
    try {
      const filters = {
        type: req.query.type as string,
        customerId: req.query.customerId ? parseInt(req.query.customerId as string) : undefined,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        search: req.query.search as string,
      };
      const invoices = await storage.getInvoices(filters);
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ message: "خطا در دریافت لیست فاکتورها" });
    }
  });

  app.get("/api/invoices/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const invoice = await storage.getInvoice(id);
      if (!invoice) {
        return res.status(404).json({ message: "فاکتور یافت نشد" });
      }
      res.json(invoice);
    } catch (error) {
      res.status(500).json({ message: "خطا در دریافت اطلاعات فاکتور" });
    }
  });

  const createInvoiceSchema = z.object({
    invoice: insertInvoiceSchema,
    items: z.array(insertInvoiceItemSchema),
  });

  app.post("/api/invoices", async (req, res) => {
    try {
      console.log("Received invoice creation request:", req.body);
      const { invoice, items } = createInvoiceSchema.parse(req.body);
      console.log("Parsed data:", { invoice, items });
      const newInvoice = await storage.createInvoice(invoice, items);
      console.log("Created invoice:", newInvoice);
      res.status(201).json(newInvoice);
    } catch (error) {
      console.error("Error creating invoice:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "اطلاعات وارد شده نامعتبر است", errors: error.errors });
      }
      res.status(500).json({ message: "خطا در ایجاد فاکتور" });
    }
  });

  app.put("/api/invoices/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { invoice, items } = createInvoiceSchema.parse(req.body);
      const updatedInvoice = await storage.updateInvoice(id, invoice, items);
      res.json(updatedInvoice);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "اطلاعات وارد شده نامعتبر است", errors: error.errors });
      }
      res.status(500).json({ message: "خطا در بروزرسانی فاکتور" });
    }
  });

  app.delete("/api/invoices/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteInvoice(id);
      if (!success) {
        return res.status(404).json({ message: "فاکتور یافت نشد" });
      }
      res.json({ message: "فاکتور با موفقیت حذف شد" });
    } catch (error) {
      res.status(500).json({ message: "خطا در حذف فاکتور" });
    }
  });

  app.post("/api/invoices/:id/convert", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const invoice = await storage.convertPreInvoiceToInvoice(id);
      res.json(invoice);
    } catch (error) {
      res.status(500).json({ message: "خطا در تبدیل پیش‌فاکتور به فاکتور" });
    }
  });

  // Dashboard and Analytics
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "خطا در دریافت آمار داشبورد" });
    }
  });

  app.get("/api/dashboard/recent-invoices", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      const invoices = await storage.getRecentInvoices(limit);
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ message: "خطا در دریافت آخرین فاکتورها" });
    }
  });

  app.get("/api/dashboard/top-products", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      const products = await storage.getTopProducts(limit);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "خطا در دریافت پرفروش‌ترین کالاها" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
