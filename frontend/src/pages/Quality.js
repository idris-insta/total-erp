import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Shield } from 'lucide-react';

const Quality = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 font-manrope" data-testid="quality-title">Quality Control</h1>
        <p className="text-slate-600 mt-1 font-inter">QC inspections, batch tracking, and compliance</p>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <CardTitle className="font-manrope">Quality Management</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600 font-inter">Quality module - QC inspections, Batch traceability, Customer complaints</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Quality;