/**
 * Security Training — /inventory/training
 * STRAT-PORTAL-008 §4.10
 *
 * Parked pending LMS integration (target Q4 2026).
 * Renders placeholder per STRAT-PORTAL-F01 §4.3.
 */
import React from 'react';
import { GraduationCap, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import PageHeader from '@/components/PageHeader';

export default function SecurityTrainingPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <PageHeader title="Security Training" />
      <Card className="mt-6">
        <CardContent className="flex flex-col items-center text-center py-16 gap-4">
          <div className="rounded-full bg-blue-50 p-5">
            <GraduationCap className="h-10 w-10 text-blue-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-700">Coming in Q4 2026</h2>
          <p className="text-sm text-gray-500 max-w-sm leading-relaxed">
            Security Training records will be available here once the HR Learning Management System
            integration is in scope. Training data will include completion status, certification dates,
            and training coverage by role.
          </p>
          <div className="flex items-center gap-2 text-xs text-gray-400 mt-2">
            <Clock className="h-3.5 w-3.5" />
            <span>Dependency: LMS owner and integration timeline TBD (STRAT-PORTAL-008 §4.10)</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
