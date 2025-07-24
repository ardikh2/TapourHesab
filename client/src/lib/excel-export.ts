import * as XLSX from 'xlsx';

export function exportToExcel(data: any[], filename: string, sheetName: string = 'Sheet1') {
  try {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${filename}.xlsx`);
  } catch (error) {
    console.error('خطا در صادرات فایل Excel:', error);
    throw new Error('خطا در صادرات فایل Excel');
  }
}

export function exportCustomersToExcel(customers: any[]) {
  const data = customers.map(customer => ({
    'نام': customer.firstName,
    'نام خانوادگی': customer.lastName,
    'آدرس': customer.address || '',
    'تلفن': customer.phone || '',
    'کد ملی': customer.nationalId || '',
    'توضیحات': customer.notes || '',
  }));
  
  exportToExcel(data, 'customers', 'مشتریان');
}

export function exportProductsToExcel(products: any[]) {
  const data = products.map(product => ({
    'نام کالا': product.name,
    'موجودی': product.quantity,
    'قیمت خرید': product.purchasePrice || '',
    'قیمت فروش': product.salePrice,
    'توضیحات': product.description || '',
  }));
  
  exportToExcel(data, 'products', 'کالاها');
}

export function exportInvoicesToExcel(invoices: any[]) {
  const data = invoices.map(invoice => ({
    'شماره فاکتور': invoice.invoiceNumber,
    'نام مشتری': `${invoice.customer?.firstName} ${invoice.customer?.lastName}`,
    'نوع': invoice.type === 'invoice' ? 'فاکتور' : 'پیش‌فاکتور',
    'مبلغ کل': invoice.total,
    'تاریخ': new Date(invoice.createdAt).toLocaleDateString('fa-IR'),
  }));
  
  exportToExcel(data, 'invoices', 'فاکتورها');
}
