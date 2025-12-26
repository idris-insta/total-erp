import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Users } from 'lucide-react';

const HRMS = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 font-manrope" data-testid="hrms-title">Human Resources</h1>
        <p className="text-slate-600 mt-1 font-inter">Manage employees, attendance, and payroll</p>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-600" />
            <CardTitle className="font-manrope">Employee Management</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600 font-inter">HRMS module - Attendance, Leave requests, Payroll processing</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default HRMS;