import { Badge } from '@/components/ui/badge';
import { Shield, Eye, ClipboardCheck, Users } from 'lucide-react';

interface RoleBadgeProps {
  role: string;
  showIcon?: boolean;
}

export function RoleBadge({ role, showIcon = true }: RoleBadgeProps) {
  const getRoleConfig = () => {
    switch (role) {
      case 'admin':
        return { 
          label: 'Administrator', 
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: <Shield className="h-3 w-3 mr-1" />
        };
      case 'quality_manager':
        return { 
          label: 'Quality Manager', 
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: <ClipboardCheck className="h-3 w-3 mr-1" />
        };
      case 'auditor':
        return { 
          label: 'Auditor', 
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: <Eye className="h-3 w-3 mr-1" />
        };
      default:
        return { 
          label: 'Viewer', 
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: <Users className="h-3 w-3 mr-1" />
        };
    }
  };

  const config = getRoleConfig();

  return (
    <Badge variant="outline" className={`${config.color} font-normal`}>
      {showIcon && config.icon}
      {config.label}
    </Badge>
  );
}
