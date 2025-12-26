import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import api from '../lib/api';
import { toast } from 'sonner';
import { Package, AlertTriangle, TrendingDown, Warehouse } from 'lucide-react';

const Inventory = () => {
  const [stock, setStock] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const fetchInventoryData = async () => {
    try {
      const [stockRes, lowStockRes] = await Promise.all([
        api.get('/inventory/stock'),
        api.get('/inventory/stock/low-stock')
      ]);
      setStock(stockRes.data);
      setLowStock(lowStockRes.data);
    } catch (error) {
      toast.error('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96"><div className="animate-spin h-12 w-12 border-4 border-accent border-t-transparent rounded-full"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 font-manrope" data-testid="inventory-title">Inventory Management</h1>
        <p className="text-slate-600 mt-1 font-inter">Track stock levels across all locations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-base font-manrope">Total Items</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900 font-manrope">{stock.length}</div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <CardTitle className="text-base font-manrope">Low Stock</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600 font-manrope">{lowStock.length}</div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Warehouse className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-base font-manrope">Locations</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600 font-manrope">2</div>
            <p className="text-sm text-slate-500 mt-1 font-inter">BWD + SGM</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="bg-white border border-slate-200">
          <TabsTrigger value="all" className="font-inter" data-testid="tab-all-stock">All Stock</TabsTrigger>
          <TabsTrigger value="low" className="font-inter" data-testid="tab-low-stock">Low Stock</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider font-inter">Item ID</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider font-inter">Location</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider font-inter">Quantity</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider font-inter">UOM</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider font-inter">Last Updated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stock.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors" data-testid="stock-row">
                        <td className="px-4 py-3 text-sm font-mono text-slate-900">{item.item_id.slice(0, 8)}</td>
                        <td className="px-4 py-3">
                          <Badge className="bg-blue-100 text-blue-800 font-inter">{item.location}</Badge>
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-slate-900 font-mono">{item.quantity}</td>
                        <td className="px-4 py-3 text-sm text-slate-600 font-inter">{item.uom}</td>
                        <td className="px-4 py-3 text-sm text-slate-500 font-mono">{new Date(item.last_updated).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="low">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="font-manrope flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                Low Stock Items - Reorder Required
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-orange-50 border-b border-orange-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-orange-800 uppercase tracking-wider font-inter">Item</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-orange-800 uppercase tracking-wider font-inter">Location</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-orange-800 uppercase tracking-wider font-inter">Current</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-orange-800 uppercase tracking-wider font-inter">Reorder Level</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-orange-800 uppercase tracking-wider font-inter">Shortage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-orange-100">
                    {lowStock.map((item, idx) => (
                      <tr key={idx} className="hover:bg-orange-50/50 transition-colors" data-testid="low-stock-row">
                        <td className="px-4 py-3 text-sm font-mono text-slate-900">{item.item_id?.slice(0, 8)}</td>
                        <td className="px-4 py-3">
                          <Badge className="bg-orange-100 text-orange-800 font-inter">{item.location}</Badge>
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-orange-600 font-mono">{item.quantity}</td>
                        <td className="px-4 py-3 text-sm text-slate-600 font-mono">{item.item_details?.reorder_level}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-destructive font-mono">
                          {item.item_details?.reorder_level - item.quantity}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Inventory;