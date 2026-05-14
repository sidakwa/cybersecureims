import React from 'react';

interface PageHeaderProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
}

export default function PageHeader({ title, description, icon, actions }: PageHeaderProps) {
  return (
    <div className="bg-blue-50 rounded-lg p-6 mb-6">
      <div className="flex justify-between items-start">
        <div className="flex items-start gap-4">
          {icon && <div className="text-blue-600 mt-1">{icon}</div>}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            <p className="text-gray-600 mt-1">{description}</p>
          </div>
        </div>
        {actions && <div>{actions}</div>}
      </div>
    </div>
  );
}
