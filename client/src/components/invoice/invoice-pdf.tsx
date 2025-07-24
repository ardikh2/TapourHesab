import { formatPrice, formatNumber } from "@/lib/utils";
import { formatPersianDate } from "@/lib/persian-date";

interface InvoicePDFProps {
  invoice: any;
}

export function generateInvoicePDF(invoice: any) {
  // Create a new window for printing
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const content = `
    <!DOCTYPE html>
    <html lang="fa" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>فاکتور شماره ${formatNumber(invoice.invoiceNumber)}</title>
      <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;600;700&display=swap" rel="stylesheet">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Vazirmatn', sans-serif;
          direction: rtl;
          line-height: 1.6;
          color: #333;
          padding: 20px;
        }
        
        .invoice-container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          border: 2px solid #1e40af;
          border-radius: 10px;
          overflow: hidden;
        }
        
        .header {
          background: linear-gradient(135deg, #1e40af, #3b82f6);
          color: white;
          padding: 30px;
          text-align: center;
        }
        
        .company-name {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 10px;
        }
        
        .invoice-title {
          font-size: 1.5rem;
          font-weight: 600;
        }
        
        .invoice-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          padding: 30px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .info-section h3 {
          color: #1e40af;
          font-weight: 600;
          margin-bottom: 15px;
          font-size: 1.1rem;
        }
        
        .info-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        
        .info-label {
          font-weight: 500;
          color: #64748b;
        }
        
        .info-value {
          font-weight: 600;
          color: #1e293b;
        }
        
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin: 0;
        }
        
        .items-table th {
          background: #1e40af;
          color: white;
          padding: 15px 10px;
          text-align: center;
          font-weight: 600;
        }
        
        .items-table td {
          padding: 12px 10px;
          text-align: center;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .items-table tr:nth-child(even) {
          background: #f8fafc;
        }
        
        .totals {
          padding: 30px;
          background: #f8fafc;
        }
        
        .totals-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 30px;
        }
        
        .total-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          padding: 8px 0;
        }
        
        .total-item.final {
          border-top: 2px solid #1e40af;
          font-size: 1.2rem;
          font-weight: 700;
          color: #1e40af;
          margin-top: 15px;
          padding-top: 15px;
        }
        
        .signature {
          text-align: center;
          padding: 20px;
          border-top: 1px solid #e2e8f0;
        }
        
        .signature-line {
          border-top: 2px solid #64748b;
          width: 200px;
          margin: 30px auto 10px;
        }
        
        @media print {
          body {
            padding: 0;
          }
          
          .invoice-container {
            border: none;
            border-radius: 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <div class="header">
          <div class="company-name">سیستم حسابداری تپور</div>
          <div class="invoice-title">
            ${invoice.type === 'invoice' ? 'فاکتور فروش' : 'پیش‌فاکتور'}
          </div>
        </div>
        
        <div class="invoice-info">
          <div class="info-section">
            <h3>اطلاعات فاکتور</h3>
            <div class="info-item">
              <span class="info-label">شماره فاکتور:</span>
              <span class="info-value">${formatNumber(invoice.invoiceNumber)}</span>
            </div>
            <div class="info-item">
              <span class="info-label">تاریخ صدور:</span>
              <span class="info-value">${formatPersianDate(invoice.createdAt)}</span>
            </div>
            <div class="info-item">
              <span class="info-label">نوع:</span>
              <span class="info-value">${invoice.type === 'invoice' ? 'فاکتور نهایی' : 'پیش‌فاکتور'}</span>
            </div>
          </div>
          
          <div class="info-section">
            <h3>اطلاعات مشتری</h3>
            <div class="info-item">
              <span class="info-label">نام:</span>
              <span class="info-value">${invoice.customer?.firstName} ${invoice.customer?.lastName}</span>
            </div>
            ${invoice.customer?.phone ? `
            <div class="info-item">
              <span class="info-label">تلفن:</span>
              <span class="info-value">${invoice.customer.phone}</span>
            </div>
            ` : ''}
            ${invoice.customer?.address ? `
            <div class="info-item">
              <span class="info-label">آدرس:</span>
              <span class="info-value">${invoice.customer.address}</span>
            </div>
            ` : ''}
          </div>
        </div>
        
        <table class="items-table">
          <thead>
            <tr>
              <th>ردیف</th>
              <th>نام کالا</th>
              <th>تعداد</th>
              <th>قیمت واحد (تومان)</th>
              <th>مبلغ کل (تومان)</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items?.map((item: any, index: number) => `
              <tr>
                <td>${formatNumber(index + 1)}</td>
                <td>${item.product?.name}</td>
                <td>${formatNumber(item.quantity)}</td>
                <td>${formatPrice(item.price)}</td>
                <td>${formatPrice(item.total)}</td>
              </tr>
            `).join('') || ''}
          </tbody>
        </table>
        
        <div class="totals">
          <div class="totals-grid">
            <div></div>
            <div>
              <div class="total-item">
                <span>جمع کل:</span>
                <span>${formatPrice(invoice.subtotal)} تومان</span>
              </div>
              ${parseFloat(invoice.discountAmount || '0') > 0 ? `
              <div class="total-item">
                <span>تخفیف:</span>
                <span>${formatPrice(invoice.discountAmount)} تومان</span>
              </div>
              ` : ''}
              <div class="total-item final">
                <span>مبلغ نهایی:</span>
                <span>${formatPrice(invoice.total)} تومان</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="signature">
          <div class="signature-line"></div>
          <div>مهر و امضای فروشنده</div>
        </div>
      </div>
      
      <script>
        window.onload = function() {
          window.print();
          window.onafterprint = function() {
            window.close();
          };
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(content);
  printWindow.document.close();
}
