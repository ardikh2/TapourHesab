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
import { formatPrice, formatNumber } from "@/lib/utils";
import { exportProductsToExcel } from "@/lib/excel-export";
import { Edit, Trash2, Search, Download, AlertTriangle } from "lucide-react";

const productSchema = z.object({
  name: z.string().min(1, "نام کالا الزامی است"),
  quantity: z.string().min(0, "تعداد نمی‌تواند منفی باشد"),
  purchasePrice: z.string().optional(),
  salePrice: z.string().min(1, "قیمت فروش الزامی است"),
  description: z.string().optional(),
});

export default function Products() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      quantity: "0",
      purchasePrice: "",
      salePrice: "",
      description: "",
    },
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ["/api/products", searchTerm],
    queryFn: async () => {
      const url = searchTerm ? `/api/products?search=${encodeURIComponent(searchTerm)}` : "/api/products";
      const response = await fetch(url);
      return response.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : "/api/products";
      const method = editingProduct ? "PUT" : "POST";
      return await apiRequest(method, url, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "موفق",
        description: editingProduct ? "کالا با موفقیت بروزرسانی شد" : "کالا با موفقیت ایجاد شد",
      });
      closeDialog();
    },
    onError: () => {
      toast({
        title: "خطا",
        description: "خطا در ذخیره کالا",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "موفق",
        description: "کالا با موفقیت حذف شد",
      });
    },
    onError: () => {
      toast({
        title: "خطا",
        description: "خطا در حذف کالا",
        variant: "destructive",
      });
    },
  });

  const openDialog = (product?: any) => {
    if (product) {
      setEditingProduct(product);
      form.reset({
        name: product.name,
        quantity: product.quantity.toString(),
        purchasePrice: product.purchasePrice?.toString() || "",
        salePrice: product.salePrice.toString(),
        description: product.description || "",
      });
    } else {
      setEditingProduct(null);
      form.reset();
    }
    setIsOpen(true);
  };

  const closeDialog = () => {
    setIsOpen(false);
    setEditingProduct(null);
    form.reset();
  };

  const onSubmit = async (data: z.infer<typeof productSchema>) => {
    const productData = {
      name: data.name,
      quantity: parseInt(data.quantity),
      purchasePrice: data.purchasePrice ? data.purchasePrice : null,
      salePrice: data.salePrice,
      description: data.description || null,
    };

    createMutation.mutate(productData);
  };

  const handleDelete = (id: number, name: string) => {
    if (window.confirm(`آیا از حذف کالای "${name}" اطمینان دارید؟`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleExport = () => {
    if (products?.length) {
      exportProductsToExcel(products);
      toast({
        title: "موفق",
        description: "فایل Excel با موفقیت دانلود شد",
      });
    }
  };

  return (
    <>
      <Header
        title="مدیریت کالا"
        action={{
          label: "کالای جدید",
          onClick: () => openDialog(),
        }}
      />

      <main className="flex-1 overflow-auto p-6">
        {/* Search and Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              placeholder="جستجو در کالاها..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
          <Button
            onClick={handleExport}
            variant="outline"
            className="flex items-center gap-2"
            disabled={!products?.length}
          >
            <Download size={16} />
            خروجی Excel
          </Button>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>نام کالا</TableHead>
                <TableHead>موجودی</TableHead>
                <TableHead>قیمت خرید</TableHead>
                <TableHead>قیمت فروش</TableHead>
                <TableHead>توضیحات</TableHead>
                <TableHead className="text-center">وضعیت</TableHead>
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
              ) : products?.length ? (
                products.map((product: any) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>
                      <span className={`font-medium ${product.quantity < 5 ? 'text-red-600' : ''}`}>
                        {formatNumber(product.quantity)} عدد
                      </span>
                    </TableCell>
                    <TableCell>
                      {product.purchasePrice ? `${formatPrice(product.purchasePrice)} تومان` : "-"}
                    </TableCell>
                    <TableCell>
                      {formatPrice(product.salePrice)} تومان
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {product.description || "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      {product.quantity < 5 ? (
                        <div className="flex items-center justify-center gap-1 text-warning">
                          <AlertTriangle size={16} />
                          <span className="text-sm">کم موجود</span>
                        </div>
                      ) : (
                        <span className="text-sm text-success">موجود</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openDialog(product)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit size={16} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(product.id, product.name)}
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
                    {searchTerm ? "کالایی با این مشخصات یافت نشد" : "هنوز کالایی ثبت نشده است"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </main>

      {/* Product Dialog */}
      <Dialog open={isOpen} onOpenChange={closeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "ویرایش کالا" : "افزودن کالای جدید"}
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نام کالا</FormLabel>
                    <FormControl>
                      <Input placeholder="نام کالا را وارد کنید" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تعداد موجودی</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="purchasePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>قیمت خرید (اختیاری)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="قیمت خرید" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="salePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>قیمت فروش</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="قیمت فروش" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>توضیحات (اختیاری)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="توضیحات کالا" {...field} />
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
                    : editingProduct
                    ? "بروزرسانی"
                    : "ایجاد کالا"
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
