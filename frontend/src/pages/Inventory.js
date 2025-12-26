import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, Package, AlertTriangle, TrendingDown, Warehouse, ArrowRightLeft, Box } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import api from '../lib/api';
import { toast } from 'sonner';

const InventoryOverview = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalItems: 0, totalStock: 0, lowStock: 0, transfers: 0 });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [itemsRes, stockRes, lowStockRes, transfersRes] = await Promise.all([
        api.get('/inventory/items'),
        api.get('/inventory/stock'),
        api.get('/inventory/stock/low-stock'),
        api.get('/inventory/transfers')
      ]);
      setStats({
        totalItems: itemsRes.data.length,
        totalStock: stockRes.data.reduce((sum, s) => sum + s.quantity, 0),
        lowStock: lowStockRes.data.length,
        transfers: transfersRes.data.filter(t => t.status === 'pending').length
      });
    } catch (error) {
      console.error('Failed to load stats', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 font-manrope">Inventory Overview</h2>
        <p className="text-slate-600 mt-1 font-inter">Multi-location stock management</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={() => navigate('/inventory/items')}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Box className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-base font-manrope">Total Items</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 font-manrope">{stats.totalItems}</div>
            <p className="text-sm text-slate-500 mt-1 font-inter">Item master</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={() => navigate('/inventory/stock')}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-green-600" />
              <CardTitle className="text-base font-manrope">Total Stock</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 font-manrope">{Math.round(stats.totalStock)}</div>
            <p className="text-sm text-slate-500 mt-1 font-inter">All locations</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={() => navigate('/inventory/stock')}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <CardTitle className="text-base font-manrope">Low Stock</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600 font-manrope">{stats.lowStock}</div>
            <p className="text-sm text-slate-500 mt-1 font-inter">Need reorder</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={() => navigate('/inventory/transfers')}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-base font-manrope">Pending Transfers</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600 font-manrope">{stats.transfers}</div>
            <p className="text-sm text-slate-500 mt-1 font-inter">BWD ↔ SGM</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="font-manrope">Stock by Location</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Warehouse className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-semibold text-slate-900 font-inter">BWD Warehouse</p>
                    <p className="text-sm text-slate-600 font-inter">Base warehouse & dispatch</p>
                  </div>
                </div>
                <div className="text-xl font-bold text-blue-600 font-manrope">Active</div>
              </div>
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Warehouse className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="font-semibold text-slate-900 font-inter">SGM Factory</p>
                    <p className="text-sm text-slate-600 font-inter">Production facility</p>
                  </div>
                </div>
                <div className="text-xl font-bold text-orange-600 font-manrope">Active</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="font-manrope">Item Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 border-b border-slate-100">
                <span className="text-sm font-inter text-slate-700">Raw Materials (RM)</span>
                <Badge className="bg-blue-100 text-blue-800 font-inter">Active</Badge>
              </div>
              <div className="flex items-center justify-between p-2 border-b border-slate-100">
                <span className="text-sm font-inter text-slate-700">Semi-Finished Goods (SFG)</span>
                <Badge className="bg-yellow-100 text-yellow-800 font-inter">Active</Badge>
              </div>
              <div className="flex items-center justify-between p-2 border-b border-slate-100">
                <span className="text-sm font-inter text-slate-700">Finished Goods (FG)</span>
                <Badge className="bg-green-100 text-green-800 font-inter">Active</Badge>
              </div>
              <div className="flex items-center justify-between p-2">
                <span className="text-sm font-inter text-slate-700">Packaging Materials</span>
                <Badge className="bg-purple-100 text-purple-800 font-inter">Active</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const ItemsList = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    item_code: '', item_name: '', category: 'RM', item_type: 'BOPP Tape',
    uom: 'Rolls', secondary_uom: 'SQM', thickness: '', width: '', length: '',
    color: '', adhesive_type: '', reorder_level: '10', safety_stock: '5'
  });

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    try {
      const response = await api.get('/inventory/items');
      setItems(response.data);
    } catch (error) {
      toast.error('Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.put(`/inventory/items/${editingItem.id}`, formData);
        toast.success('Item updated');
      } else {
        await api.post('/inventory/items', formData);
        toast.success('Item created');
      }
      setOpen(false);
      setEditingItem(null);
      fetchItems();
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save item');
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      item_code: item.item_code,
      item_name: item.item_name,
      category: item.category,
      item_type: item.item_type,
      uom: item.uom,
      secondary_uom: item.secondary_uom || '',
      thickness: item.thickness?.toString() || '',
      width: item.width?.toString() || '',
      length: item.length?.toString() || '',
      color: item.color || '',
      adhesive_type: item.adhesive_type || '',
      reorder_level: item.reorder_level?.toString() || '10',
      safety_stock: item.safety_stock?.toString() || '5'
    });
    setOpen(true);
  };

  const handleDelete = async (itemId) => {
    if (!confirm('Delete this item?')) return;
    try {
      await api.delete(`/inventory/items/${itemId}`);
      toast.success('Item deleted');
      fetchItems();
    } catch (error) {
      toast.error('Failed to delete item');
    }
  };

  const resetForm = () => {
    setFormData({
      item_code: '', item_name: '', category: 'RM', item_type: 'BOPP Tape',
      uom: 'Rolls', secondary_uom: 'SQM', thickness: '', width: '', length: '',
      color: '', adhesive_type: '', reorder_level: '10', safety_stock: '5'
    });
  };

  const filteredItems = items.filter(item => 
    item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.item_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="flex items-center justify-center h-96"><div className="animate-spin h-12 w-12 border-4 border-accent border-t-transparent rounded-full"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 font-manrope">Item Master</h2>
          <p className="text-slate-600 mt-1 font-inter">{items.length} total items</p>
        </div>
        <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) { setEditingItem(null); resetForm(); } }}>
          <DialogTrigger asChild>
            <Button className="bg-accent hover:bg-accent/90 font-inter"><Plus className="h-4 w-4 mr-2" />Add Item</Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-manrope">{editingItem ? 'Edit' : 'Create'} Item</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="font-inter">Item Code *</Label>
                  <Input value={formData.item_code} onChange={(e) => setFormData({...formData, item_code: e.target.value})} placeholder="IT-001" required />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label className="font-inter">Item Name *</Label>
                  <Input value={formData.item_name} onChange={(e) => setFormData({...formData, item_name: e.target.value})} placeholder="BOPP Tape 48mm" required />
                </div>
                <div className="space-y-2">
                  <Label className="font-inter">Category *</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RM">Raw Material (RM)</SelectItem>
                      <SelectItem value="SFG">Semi-Finished (SFG)</SelectItem>
                      <SelectItem value="FG">Finished Goods (FG)</SelectItem>
                      <SelectItem value="Packaging">Packaging</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 col-span-2">
                  <Label className="font-inter">Item Type *</Label>
                  <Select value={formData.item_type} onValueChange={(value) => setFormData({...formData, item_type: value})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BOPP Tape">BOPP Tape</SelectItem>
                      <SelectItem value="Masking Tape">Masking Tape</SelectItem>
                      <SelectItem value="Double Sided Tape">Double Sided Tape</SelectItem>
                      <SelectItem value="Cloth Tape">Cloth Tape</SelectItem>
                      <SelectItem value="PVC Tape">PVC Tape</SelectItem>
                      <SelectItem value="Foam Tape">Foam Tape</SelectItem>
                      <SelectItem value="Jumbo Roll">Jumbo Roll</SelectItem>
                      <SelectItem value="Core">Core</SelectItem>
                      <SelectItem value="Carton">Carton</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="font-inter">Primary UOM *</Label>
                  <Select value={formData.uom} onValueChange={(value) => setFormData({...formData, uom: value})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Rolls">Rolls</SelectItem>
                      <SelectItem value="SQM">SQM</SelectItem>
                      <SelectItem value="KG">KG</SelectItem>
                      <SelectItem value="PCS">PCS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="font-inter">Secondary UOM</Label>
                  <Select value={formData.secondary_uom} onValueChange={(value) => setFormData({...formData, secondary_uom: value})}>
                    <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SQM">SQM</SelectItem>
                      <SelectItem value="Meters">Meters</SelectItem>
                      <SelectItem value="KG">KG</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="font-inter">Thickness (micron)</Label>
                  <Input type="number" step="0.1" value={formData.thickness} onChange={(e) => setFormData({...formData, thickness: e.target.value})} placeholder="40" />
                </div>
                <div className="space-y-2">
                  <Label className="font-inter">Width (mm)</Label>
                  <Input type="number" value={formData.width} onChange={(e) => setFormData({...formData, width: e.target.value})} placeholder="48" />
                </div>
                <div className="space-y-2">
                  <Label className="font-inter">Length (m)</Label>
                  <Input type="number" value={formData.length} onChange={(e) => setFormData({...formData, length: e.target.value})} placeholder="100" />
                </div>
                <div className="space-y-2">
                  <Label className="font-inter">Color</Label>
                  <Input value={formData.color} onChange={(e) => setFormData({...formData, color: e.target.value})} placeholder="Transparent, Brown" />
                </div>
                <div className="space-y-2">
                  <Label className="font-inter">Adhesive Type</Label>
                  <Select value={formData.adhesive_type} onValueChange={(value) => setFormData({...formData, adhesive_type: value})}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Acrylic">Acrylic</SelectItem>
                      <SelectItem value="Hotmelt">Hotmelt</SelectItem>
                      <SelectItem value="Rubber">Rubber</SelectItem>
                      <SelectItem value="Solvent">Solvent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="font-inter">Reorder Level *</Label>
                  <Input type="number" value={formData.reorder_level} onChange={(e) => setFormData({...formData, reorder_level: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label className="font-inter">Safety Stock *</Label>
                  <Input type="number" value={formData.safety_stock} onChange={(e) => setFormData({...formData, safety_stock: e.target.value})} required />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => { setOpen(false); setEditingItem(null); resetForm(); }}>Cancel</Button>
                <Button type="submit" className="bg-accent hover:bg-accent/90">{editingItem ? 'Update' : 'Create'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input placeholder="Search items..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase font-inter">Code</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase font-inter">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase font-inter">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase font-inter">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase font-inter">Specs</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase font-inter">UOM</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase font-inter">Reorder</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase font-inter">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.length === 0 ? (
                  <tr><td colSpan="8" className="px-4 py-12 text-center text-slate-500 font-inter">
                    {searchTerm ? 'No items found' : 'No items yet. Click "Add Item" to create one.'}
                  </td></tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-sm font-semibold text-slate-900">{item.item_code}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900 font-inter">{item.item_name}</div>
                        <div className="text-sm text-slate-500 font-inter">{item.color || '-'}</div>
                      </td>
                      <td className="px-4 py-3"><Badge className={`font-inter ${
                        item.category === 'RM' ? 'bg-blue-100 text-blue-800' :
                        item.category === 'SFG' ? 'bg-yellow-100 text-yellow-800' :
                        item.category === 'FG' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
                      }`}>{item.category}</Badge></td>
                      <td className="px-4 py-3 text-sm text-slate-600 font-inter">{item.item_type}</td>
                      <td className="px-4 py-3 text-sm text-slate-600 font-mono">
                        {item.thickness && `${item.thickness}µ`}
                        {item.width && ` × ${item.width}mm`}
                        {item.length && ` × ${item.length}m`}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="font-inter">{item.uom}</Badge>
                        {item.secondary_uom && <Badge variant="outline" className="ml-1 font-inter text-xs">{item.secondary_uom}</Badge>}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-slate-600">{item.reorder_level}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const Inventory = () => {
  return (
    <Routes>
      <Route index element={<InventoryOverview />} />
      <Route path="items" element={<ItemsList />} />
      <Route path="stock" element={<div className="p-6"><Card><CardContent className="p-12 text-center"><Package className="h-12 w-12 text-slate-400 mx-auto mb-4" /><p className="text-slate-600 font-inter">Stock tracking - Building now...</p></CardContent></Card></div>} />
      <Route path="transfers" element={<div className="p-6"><Card><CardContent className="p-12 text-center"><ArrowRightLeft className="h-12 w-12 text-slate-400 mx-auto mb-4" /><p className="text-slate-600 font-inter">Stock transfers - Building now...</p></CardContent></Card></div>} />
    </Routes>
  );
};

export default Inventory;