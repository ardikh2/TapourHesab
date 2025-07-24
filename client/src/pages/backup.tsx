import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Download, Upload, Database, FileDown, FileUp, AlertTriangle, CheckCircle } from "lucide-react";
import { downloadBackup, parseBackupFile, importBackupData } from "@/lib/backup";
import { formatPersianDateTime } from "@/lib/persian-date";

export default function Backup() {
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const { toast } = useToast();

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await downloadBackup();
      toast({
        title: "موفق",
        description: "پشتیبان با موفقیت دانلود شد",
      });
    } catch (error) {
      toast({
        title: "خطا",
        description: "خطا در تهیه پشتیبان",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'application/json' || file.name.endsWith('.json')) {
        setImportFile(file);
      } else {
        toast({
          title: "خطا",
          description: "لطفا فایل JSON انتخاب کنید",
          variant: "destructive",
        });
      }
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      toast({
        title: "خطا",
        description: "لطفا فایل پشتیبان را انتخاب کنید",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    setImportProgress(0);

    try {
      // Parse backup file
      setImportProgress(20);
      const backupData = await parseBackupFile(importFile);
      
      setImportProgress(40);
      
      // Import data
      await importBackupData(backupData);
      
      setImportProgress(100);
      
      toast({
        title: "موفق",
        description: "اطلاعات با موفقیت بازیابی شد",
      });
      
      setImportFile(null);
      
      // Reload page to refresh data
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      toast({
        title: "خطا",
        description: error instanceof Error ? error.message : "خطا در بازیابی اطلاعات",
        variant: "destructive",
      });
      setImportProgress(0);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Database size={24} className="text-primary" />
        <h1 className="text-2xl font-bold">پشتیبان‌گیری و بازیابی</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Export Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileDown size={20} className="text-green-600" />
              تهیه پشتیبان
            </CardTitle>
            <CardDescription>
              دانلود کامل تمام اطلاعات سیستم شامل مشتریان، کالاها و فاکتورها
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <CheckCircle size={16} />
              <AlertDescription>
                فایل پشتیبان شامل تمام اطلاعات سیستم به فرمت JSON خواهد بود
              </AlertDescription>
            </Alert>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">شامل اطلاعات:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• تمام مشتریان</li>
                <li>• تمام کالاها</li>
                <li>• تمام فاکتورها و پیش‌فاکتورها</li>
                <li>• اقلام فاکتورها</li>
              </ul>
            </div>
            
            <div className="text-sm text-gray-500">
              تاریخ آخرین پشتیبان: {formatPersianDateTime()}
            </div>
            
            <Button 
              onClick={handleExport} 
              disabled={isExporting}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {isExporting ? (
                "در حال تهیه پشتیبان..."
              ) : (
                <>
                  <Download size={16} className="ml-2" />
                  دانلود پشتیبان
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Import Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileUp size={20} className="text-blue-600" />
              بازیابی اطلاعات
            </CardTitle>
            <CardDescription>
              بازگردانی اطلاعات از فایل پشتیبان قبلی
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-orange-200 bg-orange-50">
              <AlertTriangle size={16} className="text-orange-600" />
              <AlertDescription className="text-orange-800">
                توجه: این عملیات تمام اطلاعات موجود را جایگزین خواهد کرد
              </AlertDescription>
            </Alert>
            
            <div className="space-y-3">
              <Label htmlFor="backup-file">انتخاب فایل پشتیبان</Label>
              <Input
                id="backup-file"
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                disabled={isImporting}
              />
              {importFile && (
                <div className="text-sm text-gray-600">
                  فایل انتخاب شده: {importFile.name}
                </div>
              )}
            </div>
            
            {isImporting && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>در حال بازیابی...</span>
                  <span>{importProgress}%</span>
                </div>
                <Progress value={importProgress} />
              </div>
            )}
            
            <Button 
              onClick={handleImport} 
              disabled={!importFile || isImporting}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isImporting ? (
                "در حال بازیابی..."
              ) : (
                <>
                  <Upload size={16} className="ml-2" />
                  شروع بازیابی
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>راهنمای استفاده</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2 text-green-700">تهیه پشتیبان:</h4>
              <ol className="text-sm space-y-1 text-gray-600">
                <li>1. روی دکمه "دانلود پشتیبان" کلیک کنید</li>
                <li>2. فایل JSON به صورت خودکار دانلود می‌شود</li>
                <li>3. این فایل را در جای امنی ذخیره کنید</li>
              </ol>
            </div>
            <div>
              <h4 className="font-medium mb-2 text-blue-700">بازیابی اطلاعات:</h4>
              <ol className="text-sm space-y-1 text-gray-600">
                <li>1. فایل پشتیبان JSON را انتخاب کنید</li>
                <li>2. روی "شروع بازیابی" کلیک کنید</li>
                <li>3. منتظر تکمیل فرآیند بمانید</li>
                <li>4. صفحه به صورت خودکار بازنشانی می‌شود</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}