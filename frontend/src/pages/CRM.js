import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { Plus, Users, FileText, Package as PackageIcon, Beaker } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import api from '../lib/api';
import { toast } from 'sonner';

const LeadsList = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    company_name: '',
    contact_person: '',
    email: '',
    phone: '',
    source: '',
    product_interest: '',
    notes: ''
  });

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const response = await api.get('/crm/leads');
      setLeads(response.data);
    } catch (error) {
      toast.error('Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/crm/leads', formData);
      toast.success('Lead created successfully');
      setOpen(false);
      fetchLeads();
      setFormData({ company_name: '', contact_person: '', email: '', phone: '', source: '', product_interest: '', notes: '' });
    } catch (error) {
      toast.error('Failed to create lead');
    }
  };

  const getSourceBadge = (source) => {
    const colors = {
      'IndiaMART': 'bg-blue-100 text-blue-800',
      'Google': 'bg-green-100 text-green-800',
      'Exhibition': 'bg-purple-100 text-purple-800',
      'Referral': 'bg-orange-100 text-orange-800'
    };
    return colors[source] || 'bg-gray-100 text-gray-800';
  };

  const getStatusBadge = (status) => {
    const colors = {
      'new': 'bg-blue-100 text-blue-800',
      'contacted': 'bg-yellow-100 text-yellow-800',
      'qualified': 'bg-green-100 text-green-800',
      'converted': 'bg-purple-100 text-purple-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96"><div className="animate-spin h-12 w-12 border-4 border-accent border-t-transparent rounded-full"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 font-manrope" data-testid="leads-title">Leads Management</h2>
          <p className="text-slate-600 mt-1 font-inter">Track and manage your sales leads</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-accent hover:bg-accent/90 font-inter" data-testid="add-lead-button">
              <Plus className="h-4 w-4 mr-2" />
              Add Lead
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="font-manrope">Create New Lead</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company_name" className="font-inter">Company Name</Label>
                  <Input id="company_name" value={formData.company_name} onChange={(e) => setFormData({...formData, company_name: e.target.value})} required data-testid="company-name-input" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_person" className="font-inter">Contact Person</Label>
                  <Input id="contact_person" value={formData.contact_person} onChange={(e) => setFormData({...formData, contact_person: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="font-inter">Email</Label>
                  <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="font-inter">Phone</Label>
                  <Input id="phone" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="source" className="font-inter">Source</Label>
                  <Select value={formData.source} onValueChange={(value) => setFormData({...formData, source: value})} required>
                    <SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IndiaMART">IndiaMART</SelectItem>
                      <SelectItem value="Google">Google</SelectItem>
                      <SelectItem value="Exhibition">Exhibition</SelectItem>
                      <SelectItem value="Cold Call">Cold Call</SelectItem>
                      <SelectItem value="Referral">Referral</SelectItem>
                      <SelectItem value="Website">Website</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="product_interest" className="font-inter">Product Interest</Label>
                  <Input id="product_interest" value={formData.product_interest} onChange={(e) => setFormData({...formData, product_interest: e.target.value})} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes" className="font-inter">Notes</Label>
                <textarea id="notes" className="w-full min-h-[80px] px-3 py-2 border border-slate-200 rounded-md" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-accent hover:bg-accent/90" data-testid="submit-lead-button">Create Lead</Button>
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
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider font-inter">Company</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider font-inter">Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider font-inter">Source</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider font-inter">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider font-inter">Product Interest</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider font-inter">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50 transition-colors" data-testid="lead-row">
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-semibold text-slate-900 font-inter">{lead.company_name}</div>
                        <div className="text-sm text-slate-500 font-inter">{lead.email}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="text-sm text-slate-900 font-inter">{lead.contact_person}</div>
                        <div className="text-sm text-slate-500 font-mono">{lead.phone}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={`${getSourceBadge(lead.source)} font-inter`}>{lead.source}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={`${getStatusBadge(lead.status)} font-inter`}>{lead.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 font-inter">{lead.product_interest || '-'}</td>
                    <td className="px-4 py-3 text-sm text-slate-500 font-mono">{new Date(lead.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const CRM = () => {
  return (
    <div className="space-y-6">
      <Routes>
        <Route index element={<LeadsList />} />
        <Route path="leads" element={<LeadsList />} />
      </Routes>
    </div>
  );
};

export default CRM;