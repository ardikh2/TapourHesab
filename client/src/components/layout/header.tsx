import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { getCurrentPersianDate } from "@/lib/persian-date";

interface HeaderProps {
  title: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function Header({ title, action }: HeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-neutral">{title}</h2>
        <div className="flex items-center space-x-4 space-x-reverse">
          <span className="text-sm text-gray-500">
            امروز: {getCurrentPersianDate()}
          </span>
          {action && (
            <Button onClick={action.onClick} className="bg-primary hover:bg-blue-700">
              <Plus className="ml-2" size={16} />
              {action.label}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
