import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ShoppingCart } from 'lucide-react';

const Procurement = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 font-manrope" data-testid="procurement-title">Procurement</h1>
        <p className="text-slate-600 mt-1 font-inter">Manage suppliers and purchase orders</p>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-blue-600" />
            <CardTitle className="font-manrope">Purchase Orders</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600 font-inter">Procurement module - Local & Import POs, Supplier management, GRN processing</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Procurement;