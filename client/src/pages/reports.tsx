import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { formatPrice, formatNumber } from "@/lib/utils";
import { formatPersianDate } from "@/lib/persian-date";
import { exportInvoicesToExcel, exportCustomersToExcel, exportProductsToExcel } from "@/lib/excel-export";
import { 
  BarChart3, 
  Download, 
  Filter,
  Calendar,
  TrendingUp,
  TrendingDown,
  Users,
  Package,
  FileText,
  DollarSign,
  AlertTriangle
} from "lucide-react";

export default function Reports() {
  const [reportType, setReportType] = useState("sales");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filterCustomer, setFilterCustomer] = useState("all");

  const { toast } = useToast();

  // Dashboard stats
  const { data: dashboardStats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  // All invoices for reports
  const { data: invoices, isLoading: invoicesLoading } = useQuery({
    queryKey: ["/api/invoices", startDate, endDate, filterCustomer],
    queryFn: async () => {
      const params = new URLSearchParams({
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        ...(filterCustomer && filterCustomer !== "all" && { customerId: filterCustomer }),
      });
      
      const response = await fetch(`/api/invoices?${params}`);
      return response.json();
    },
  });

  // Customers
  const { data: customers } = useQuery({
    queryKey: ["/api/customers"],
  });

  // Products
  const { data: products } = useQuery({
    queryKey: ["/api/products"],
  });

  // Low stock products
  const { data: lowStockProducts } = useQuery({
    queryKey: ["/api/products/low-stock"],
  });

  // Top products
  const { data: topProducts } = useQuery({
    queryKey: ["/api/dashboard/top-products", { limit: 10 }],
    queryFn: async () => {
      const response = await fetch("/api/dashboard/top-products?limit=10");
      return response.json();
    },
  });

  const handleExportInvoices = () => {
    if ((invoices || []).length) {
      exportInvoicesToExcel(invoices || []);
      toast({
        title: "موفق",
        description: "گزارش فاکتورها با موفقیت دانلود شد",
      });
    }
  };

  const handleExportCustomers = () => {
    if ((customers || []).length) {
      exportCustomersToExcel(customers || []);
      toast({
        title: "موفق",
        description: "گزارش مشتریان با موفقیت دانلود شد",
      });
    }
  };

  const handleExportProducts = () => {
    if ((products || []).length) {
      exportProductsToExcel(products || []);
      toast({
        title: "موفق",
        description: "گزارش کالاها با موفقیت دانلود شد",
      });
    }
  };

  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
    setFilterCustomer("all");
  };

  // Calculate sales statistics
  const salesStats = invoices ? {
    totalSales: invoices
      .filter((inv: any) => inv.type === 'invoice')
      .reduce((sum: number, inv: any) => sum + parseFloat(inv.total), 0),
    totalInvoices: invoices.filter((inv: any) => inv.type === 'invoice').length,
    totalPreInvoices: invoices.filter((inv: any) => inv.type === 'pre-invoice').length,
    averageInvoice: invoices.filter((inv: any) => inv.type === 'invoice').length > 0 
      ? invoices
          .filter((inv: any) => inv.type === 'invoice')
          .reduce((sum: number, inv: any) => sum + parseFloat(inv.total), 0) / 
        invoices.filter((inv: any) => inv.type === 'invoice').length
      : 0,
  } : null;

  return (
    <>
      <Header title="گزارش‌گیری و تحلیل" />

      <main className="flex-1 overflow-auto p-6">
        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter size={20} />
              فیلترهای گزارش‌گیری
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">از تاریخ</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">تا تاریخ</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">مشتری</label>
                <Select value={filterCustomer} onValueChange={setFilterCustomer}>
                  <SelectTrigger>
                    <SelectValue placeholder="انتخاب مشتری" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه مشتریان</SelectItem>
                    {(customers || []).map((customer: any) => (
                      <SelectItem key={customer.id} value={customer.id.toString()}>
                        {customer.firstName} {customer.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  className="w-full"
                >
                  پاک کردن فیلترها
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">کل فروش</p>
                  <p className="text-2xl font-bold text-primary">
                    {salesStats ? formatPrice(salesStats.totalSales) : formatPrice((dashboardStats as any)?.monthSales || 0)}
                  </p>
                  <p className="text-sm text-gray-500">تومان</p>
                </div>
                <div className="bg-primary/10 p-3 rounded-full">
                  <DollarSign className="text-primary" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">تعداد فاکتورها</p>
                  <p className="text-2xl font-bold text-secondary">
                    {salesStats ? formatNumber(salesStats.totalInvoices) : formatNumber((dashboardStats as any)?.todayInvoices || 0)}
                  </p>
                  <p className="text-sm text-gray-500">فقره</p>
                </div>
                <div className="bg-secondary/10 p-3 rounded-full">
                  <FileText className="text-secondary" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">تعداد مشتریان</p>
                  <p className="text-2xl font-bold text-success">
                    {formatNumber((customers || []).length || 0)}
                  </p>
                  <p className="text-sm text-gray-500">نفر</p>
                </div>
                <div className="bg-success/10 p-3 rounded-full">
                  <Users className="text-success" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">کالاهای کم موجود</p>
                  <p className="text-2xl font-bold text-warning">
                    {formatNumber((lowStockProducts || []).length || 0)}
                  </p>
                  <p className="text-sm text-gray-500">قلم</p>
                </div>
                <div className="bg-warning/10 p-3 rounded-full">
                  <AlertTriangle className="text-warning" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Reports */}
        <Tabs defaultValue="sales" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="sales">گزارش فروش</TabsTrigger>
            <TabsTrigger value="products">گزارش کالاها</TabsTrigger>
            <TabsTrigger value="customers">گزارش مشتریان</TabsTrigger>
            <TabsTrigger value="inventory">گزارش موجودی</TabsTrigger>
          </TabsList>

          {/* Sales Report */}
          <TabsContent value="sales">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 size={20} />
                  گزارش فروش
                </CardTitle>
                <Button onClick={handleExportInvoices} disabled={!invoices?.length}>
                  <Download size={16} className="ml-2" />
                  خروجی Excel
                </Button>
              </CardHeader>
              <CardContent>
                {invoicesLoading ? (
                  <div className="text-center py-8">در حال بارگذاری...</div>
                ) : (
                  <div className="space-y-6">
                    {/* Sales Summary */}
                    {salesStats && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                        <div className="text-center">
                          <p className="text-sm text-gray-500">مجموع فروش</p>
                          <p className="text-xl font-bold text-primary">
                            {formatPrice(salesStats.totalSales)} تومان
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-500">تعداد فاکتورها</p>
                          <p className="text-xl font-bold text-secondary">
                            {formatNumber(salesStats.totalInvoices)} فقره
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-500">میانگین فاکتور</p>
                          <p className="text-xl font-bold text-success">
                            {formatPrice(salesStats.averageInvoice)} تومان
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Invoices Table */}
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>شماره</TableHead>
                          <TableHead>مشتری</TableHead>
                          <TableHead>نوع</TableHead>
                          <TableHead>تاریخ</TableHead>
                          <TableHead>مبلغ</TableHead>
                          <TableHead>تعداد اقلام</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invoices?.length ? (
                          invoices.map((invoice: any) => (
                            <TableRow key={invoice.id}>
                              <TableCell className="font-medium">
                                {formatNumber(invoice.invoiceNumber)}
                              </TableCell>
                              <TableCell>
                                {invoice.customer?.firstName} {invoice.customer?.lastName}
                              </TableCell>
                              <TableCell>
                                <Badge variant={invoice.type === 'invoice' ? 'default' : 'secondary'}>
                                  {invoice.type === 'invoice' ? 'فاکتور' : 'پیش‌فاکتور'}
                                </Badge>
                              </TableCell>
                              <TableCell>{formatPersianDate(invoice.createdAt)}</TableCell>
                              <TableCell className="font-medium">
                                {formatPrice(invoice.total)} تومان
                              </TableCell>
                              <TableCell>{formatNumber(invoice.items?.length || 0)}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                              فاکتوری در این بازه زمانی یافت نشد
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Products Report */}
          <TabsContent value="products">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Package size={20} />
                  گزارش کالاها
                </CardTitle>
                <Button onClick={handleExportProducts} disabled={!(products || []).length}>
                  <Download size={16} className="ml-2" />
                  خروجی Excel
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Top Selling Products */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <TrendingUp size={16} />
                      پرفروش‌ترین کالاها
                    </h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>رتبه</TableHead>
                          <TableHead>نام کالا</TableHead>
                          <TableHead>فروش</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(topProducts || []).map((product: any, index: number) => (
                          <TableRow key={product.id}>
                            <TableCell>
                              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                                index === 0 ? "bg-warning" : index === 1 ? "bg-gray-400" : index === 2 ? "bg-amber-600" : "bg-gray-300 text-gray-700"
                              }`}>
                                {formatNumber(index + 1)}
                              </span>
                            </TableCell>
                            <TableCell className="font-medium">{product.name}</TableCell>
                            <TableCell>{formatNumber(product.soldQuantity)} عدد</TableCell>
                          </TableRow>
                        )) || (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center py-4 text-gray-500">
                              داده‌ای موجود نیست
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Low Stock Products */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <AlertTriangle size={16} />
                      کالاهای کم موجود
                    </h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>نام کالا</TableHead>
                          <TableHead>موجودی</TableHead>
                          <TableHead>وضعیت</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(lowStockProducts || []).map((product: any) => (
                          <TableRow key={product.id}>
                            <TableCell className="font-medium">{product.name}</TableCell>
                            <TableCell>{formatNumber(product.quantity)} عدد</TableCell>
                            <TableCell>
                              <Badge 
                                variant="destructive" 
                                className={product.quantity === 0 ? "bg-red-600" : "bg-warning"}
                              >
                                {product.quantity === 0 ? "ناموجود" : "کم موجود"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        )) || (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center py-4 text-gray-500">
                              همه کالاها موجود هستند
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Customers Report */}
          <TabsContent value="customers">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users size={20} />
                  گزارش مشتریان
                </CardTitle>
                <Button onClick={handleExportCustomers} disabled={!(customers || []).length}>
                  <Download size={16} className="ml-2" />
                  خروجی Excel
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>نام</TableHead>
                      <TableHead>نام خانوادگی</TableHead>
                      <TableHead>تلفن</TableHead>
                      <TableHead>تعداد خرید</TableHead>
                      <TableHead>مجموع خرید</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers?.map((customer: any) => {
                      const customerInvoices = invoices?.filter((inv: any) => 
                        inv.customerId === customer.id && inv.type === 'invoice'
                      ) || [];
                      const totalPurchases = customerInvoices.reduce((sum: number, inv: any) => 
                        sum + parseFloat(inv.total), 0
                      );
                      
                      return (
                        <TableRow key={customer.id}>
                          <TableCell className="font-medium">{customer.firstName}</TableCell>
                          <TableCell>{customer.lastName}</TableCell>
                          <TableCell>{customer.phone || "-"}</TableCell>
                          <TableCell>{formatNumber(customerInvoices.length)}</TableCell>
                          <TableCell className="font-medium text-primary">
                            {formatPrice(totalPurchases)} تومان
                          </TableCell>
                        </TableRow>
                      );
                    }) || (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                          مشتریای ثبت نشده است
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Inventory Report */}
          <TabsContent value="inventory">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Package size={20} />
                  گزارش موجودی انبار
                </CardTitle>
                <Button onClick={handleExportProducts} disabled={!products?.length}>
                  <Download size={16} className="ml-2" />
                  خروجی Excel
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>نام کالا</TableHead>
                      <TableHead>موجودی فعلی</TableHead>
                      <TableHead>قیمت خرید</TableHead>
                      <TableHead>قیمت فروش</TableHead>
                      <TableHead>ارزش موجودی</TableHead>
                      <TableHead>وضعیت</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products?.map((product: any) => {
                      const inventoryValue = product.quantity * parseFloat(product.purchasePrice || product.salePrice);
                      
                      return (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell>{formatNumber(product.quantity)} عدد</TableCell>
                          <TableCell>
                            {product.purchasePrice ? `${formatPrice(product.purchasePrice)} تومان` : "-"}
                          </TableCell>
                          <TableCell>{formatPrice(product.salePrice)} تومان</TableCell>
                          <TableCell className="font-medium">
                            {formatPrice(inventoryValue)} تومان
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={product.quantity < 5 ? "destructive" : "default"}
                              className={product.quantity < 5 ? "bg-warning text-warning-foreground" : "bg-success text-success-foreground"}
                            >
                              {product.quantity === 0 ? "ناموجود" : product.quantity < 5 ? "کم موجود" : "موجود"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    }) || (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          کالایی ثبت نشده است
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}
