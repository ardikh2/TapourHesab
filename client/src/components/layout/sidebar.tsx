import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  Calculator, 
  LayoutDashboard, 
  Package, 
  Users, 
  FileText, 
  FileEdit, 
  BarChart3,
  Database,
  User
} from "lucide-react";

const navigation = [
  { name: "داشبورد", href: "/dashboard", icon: LayoutDashboard },
  { name: "مدیریت کالا", href: "/products", icon: Package },
  { name: "مدیریت مشتری", href: "/customers", icon: Users },
  { name: "صدور فاکتور", href: "/invoices", icon: FileText },
  { name: "پیش‌فاکتور", href: "/pre-invoices", icon: FileEdit },
  { name: "گزارش‌گیری", href: "/reports", icon: BarChart3 },
  { name: "پشتیبان‌گیری", href: "/backup", icon: Database },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="w-64 bg-white shadow-lg border-l border-gray-200 flex flex-col">
      {/* Logo Section */}
      <div className="p-6 border-b border-gray-100">
        <h1 className="text-2xl font-bold text-primary flex items-center">
          <Calculator className="ml-3 text-secondary" size={28} />
          سیستم حسابداری تپور
        </h1>
      </div>
      
      {/* Navigation Menu */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const isActive = location === item.href || (location === "/" && item.href === "/dashboard");
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center p-3 rounded-lg transition-colors",
                    isActive
                      ? "bg-primary text-white"
                      : "text-neutral hover:bg-gray-100"
                  )}
                >
                  <item.icon className="ml-3" size={20} />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      
      {/* User Section */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center p-3 rounded-lg bg-gray-50">
          <User className="text-2xl text-primary ml-3" size={32} />
          <div>
            <p className="font-medium text-neutral">مدیر سیستم</p>
            <p className="text-sm text-gray-500">ادمین</p>
          </div>
        </div>
      </div>
    </div>
  );
}
