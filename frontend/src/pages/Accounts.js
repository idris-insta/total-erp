import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Calculator } from 'lucide-react';

const Accounts = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 font-manrope" data-testid="accounts-title">Accounts & Finance</h1>
        <p className="text-slate-600 mt-1 font-inter">Manage invoices, payments, and financial reports</p>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-green-600" />
            <CardTitle className="font-manrope">Financial Overview</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600 font-inter">Accounts module - Invoicing, AR/AP, GST compliance, P&L reports</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Accounts;