import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatPrice, formatNumber } from "@/lib/utils";
import { formatPersianDate } from "@/lib/persian-date";
import { exportInvoicesToExcel } from "@/lib/excel-export";
import { generateInvoicePDF } from "@/components/invoice/invoice-pdf";
import InvoiceForm from "@/components/invoice/invoice-form";
import { 
  Edit, 
  Trash2, 
  Search, 
  Download, 
  Printer, 
  Filter,
  Eye,
  FileText
} from "lucide-react";

export default function Invoices() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCustomer, setFilterCustomer] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: invoices, isLoading } = useQuery({
    queryKey: ["/api/invoices", "invoice", searchTerm, filterCustomer, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams({
        type: "invoice",
        ...(searchTerm && { search: searchTerm }),
        ...(filterCustomer && filterCustomer !== "all" && { customerId: filterCustomer }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      });
      
      const response = await fetch(`/api/invoices?${params}`);
      return response.json();
    },
  });

  const { data: customers } = useQuery({
    queryKey: ["/api/customers"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/invoices/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({
        title: "موفق",
        description: "فاکتور با موفقیت حذف شد",
      });
    },
    onError: () => {
      toast({
        title: "خطا",
        description: "خطا در حذف فاکتور",
        variant: "destructive",
      });
    },
  });

  const openForm = (invoice?: any) => {
    setEditingInvoice(invoice);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingInvoice(null);
  };

  const handleDelete = (id: number, invoiceNumber: number) => {
    if (window.confirm(`آیا از حذف فاکتور شماره ${formatNumber(invoiceNumber)} اطمینان دارید؟`)) {
      deleteMutation.mutate(id);
    }
  };

  const handlePrint = (invoice: any) => {
    generateInvoicePDF(invoice);
  };

  const handleExport = () => {
    if (invoices?.length) {
      exportInvoicesToExcel(invoices);
      toast({
        title: "موفق",
        description: "فایل Excel با موفقیت دانلود شد",
      });
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilterCustomer("");
    setStartDate("");
    setEndDate("");
  };

  return (
    <>
      <Header
        title="مدیریت فاکتورها"
        action={{
          label: "فاکتور جدید",
          onClick: () => openForm(),
        }}
      />

      <main className="flex-1 overflow-auto p-6">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter size={20} className="text-gray-500" />
            <h3 className="font-medium text-gray-700">فیلترها</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <Input
                placeholder="جستجو شماره فاکتور..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            
            <Select value={filterCustomer} onValueChange={setFilterCustomer}>
              <SelectTrigger>
                <SelectValue placeholder="انتخاب مشتری" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه مشتریان</SelectItem>
                {customers?.map((customer: any) => (
                  <SelectItem key={customer.id} value={customer.id.toString()}>
                    {customer.firstName} {customer.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="date"
              placeholder="از تاریخ"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />

            <Input
              type="date"
              placeholder="تا تاریخ"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />

            <div className="flex gap-2">
              <Button
                onClick={clearFilters}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                پاک کردن فیلتر
              </Button>
              <Button
                onClick={handleExport}
                variant="outline"
                size="sm"
                disabled={!invoices?.length}
              >
                <Download size={16} />
              </Button>
            </div>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>شماره فاکتور</TableHead>
                <TableHead>مشتری</TableHead>
                <TableHead>تاریخ صدور</TableHead>
                <TableHead>مبلغ کل</TableHead>
                <TableHead>وضعیت</TableHead>
                <TableHead>تعداد اقلام</TableHead>
                <TableHead className="text-center">عملیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    در حال بارگذاری...
                  </TableCell>
                </TableRow>
              ) : (invoices || []).length ? (
                (invoices || []).map((invoice: any) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <FileText size={16} className="text-primary" />
                        {formatNumber(invoice.invoiceNumber)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {invoice.customer?.firstName} {invoice.customer?.lastName}
                    </TableCell>
                    <TableCell>
                      {formatPersianDate(invoice.createdAt)}
                    </TableCell>
                    <TableCell className="font-medium text-primary">
                      {formatPrice(invoice.total)} تومان
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={invoice.status === 'final' ? 'default' : 'secondary'}
                        className="bg-success text-success-foreground"
                      >
                        نهایی شده
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatNumber(invoice.items?.length || 0)} قلم
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openForm(invoice)}
                          className="text-blue-600 hover:text-blue-800"
                          title="ویرایش"
                        >
                          <Edit size={14} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handlePrint(invoice)}
                          className="text-green-600 hover:text-green-800"
                          title="چاپ"
                        >
                          <Printer size={14} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(invoice.id, invoice.invoiceNumber)}
                          className="text-red-600 hover:text-red-800"
                          title="حذف"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    {searchTerm || filterCustomer || startDate || endDate 
                      ? "فاکتوری با این مشخصات یافت نشد" 
                      : "هنوز فاکتوری صادر نشده است"
                    }
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Summary */}
        {invoices?.length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-500">تعداد فاکتورها</p>
                <p className="text-2xl font-bold text-primary">
                  {formatNumber(invoices.length)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">مجموع مبلغ</p>
                <p className="text-2xl font-bold text-success">
                  {formatPrice(
                    invoices.reduce((sum: number, inv: any) => sum + parseFloat(inv.total), 0)
                  )} تومان
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">میانگین فاکتور</p>
                <p className="text-2xl font-bold text-warning">
                  {formatPrice(
                    invoices.reduce((sum: number, inv: any) => sum + parseFloat(inv.total), 0) / invoices.length
                  )} تومان
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Invoice Form */}
      <InvoiceForm
        open={isFormOpen}
        onClose={closeForm}
        type="invoice"
        editData={editingInvoice}
      />
    </>
  );
}
