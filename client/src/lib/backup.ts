import { formatPersianDateTime } from './persian-date';

// Types for backup data
interface BackupData {
  version: string;
  exportDate: string;
  data: {
    customers: any[];
    products: any[];
    invoices: any[];
    invoiceItems: any[];
  };
}

// Export all data to JSON
export const exportAllData = async (): Promise<string> => {
  try {
    // Fetch all data from API
    const [customersRes, productsRes, invoicesRes] = await Promise.all([
      fetch('/api/customers'),
      fetch('/api/products'),
      fetch('/api/invoices')
    ]);

    const customers = await customersRes.json();
    const products = await productsRes.json();
    const invoices = await invoicesRes.json();

    // Get all invoice items
    const invoiceItems: any[] = [];
    for (const invoice of invoices) {
      if (invoice.items) {
        invoiceItems.push(...invoice.items.map((item: any) => ({
          ...item,
          invoiceId: invoice.id
        })));
      }
    }

    const backupData: BackupData = {
      version: '1.0.0',
      exportDate: formatPersianDateTime(),
      data: {
        customers,
        products,
        invoices: invoices.map((inv: any) => {
          const { items, customer, ...invoice } = inv;
          return invoice;
        }),
        invoiceItems
      }
    };

    return JSON.stringify(backupData, null, 2);
  } catch (error) {
    console.error('Error exporting data:', error);
    throw new Error('خطا در تهیه پشتیبان از اطلاعات');
  }
};

// Download backup file
export const downloadBackup = async () => {
  try {
    const backupJson = await exportAllData();
    const blob = new Blob([backupJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `tapor-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading backup:', error);
    throw new Error('خطا در دانلود فایل پشتیبان');
  }
};

// Import data from backup
export const importBackupData = async (backupData: BackupData): Promise<void> => {
  try {
    const { customers, products, invoices, invoiceItems } = backupData.data;

    // Import customers
    for (const customer of customers) {
      const { id, ...customerData } = customer;
      await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerData)
      });
    }

    // Import products
    for (const product of products) {
      const { id, ...productData } = product;
      await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });
    }

    // Import invoices with items
    for (const invoice of invoices) {
      const { id, ...invoiceData } = invoice;
      const items = invoiceItems.filter(item => item.invoiceId === id);
      
      await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoice: invoiceData,
          items: items.map(item => {
            const { id: itemId, invoiceId, ...itemData } = item;
            return itemData;
          })
        })
      });
    }
  } catch (error) {
    console.error('Error importing data:', error);
    throw new Error('خطا در بازیابی اطلاعات از پشتیبان');
  }
};

// Parse backup file
export const parseBackupFile = (file: File): Promise<BackupData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const backupData = JSON.parse(e.target?.result as string);
        
        // Validate backup structure
        if (!backupData.version || !backupData.data) {
          throw new Error('فایل پشتیبان نامعتبر است');
        }
        
        resolve(backupData);
      } catch (error) {
        reject(new Error('خطا در خواندن فایل پشتیبان'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('خطا در خواندن فایل'));
    };
    
    reader.readAsText(file);
  });
};