import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { exportCustomersToExcel } from "@/lib/excel-export";
import { Edit, Trash2, Search, Download } from "lucide-react";

const customerSchema = z.object({
  firstName: z.string().min(1, "نام الزامی است"),
  lastName: z.string().min(1, "نام خانوادگی الزامی است"),
  address: z.string().optional(),
  phone: z.string().optional(),
  nationalId: z.string().optional(),
  notes: z.string().optional(),
});

export default function Customers() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof customerSchema>>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      address: "",
      phone: "",
      nationalId: "",
      notes: "",
    },
  });

  const { data: customers, isLoading } = useQuery({
    queryKey: ["/api/customers", searchTerm],
    queryFn: async () => {
      const url = searchTerm ? `/api/customers?search=${encodeURIComponent(searchTerm)}` : "/api/customers";
      const response = await fetch(url);
      return response.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const url = editingCustomer ? `/api/customers/${editingCustomer.id}` : "/api/customers";
      const method = editingCustomer ? "PUT" : "POST";
      return await apiRequest(method, url, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({
        title: "موفق",
        description: editingCustomer ? "مشتری با موفقیت بروزرسانی شد" : "مشتری با موفقیت ایجاد شد",
      });
      closeDialog();
    },
    onError: () => {
      toast({
        title: "خطا",
        description: "خطا در ذخیره مشتری",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/customers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({
        title: "موفق",
        description: "مشتری با موفقیت حذف شد",
      });
    },
    onError: () => {
      toast({
        title: "خطا",
        description: "خطا در حذف مشتری",
        variant: "destructive",
      });
    },
  });

  const openDialog = (customer?: any) => {
    if (customer) {
      setEditingCustomer(customer);
      form.reset({
        firstName: customer.firstName,
        lastName: customer.lastName,
        address: customer.address || "",
        phone: customer.phone || "",
        nationalId: customer.nationalId || "",
        notes: customer.notes || "",
      });
    } else {
      setEditingCustomer(null);
      form.reset();
    }
    setIsOpen(true);
  };

  const closeDialog = () => {
    setIsOpen(false);
    setEditingCustomer(null);
    form.reset();
  };

  const onSubmit = async (data: z.infer<typeof customerSchema>) => {
    createMutation.mutate(data);
  };

  const handleDelete = (id: number, name: string) => {
    if (window.confirm(`آیا از حذف مشتری "${name}" اطمینان دارید؟`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleExport = () => {
    if (customers?.length) {
      exportCustomersToExcel(customers);
      toast({
        title: "موفق",
        description: "فایل Excel با موفقیت دانلود شد",
      });
    }
  };

  return (
    <>
      <Header
        title="مدیریت مشتری"
        action={{
          label: "مشتری جدید",
          onClick: () => openDialog(),
        }}
      />

      <main className="flex-1 overflow-auto p-6">
        {/* Search and Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              placeholder="جستجو در مشتریان..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
          <Button
            onClick={handleExport}
            variant="outline"
            className="flex items-center gap-2"
            disabled={!customers?.length}
          >
            <Download size={16} />
            خروجی Excel
          </Button>
        </div>

        {/* Customers Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>نام</TableHead>
                <TableHead>نام خانوادگی</TableHead>
                <TableHead>تلفن</TableHead>
                <TableHead>آدرس</TableHead>
                <TableHead>کد ملی</TableHead>
                <TableHead>توضیحات</TableHead>
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
              ) : customers?.length ? (
                customers.map((customer: any) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.firstName}</TableCell>
                    <TableCell className="font-medium">{customer.lastName}</TableCell>
                    <TableCell>{customer.phone || "-"}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {customer.address || "-"}
                    </TableCell>
                    <TableCell>{customer.nationalId || "-"}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {customer.notes || "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openDialog(customer)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit size={16} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(customer.id, `${customer.firstName} ${customer.lastName}`)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    {searchTerm ? "مشتریای با این مشخصات یافت نشد" : "هنوز مشتریای ثبت نشده است"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </main>

      {/* Customer Dialog */}
      <Dialog open={isOpen} onOpenChange={closeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCustomer ? "ویرایش مشتری" : "افزودن مشتری جدید"}
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نام</FormLabel>
                      <FormControl>
                        <Input placeholder="نام" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نام خانوادگی</FormLabel>
                      <FormControl>
                        <Input placeholder="نام خانوادگی" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تلفن (اختیاری)</FormLabel>
                    <FormControl>
                      <Input placeholder="شماره تلفن" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nationalId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>کد ملی (اختیاری)</FormLabel>
                    <FormControl>
                      <Input placeholder="کد ملی" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>آدرس (اختیاری)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="آدرس کامل" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>توضیحات (اختیاری)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="توضیحات اضافی" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4 justify-end pt-4">
                <Button type="button" variant="outline" onClick={closeDialog}>
                  انصراف
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending
                    ? "در حال ذخیره..."
                    : editingCustomer
                    ? "بروزرسانی"
                    : "ایجاد مشتری"
                  }
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
