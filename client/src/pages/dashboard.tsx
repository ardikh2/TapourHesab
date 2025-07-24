import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice, formatNumber } from "@/lib/utils";
import { formatPersianDate } from "@/lib/persian-date";
import { 
  TrendingUp, 
  FileText, 
  AlertTriangle, 
  Calendar,
  History,
  Trophy,
  ChartArea
} from "lucide-react";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: recentInvoices, isLoading: invoicesLoading } = useQuery({
    queryKey: ["/api/dashboard/recent-invoices"],
  });

  const { data: topProducts, isLoading: productsLoading } = useQuery({
    queryKey: ["/api/dashboard/top-products"],
  });

  const { data: lowStockProducts, isLoading: lowStockLoading } = useQuery({
    queryKey: ["/api/products/low-stock"],
  });

  const statsCards = [
    {
      title: "فروش امروز",
      value: stats ? formatPrice(stats.todaySales) : "0",
      unit: "تومان",
      icon: TrendingUp,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "فاکتورهای امروز",
      value: stats ? formatNumber(stats.todayInvoices) : "0",
      unit: "فقره",
      icon: FileText,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
    {
      title: "کالاهای کم موجود",
      value: stats ? formatNumber(stats.lowStockCount) : "0",
      unit: "قلم",
      icon: AlertTriangle,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      title: "فروش این ماه",
      value: stats ? formatPrice(stats.monthSales) : "0",
      unit: "تومان",
      icon: Calendar,
      color: "text-success",
      bgColor: "bg-success/10",
    },
  ];

  return (
    <>
      <Header title="داشبورد" />
      <main className="flex-1 overflow-auto p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsCards.map((stat, index) => (
            <Card key={index} className="border border-gray-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                    {statsLoading ? (
                      <Skeleton className="h-8 w-24 mt-2" />
                    ) : (
                      <p className={`text-3xl font-bold ${stat.color}`}>
                        {stat.value}
                      </p>
                    )}
                    <p className="text-sm text-gray-500">{stat.unit}</p>
                  </div>
                  <div className={`${stat.bgColor} p-3 rounded-full`}>
                    <stat.icon className={`text-2xl ${stat.color}`} size={24} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Invoices and Low Stock Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Recent Invoices */}
          <Card className="border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-neutral flex items-center">
                <History className="ml-2 text-primary" size={20} />
                آخرین فاکتورها
              </h3>
            </div>
            <CardContent className="p-6">
              {invoicesLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                      <div className="text-left space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {recentInvoices?.slice(0, 5).map((invoice: any) => (
                    <div key={invoice.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-neutral">
                          فاکتور #{formatNumber(invoice.invoiceNumber)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {invoice.customer?.firstName} {invoice.customer?.lastName}
                        </p>
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-primary">
                          {formatPrice(invoice.total)} تومان
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatPersianDate(invoice.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                  {(!recentInvoices || recentInvoices.length === 0) && (
                    <p className="text-center text-gray-500 py-8">
                      هنوز فاکتوری صادر نشده است
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Low Stock Alerts */}
          <Card className="border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-neutral flex items-center">
                <AlertTriangle className="ml-2 text-warning" size={20} />
                هشدار موجودی کم
              </h3>
            </div>
            <CardContent className="p-6">
              {lowStockLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                      <Skeleton className="h-6 w-12" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {lowStockProducts?.map((product: any) => (
                    <div
                      key={product.id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        product.quantity === 0
                          ? "bg-red-100 border-red-300"
                          : product.quantity < 3
                          ? "bg-red-50 border-red-200"
                          : "bg-yellow-50 border-yellow-200"
                      }`}
                    >
                      <div>
                        <p className="font-medium text-neutral">{product.name}</p>
                        <p className="text-sm text-gray-500">کد: {product.id}</p>
                      </div>
                      <div className="text-left">
                        <span
                          className={`px-2 py-1 rounded text-sm text-white ${
                            product.quantity === 0
                              ? "bg-red-600"
                              : product.quantity < 3
                              ? "bg-red-500"
                              : "bg-warning"
                          }`}
                        >
                          {formatNumber(product.quantity)} عدد
                        </span>
                      </div>
                    </div>
                  ))}
                  {(!lowStockProducts || lowStockProducts.length === 0) && (
                    <p className="text-center text-gray-500 py-8">
                      همه کالاها دارای موجودی کافی هستند
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts and Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sales Chart Placeholder */}
          <div className="lg:col-span-2">
            <Card className="border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-neutral flex items-center">
                  <ChartArea className="ml-2 text-primary" size={20} />
                  نمودار فروش هفتگی
                </h3>
              </div>
              <CardContent className="p-6">
                <div className="bg-gray-50 rounded-lg h-64 flex items-center justify-center">
                  <div className="text-center">
                    <ChartArea className="mx-auto text-gray-400 mb-2" size={48} />
                    <p className="text-gray-500">نمودار فروش هفتگی</p>
                    <p className="text-sm text-gray-400 mt-1">قابلیت نمایش نمودار در نسخه آینده اضافه خواهد شد</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Products */}
          <Card className="border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-neutral flex items-center">
                <Trophy className="ml-2 text-warning" size={20} />
                پرفروش‌ترین کالاها
              </h3>
            </div>
            <CardContent className="p-6">
              {productsLoading ? (
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Skeleton className="w-6 h-6 rounded-full ml-3" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                      <Skeleton className="h-3 w-12" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {topProducts?.map((product: any, index: number) => (
                    <div key={product.id} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold text-white ml-3 ${
                            index === 0
                              ? "bg-warning"
                              : index === 1
                              ? "bg-gray-400"
                              : index === 2
                              ? "bg-amber-600"
                              : "bg-gray-300 text-gray-700"
                          }`}
                        >
                          {formatNumber(index + 1)}
                        </span>
                        <span className="font-medium text-neutral">{product.name}</span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {formatNumber(product.soldQuantity)} عدد
                      </span>
                    </div>
                  ))}
                  {(!topProducts || topProducts.length === 0) && (
                    <p className="text-center text-gray-500 py-8">
                      هنوز فروشی انجام نشده است
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
