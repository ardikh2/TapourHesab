import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatPrice, formatNumber } from "@/lib/utils";
import { Plus, Trash2 } from "lucide-react";

const invoiceSchema = z.object({
  customerId: z.string().min(1, "انتخاب مشتری الزامی است"),
  type: z.enum(["invoice", "pre-invoice"]),
  discountType: z.enum(["percent", "amount"]).default("percent"),
  discountValue: z.string().default("0"),
});

interface InvoiceItem {
  productId: number;
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

interface InvoiceFormProps {
  open: boolean;
  onClose: () => void;
  type: "invoice" | "pre-invoice";
  editData?: any;
}

export default function InvoiceForm({ open, onClose, type, editData }: InvoiceFormProps) {
  const [items, setItems] = useState<InvoiceItem[]>(editData?.items || []);
  const [newItem, setNewItem] = useState({
    productId: "",
    quantity: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof invoiceSchema>>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      customerId: editData?.customerId?.toString() || "",
      type,
      discountType: editData?.discountType || "percent",
      discountValue: editData?.discountValue?.toString() || "0",
    },
  });

  const { data: customers } = useQuery({
    queryKey: ["/api/customers"],
  });

  const { data: products } = useQuery({
    queryKey: ["/api/products"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const url = editData ? `/api/invoices/${editData.id}` : "/api/invoices";
      const method = editData ? "PUT" : "POST";
      return await apiRequest(method, url, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({
        title: "موفق",
        description: editData 
          ? "فاکتور با موفقیت بروزرسانی شد"
          : "فاکتور با موفقیت ایجاد شد",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "خطا",
        description: "خطا در ذخیره فاکتور",
        variant: "destructive",
      });
    },
  });

  const addItem = () => {
    if (!newItem.productId || !newItem.quantity) {
      toast({
        title: "خطا",
        description: "لطفا کالا و تعداد را انتخاب کنید",
        variant: "destructive",
      });
      return;
    }

    const product = products?.find((p: any) => p.id.toString() === newItem.productId);
    if (!product) return;

    const quantity = parseInt(newItem.quantity);
    const price = parseFloat(product.salePrice);
    const total = quantity * price;

    const item: InvoiceItem = {
      productId: product.id,
      productName: product.name,
      quantity,
      price,
      total,
    };

    setItems([...items, item]);
    setNewItem({ productId: "", quantity: "" });
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const discountValue = parseFloat(form.watch("discountValue") || "0");
    const discountType = form.watch("discountType");
    
    let discountAmount = 0;
    if (discountType === "percent") {
      discountAmount = (subtotal * discountValue) / 100;
    } else {
      discountAmount = discountValue;
    }

    const total = subtotal - discountAmount;

    return { subtotal, discountAmount, total };
  };

  const onSubmit = async (data: z.infer<typeof invoiceSchema>) => {
    if (items.length === 0) {
      toast({
        title: "خطا",
        description: "لطفا حداقل یک کالا اضافه کنید",
        variant: "destructive",
      });
      return;
    }

    const { subtotal, discountAmount, total } = calculateTotals();

    const invoiceData = {
      invoice: {
        customerId: parseInt(data.customerId),
        type: data.type,
        subtotal: subtotal.toString(),
        discountType: data.discountType,
        discountValue: data.discountValue,
        discountAmount: discountAmount.toString(),
        total: total.toString(),
        status: data.type === "invoice" ? "final" : "draft",
      },
      items: items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price.toString(),
        total: item.total.toString(),
      })),
    };

    createMutation.mutate(invoiceData);
  };

  const { subtotal, discountAmount, total } = calculateTotals();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editData ? "ویرایش" : "صدور"} {type === "invoice" ? "فاکتور" : "پیش‌فاکتور"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Customer and Invoice Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>انتخاب مشتری</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="انتخاب کنید..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {customers?.map((customer: any) => (
                          <SelectItem key={customer.id} value={customer.id.toString()}>
                            {customer.firstName} {customer.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div>
                <Label>شماره فاکتور</Label>
                <Input 
                  value={editData?.invoiceNumber || "شماره خودکار"} 
                  readOnly 
                  className="bg-gray-100" 
                />
              </div>
            </div>

            {/* Add Product */}
            <Card>
              <CardContent className="p-4">
                <Label className="text-base font-medium">افزودن کالا</Label>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                  <Select
                    value={newItem.productId}
                    onValueChange={(value) => setNewItem({ ...newItem, productId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="انتخاب کالا..." />
                    </SelectTrigger>
                    <SelectContent>
                      {products?.map((product: any) => (
                        <SelectItem key={product.id} value={product.id.toString()}>
                          {product.name} - {formatPrice(product.salePrice)} تومان
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    placeholder="تعداد"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                  />
                  <Input
                    value={
                      newItem.productId
                        ? formatPrice(products?.find((p: any) => p.id.toString() === newItem.productId)?.salePrice || 0)
                        : ""
                    }
                    readOnly
                    className="bg-gray-100"
                    placeholder="قیمت واحد"
                  />
                  <Button type="button" onClick={addItem} className="bg-secondary hover:bg-green-700">
                    <Plus size={16} />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Items Table */}
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ردیف</TableHead>
                      <TableHead>نام کالا</TableHead>
                      <TableHead>تعداد</TableHead>
                      <TableHead>قیمت واحد</TableHead>
                      <TableHead>مبلغ کل</TableHead>
                      <TableHead className="text-center">عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{formatNumber(index + 1)}</TableCell>
                        <TableCell>{item.productName}</TableCell>
                        <TableCell>{formatNumber(item.quantity)}</TableCell>
                        <TableCell>{formatPrice(item.price)}</TableCell>
                        <TableCell className="font-medium">{formatPrice(item.total)}</TableCell>
                        <TableCell className="text-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(index)}
                            className="text-destructive hover:text-red-700"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {items.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                          هنوز کالایی اضافه نشده است
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Discount and Total */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Label>تخفیف</Label>
                <div className="flex gap-2">
                  <FormField
                    control={form.control}
                    name="discountValue"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="مقدار تخفیف"
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="discountType"
                    render={({ field }) => (
                      <FormItem>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="percent">درصد</SelectItem>
                            <SelectItem value="amount">تومان</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>جمع کل:</span>
                      <span>{formatPrice(subtotal)} تومان</span>
                    </div>
                    <div className="flex justify-between">
                      <span>تخفیف:</span>
                      <span>{formatPrice(discountAmount)} تومان</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>مبلغ نهایی:</span>
                      <span>{formatPrice(total)} تومان</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                انصراف
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="bg-primary hover:bg-blue-700"
              >
                {createMutation.isPending
                  ? "در حال ذخیره..."
                  : editData
                  ? "بروزرسانی"
                  : type === "invoice"
                  ? "صدور فاکتور نهایی"
                  : "ذخیره پیش‌فاکتور"
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
