import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, Eye, FileText, Package as PackageIcon, Beaker, Users as UsersIcon, Building2, CheckCircle, Send } from 'lucide-react';
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

const CRMOverview = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ leads: 0, accounts: 0, quotations: 0, samples: 0 });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [leadsRes, accountsRes, quotesRes, samplesRes] = await Promise.all([
        api.get('/crm/leads'),
        api.get('/crm/accounts'),
        api.get('/crm/quotations'),
        api.get('/crm/samples')
      ]);
      setStats({
        leads: leadsRes.data.length,
        accounts: accountsRes.data.length,
        quotations: quotesRes.data.length,
        samples: samplesRes.data.length
      });
    } catch (error) {
      console.error('Failed to load stats', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 font-manrope">CRM Overview</h2>
        <p className="text-slate-600 mt-1 font-inter">Complete sales pipeline management</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={() => navigate('/crm/leads')}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <UsersIcon className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-base font-manrope">Leads</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 font-manrope">{stats.leads}</div>
            <p className="text-sm text-slate-500 mt-1 font-inter">Potential customers</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={() => navigate('/crm/accounts')}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-green-600" />
              <CardTitle className="text-base font-manrope">Accounts</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 font-manrope">{stats.accounts}</div>
            <p className="text-sm text-slate-500 mt-1 font-inter">Active customers</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={() => navigate('/crm/quotations')}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-base font-manrope">Quotations</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600 font-manrope">{stats.quotations}</div>
            <p className="text-sm text-slate-500 mt-1 font-inter">Quotes sent</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={() => navigate('/crm/samples')}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Beaker className="h-5 w-5 text-orange-600" />
              <CardTitle className="text-base font-manrope">Samples</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600 font-manrope">{stats.samples}</div>
            <p className="text-sm text-slate-500 mt-1 font-inter">Samples sent</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="font-manrope">Sales Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">1</div>
                <div>
                  <p className="font-semibold text-slate-900 font-inter">Lead Generation</p>
                  <p className="text-sm text-slate-600 font-inter">IndiaMART, TradeIndia, Website, etc.</p>
                </div>
              </div>
              <div className="text-2xl font-bold text-blue-600 font-manrope">{stats.leads}</div>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-600 flex items-center justify-center text-white font-bold">2</div>
                <div>
                  <p className="font-semibold text-slate-900 font-inter">Qualified Accounts</p>
                  <p className="text-sm text-slate-600 font-inter">Converted customers with GSTIN</p>
                </div>
              </div>
              <div className="text-2xl font-bold text-green-600 font-manrope">{stats.accounts}</div>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold">3</div>
                <div>
                  <p className="font-semibold text-slate-900 font-inter">Quotations Sent</p>
                  <p className="text-sm text-slate-600 font-inter">Pricing proposals with terms</p>
                </div>
              </div>
              <div className="text-2xl font-bold text-purple-600 font-manrope">{stats.quotations}</div>
            </div>
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-orange-600 flex items-center justify-center text-white font-bold">4</div>
                <div>
                  <p className="font-semibold text-slate-900 font-inter">Samples Dispatched</p>
                  <p className="text-sm text-slate-600 font-inter">Physical samples for approval</p>
                </div>
              </div>
              <div className="text-2xl font-bold text-orange-600 font-manrope">{stats.samples}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const LeadsList = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    company_name: '', contact_person: '', email: '', phone: '',
    source: 'IndiaMART', product_interest: '', notes: ''
  });

  useEffect(() => { fetchLeads(); }, []);

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
      if (editingLead) {
        await api.put(`/crm/leads/${editingLead.id}`, formData);
        toast.success('Lead updated successfully');
      } else {
        await api.post('/crm/leads', formData);
        toast.success('Lead created successfully');
      }
      setOpen(false);
      setEditingLead(null);
      fetchLeads();
      resetForm();
    } catch (error) {
      toast.error('Failed to save lead');
    }
  };

  const handleEdit = (lead) => {
    setEditingLead(lead);
    setFormData({
      company_name: lead.company_name,
      contact_person: lead.contact_person,
      email: lead.email,
      phone: lead.phone,
      source: lead.source,
      product_interest: lead.product_interest || '',
      notes: lead.notes || ''
    });
    setOpen(true);
  };

  const handleDelete = async (leadId) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;
    try {
      await api.delete(`/crm/leads/${leadId}`);
      toast.success('Lead deleted');
      fetchLeads();
    } catch (error) {
      toast.error('Failed to delete lead');
    }
  };

  const resetForm = () => {
    setFormData({ company_name: '', contact_person: '', email: '', phone: '', source: 'IndiaMART', product_interest: '', notes: '' });
  };

  const filteredLeads = leads.filter(lead => 
    lead.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.contact_person.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="flex items-center justify-center h-96"><div className="animate-spin h-12 w-12 border-4 border-accent border-t-transparent rounded-full"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 font-manrope">Leads Management</h2>
          <p className="text-slate-600 mt-1 font-inter">{leads.length} total leads</p>
        </div>
        <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) { setEditingLead(null); resetForm(); } }}>
          <DialogTrigger asChild>
            <Button className="bg-accent hover:bg-accent/90 font-inter" data-testid="add-lead-button">
              <Plus className="h-4 w-4 mr-2" />Add Lead
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-manrope">{editingLead ? 'Edit Lead' : 'Create New Lead'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company_name" className="font-inter">Company Name *</Label>
                  <Input id="company_name" value={formData.company_name} onChange={(e) => setFormData({...formData, company_name: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_person" className="font-inter">Contact Person *</Label>
                  <Input id="contact_person" value={formData.contact_person} onChange={(e) => setFormData({...formData, contact_person: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="font-inter">Email *</Label>
                  <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="font-inter">Phone *</Label>
                  <Input id="phone" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="source" className="font-inter">Source *</Label>
                  <Select value={formData.source} onValueChange={(value) => setFormData({...formData, source: value})} required>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IndiaMART">IndiaMART</SelectItem>
                      <SelectItem value="TradeIndia">TradeIndia</SelectItem>
                      <SelectItem value="Alibaba">Alibaba</SelectItem>
                      <SelectItem value="Google">Google Search</SelectItem>
                      <SelectItem value="Exhibition">Exhibition</SelectItem>
                      <SelectItem value="Cold Call">Cold Call</SelectItem>
                      <SelectItem value="Referral">Referral</SelectItem>
                      <SelectItem value="Website">Website</SelectItem>
                      <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="product_interest" className="font-inter">Product Interest</Label>
                  <Input id="product_interest" value={formData.product_interest} onChange={(e) => setFormData({...formData, product_interest: e.target.value})} placeholder="BOPP Tape, Masking Tape, etc." />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes" className="font-inter">Notes</Label>
                <textarea id="notes" className="w-full min-h-[100px] px-3 py-2 border border-slate-200 rounded-md font-inter" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} placeholder="Additional information..." />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => { setOpen(false); setEditingLead(null); resetForm(); }}>Cancel</Button>
                <Button type="submit" className="bg-accent hover:bg-accent/90">{editingLead ? 'Update' : 'Create'} Lead</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input placeholder="Search leads..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase font-inter">Company</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase font-inter">Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase font-inter">Source</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase font-inter">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase font-inter">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase font-inter">Created</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase font-inter">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLeads.length === 0 ? (
                  <tr><td colSpan="7" className="px-4 py-12 text-center text-slate-500 font-inter">
                    {searchTerm ? 'No leads found' : 'No leads yet. Click "Add Lead" to create your first lead.'}
                  </td></tr>
                ) : (
                  filteredLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900 font-inter">{lead.company_name}</div>
                        <div className="text-sm text-slate-500 font-inter">{lead.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-slate-900 font-inter">{lead.contact_person}</div>
                        <div className="text-sm text-slate-500 font-mono">{lead.phone}</div>
                      </td>
                      <td className="px-4 py-3"><Badge className="bg-blue-100 text-blue-800 font-inter">{lead.source}</Badge></td>
                      <td className="px-4 py-3"><Badge className={`font-inter ${
                        lead.status === 'new' ? 'bg-blue-100 text-blue-800' :
                        lead.status === 'contacted' ? 'bg-yellow-100 text-yellow-800' :
                        lead.status === 'qualified' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
                      }`}>{lead.status}</Badge></td>
                      <td className="px-4 py-3 text-sm text-slate-600 font-inter">{lead.product_interest || '-'}</td>
                      <td className="px-4 py-3 text-sm text-slate-500 font-mono">{new Date(lead.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(lead)}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(lead.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
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

const AccountsList = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    customer_name: '', gstin: '', billing_address: '',
    shipping_addresses: [{ address: '', city: '', state: '', pincode: '' }],
    credit_limit: '', payment_terms: '30 days', contact_person: '', email: '', phone: ''
  });

  useEffect(() => { fetchAccounts(); }, []);

  const fetchAccounts = async () => {
    try {
      const response = await api.get('/crm/accounts');
      setAccounts(response.data);
    } catch (error) {
      toast.error('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAccount) {
        await api.put(`/crm/accounts/${editingAccount.id}`, formData);
        toast.success('Account updated');
      } else {
        await api.post('/crm/accounts', formData);
        toast.success('Account created');
      }
      setOpen(false);
      setEditingAccount(null);
      fetchAccounts();
      resetForm();
    } catch (error) {
      toast.error('Failed to save account');
    }
  };

  const resetForm = () => {
    setFormData({
      customer_name: '', gstin: '', billing_address: '',
      shipping_addresses: [{ address: '', city: '', state: '', pincode: '' }],
      credit_limit: '', payment_terms: '30 days', contact_person: '', email: '', phone: ''
    });
  };

  const filteredAccounts = accounts.filter(acc => 
    acc.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    acc.gstin.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="flex items-center justify-center h-96"><div className="animate-spin h-12 w-12 border-4 border-accent border-t-transparent rounded-full"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 font-manrope">Customer Accounts</h2>
          <p className="text-slate-600 mt-1 font-inter">{accounts.length} total accounts</p>
        </div>
        <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-accent hover:bg-accent/90 font-inter"><Plus className="h-4 w-4 mr-2" />Add Account</Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-manrope">{editingAccount ? 'Edit' : 'Create'} Account</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-inter">Customer Name *</Label>
                  <Input value={formData.customer_name} onChange={(e) => setFormData({...formData, customer_name: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label className="font-inter">GSTIN *</Label>
                  <Input value={formData.gstin} onChange={(e) => setFormData({...formData, gstin: e.target.value})} placeholder="27XXXXX0000X1ZX" required />
                </div>
                <div className="space-y-2">
                  <Label className="font-inter">Contact Person *</Label>
                  <Input value={formData.contact_person} onChange={(e) => setFormData({...formData, contact_person: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label className="font-inter">Email *</Label>
                  <Input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label className="font-inter">Phone *</Label>
                  <Input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label className="font-inter">Payment Terms</Label>
                  <Select value={formData.payment_terms} onValueChange={(value) => setFormData({...formData, payment_terms: value})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15 days">15 Days</SelectItem>
                      <SelectItem value="30 days">30 Days</SelectItem>
                      <SelectItem value="45 days">45 Days</SelectItem>
                      <SelectItem value="60 days">60 Days</SelectItem>
                      <SelectItem value="Cash">Cash</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="font-inter">Credit Limit (₹)</Label>
                  <Input type="number" value={formData.credit_limit} onChange={(e) => setFormData({...formData, credit_limit: e.target.value})} placeholder="100000" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-inter">Billing Address *</Label>
                <textarea className="w-full min-h-[80px] px-3 py-2 border border-slate-200 rounded-md font-inter" value={formData.billing_address} onChange={(e) => setFormData({...formData, billing_address: e.target.value})} required />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => { setOpen(false); resetForm(); }}>Cancel</Button>
                <Button type="submit" className="bg-accent hover:bg-accent/90">{editingAccount ? 'Update' : 'Create'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input placeholder="Search accounts..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase font-inter">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase font-inter">GSTIN</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase font-inter">Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase font-inter">Credit Limit</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase font-inter">Payment Terms</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase font-inter">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAccounts.length === 0 ? (
                  <tr><td colSpan="6" className="px-4 py-12 text-center text-slate-500 font-inter">
                    {searchTerm ? 'No accounts found' : 'No accounts yet. Click "Add Account" to create one.'}
                  </td></tr>
                ) : (
                  filteredAccounts.map((acc) => (
                    <tr key={acc.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900 font-inter">{acc.customer_name}</div>
                        <div className="text-sm text-slate-500 font-inter">{acc.email}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-sm text-slate-600">{acc.gstin}</td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-slate-900 font-inter">{acc.contact_person}</div>
                        <div className="text-sm text-slate-500 font-mono">{acc.phone}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-sm font-semibold text-slate-900">₹{acc.credit_limit?.toLocaleString('en-IN') || 'N/A'}</td>
                      <td className="px-4 py-3"><Badge className="bg-green-100 text-green-800 font-inter">{acc.payment_terms}</Badge></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm"><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
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

const CRM = () => {
  return (
    <Routes>
      <Route index element={<CRMOverview />} />
      <Route path="leads" element={<LeadsList />} />
      <Route path="accounts" element={<AccountsList />} />
      <Route path="quotations" element={<div className="p-6"><Card><CardContent className="p-12 text-center"><FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" /><p className="text-slate-600 font-inter">Quotations module - Building now...</p></CardContent></Card></div>} />
      <Route path="samples" element={<div className="p-6"><Card><CardContent className="p-12 text-center"><Beaker className="h-12 w-12 text-slate-400 mx-auto mb-4" /><p className="text-slate-600 font-inter">Samples module - Building now...</p></CardContent></Card></div>} />
    </Routes>
  );
};

export default CRM;