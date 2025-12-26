import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, Factory, Clock, CheckCircle, AlertCircle, Cpu, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import api from '../lib/api';
import { toast } from 'sonner';

const ProductionOverview = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, planned: 0, inProgress: 0, completed: 0 });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/production/work-orders');
      const wos = response.data;
      setStats({
        total: wos.length,
        planned: wos.filter(w => w.status === 'planned').length,
        inProgress: wos.filter(w => w.status === 'in_progress').length,
        completed: wos.filter(w => w.status === 'completed').length
      });
    } catch (error) {
      console.error('Failed to load stats', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 font-manrope">Production Management</h2>
        <p className="text-slate-600 mt-1 font-inter">Work orders, machines & batch tracking</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={() => navigate('/production/work-orders')}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Factory className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-base font-manrope">Total WOs</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600 font-manrope">{stats.total}</div>
            <p className="text-sm text-slate-500 mt-1 font-inter">Work orders</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-base font-manrope">Planned</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 font-manrope">{stats.planned}</div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <CardTitle className="text-base font-manrope">In Progress</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600 font-manrope">{stats.inProgress}</div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-success" />
              <CardTitle className="text-base font-manrope">Completed</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success font-manrope">{stats.completed}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="font-manrope">Machine Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {['SLIT-001', 'SLIT-002', 'CL1', 'CL2', 'RW-001'].map((machine) => (
              <div key={machine} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-slate-400" />
                  <span className="font-mono text-sm font-semibold text-slate-900">{machine}</span>
                </div>
                <Badge className="bg-green-100 text-green-800 font-inter">Active</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const WorkOrdersList = () => {
  const [workOrders, setWorkOrders] = useState([]);
  const [items, setItems] = useState([]);
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    item_id: '', quantity_to_make: '', machine_id: '',
    thickness: '', color: '', width: '', length: '', brand: '', priority: 'normal'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [wosRes, itemsRes, machinesRes] = await Promise.all([
        api.get('/production/work-orders'),
        api.get('/inventory/items'),
        api.get('/production/machines')
      ]);
      setWorkOrders(wosRes.data);
      setItems(itemsRes.data);
      setMachines(machinesRes.data);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/production/work-orders', formData);
      toast.success('Work order created');
      setOpen(false);
      fetchData();
      resetForm();
    } catch (error) {
      toast.error('Failed to create work order');
    }
  };

  const handleStartWO = async (woId) => {
    try {
      await api.put(`/production/work-orders/${woId}/start`);
      toast.success('Work order started');
      fetchData();
    } catch (error) {
      toast.error('Failed to start work order');
    }
  };

  const resetForm = () => {
    setFormData({
      item_id: '', quantity_to_make: '', machine_id: '',
      thickness: '', color: '', width: '', length: '', brand: '', priority: 'normal'
    });
  };

  if (loading) return <div className="flex items-center justify-center h-96"><div className="animate-spin h-12 w-12 border-4 border-accent border-t-transparent rounded-full"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 font-manrope">Work Orders</h2>
          <p className="text-slate-600 mt-1 font-inter">{workOrders.length} total orders</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-accent hover:bg-accent/90 font-inter"><Plus className="h-4 w-4 mr-2" />Create WO</Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="font-manrope">Create Work Order</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-inter">Item *</Label>
                  <Select value={formData.item_id} onValueChange={(value) => setFormData({...formData, item_id: value})} required>
                    <SelectTrigger><SelectValue placeholder="Select item" /></SelectTrigger>
                    <SelectContent>
                      {items.filter(i => i.category === 'FG').map(item => (
                        <SelectItem key={item.id} value={item.id}>{item.item_code} - {item.item_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="font-inter">Quantity to Make *</Label>
                  <Input type="number" value={formData.quantity_to_make} onChange={(e) => setFormData({...formData, quantity_to_make: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label className="font-inter">Machine *</Label>
                  <Select value={formData.machine_id} onValueChange={(value) => setFormData({...formData, machine_id: value})} required>
                    <SelectTrigger><SelectValue placeholder="Select machine" /></SelectTrigger>
                    <SelectContent>
                      {machines.map(machine => (
                        <SelectItem key={machine.id} value={machine.id}>{machine.machine_code} - {machine.machine_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="font-inter">Priority</Label>
                  <Select value={formData.priority} onValueChange={(value) => setFormData({...formData, priority: value})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="font-inter">Thickness (micron)</Label>
                  <Input type="number" step="0.1" value={formData.thickness} onChange={(e) => setFormData({...formData, thickness: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="font-inter">Color</Label>
                  <Input value={formData.color} onChange={(e) => setFormData({...formData, color: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="font-inter">Width (mm)</Label>
                  <Input type="number" value={formData.width} onChange={(e) => setFormData({...formData, width: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="font-inter">Length (m)</Label>
                  <Input type="number" value={formData.length} onChange={(e) => setFormData({...formData, length: e.target.value})} />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label className="font-inter">Brand</Label>
                  <Input value={formData.brand} onChange={(e) => setFormData({...formData, brand: e.target.value})} placeholder="Optional" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => { setOpen(false); resetForm(); }}>Cancel</Button>
                <Button type="submit" className="bg-accent hover:bg-accent/90">Create</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase font-inter">WO Number</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase font-inter">Item</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase font-inter">Machine</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase font-inter">Target Qty</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase font-inter">Made</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase font-inter">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase font-inter">Priority</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase font-inter">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {workOrders.length === 0 ? (
                  <tr><td colSpan="8" className="px-4 py-12 text-center text-slate-500 font-inter">
                    No work orders yet. Click "Create WO" to start production.
                  </td></tr>
                ) : (
                  workOrders.map((wo) => {
                    const item = items.find(i => i.id === wo.item_id);
                    const machine = machines.find(m => m.id === wo.machine_id);
                    return (
                      <tr key={wo.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-mono text-sm font-semibold text-slate-900">{wo.wo_number}</td>
                        <td className="px-4 py-3 text-sm text-slate-600 font-inter">{item?.item_name || wo.item_id.slice(0, 8)}</td>
                        <td className="px-4 py-3 font-mono text-sm text-slate-600">{machine?.machine_code || wo.machine_id.slice(0, 8)}</td>
                        <td className="px-4 py-3 font-mono text-sm font-semibold text-slate-900">{wo.quantity_to_make}</td>
                        <td className="px-4 py-3 font-mono text-sm font-semibold text-blue-600">{wo.quantity_made}</td>
                        <td className="px-4 py-3"><Badge className={`font-inter ${
                          wo.status === 'planned' ? 'bg-blue-100 text-blue-800' :
                          wo.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>{wo.status.replace('_', ' ')}</Badge></td>
                        <td className="px-4 py-3"><Badge className={`font-inter ${
                          wo.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                          wo.priority === 'high' ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'
                        }`}>{wo.priority}</Badge></td>
                        <td className="px-4 py-3">
                          {wo.status === 'planned' && (
                            <Button variant="ghost" size="sm" onClick={() => handleStartWO(wo.id)} className="text-success">
                              <CheckCircle className="h-4 w-4 mr-1" /> Start
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const Production = () => {
  return (
    <Routes>
      <Route index element={<ProductionOverview />} />
      <Route path="work-orders" element={<WorkOrdersList />} />
      <Route path="machines" element={<div className="p-6"><Card><CardContent className="p-12 text-center"><Cpu className="h-12 w-12 text-slate-400 mx-auto mb-4" /><p className="text-slate-600 font-inter">Machine management - Building...</p></CardContent></Card></div>} />
    </Routes>
  );
};

export default Production;