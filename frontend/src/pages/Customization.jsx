import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Plus, Wand2, FileText, Bell, Mail, Code, Download, Upload, Play, Trash2, Edit, Eye, Copy, Check } from 'lucide-react';
import { Textarea } from '../components/ui/textarea';
import api from '../lib/api';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

const CustomFieldsManager = () => {
  const [customFields, setCustomFields] = useState([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    field_name: '',
    field_label: '',
    field_type: 'text',
    module: 'crm',
    entity: 'leads',
    options: [],
    required: false
  });
  const { user } = useAuth();

  useEffect(() => {
    fetchCustomFields();
  }, []);

  const fetchCustomFields = async () => {
    try {
      const response = await api.get('/customization/custom-fields');
      setCustomFields(response.data || []);
    } catch (error) {
      console.error('Failed to load custom fields:', error);
      setCustomFields([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/customization/custom-fields', formData);
      toast.success('Custom field created successfully');
      setOpen(false);
      fetchCustomFields();
      setFormData({ field_name: '', field_label: '', field_type: 'text', module: 'crm', entity: 'leads', options: [], required: false });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create custom field');
    }
  };

  const handleDelete = async (fieldId) => {
    if (!confirm('Are you sure you want to delete this custom field?')) return;
    try {
      await api.delete(`/customization/custom-fields/${fieldId}`);
      toast.success('Custom field deleted');
      fetchCustomFields();
    } catch (error) {
      toast.error('Failed to delete custom field');
    }
  };

  if (user?.role !== 'admin') {
    return (
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-6">
          <p className="text-slate-600 font-inter">Only administrators can manage custom fields.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-900 font-manrope">Custom Fields</h3>
          <p className="text-slate-600 text-sm mt-1 font-inter">Add custom fields to any module</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-accent hover:bg-accent/90 font-inter" data-testid="add-custom-field-button">
              <Plus className="h-4 w-4 mr-2" />
              Add Custom Field
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="font-manrope">Create Custom Field</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="module" className="font-inter">Module</Label>
                  <Select value={formData.module} onValueChange={(value) => setFormData({...formData, module: value})} required>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="crm">CRM</SelectItem>
                      <SelectItem value="inventory">Inventory</SelectItem>
                      <SelectItem value="production">Production</SelectItem>
                      <SelectItem value="procurement">Procurement</SelectItem>
                      <SelectItem value="accounts">Accounts</SelectItem>
                      <SelectItem value="hrms">HRMS</SelectItem>
                      <SelectItem value="quality">Quality</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="entity" className="font-inter">Entity</Label>
                  <Input id="entity" value={formData.entity} onChange={(e) => setFormData({...formData, entity: e.target.value})} placeholder="e.g., leads, items" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="field_name" className="font-inter">Field Name (Internal)</Label>
                  <Input id="field_name" value={formData.field_name} onChange={(e) => setFormData({...formData, field_name: e.target.value})} placeholder="e.g., customer_rating" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="field_label" className="font-inter">Field Label (Display)</Label>
                  <Input id="field_label" value={formData.field_label} onChange={(e) => setFormData({...formData, field_label: e.target.value})} placeholder="e.g., Customer Rating" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="field_type" className="font-inter">Field Type</Label>
                  <Select value={formData.field_type} onValueChange={(value) => setFormData({...formData, field_type: value})} required>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="select">Dropdown</SelectItem>
                      <SelectItem value="checkbox">Checkbox</SelectItem>
                      <SelectItem value="textarea">Text Area</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="font-inter">Required</Label>
                  <div className="flex items-center gap-2 h-10">
                    <input
                      type="checkbox"
                      checked={formData.required}
                      onChange={(e) => setFormData({...formData, required: e.target.checked})}
                      className="h-4 w-4"
                    />
                    <span className="text-sm text-slate-600 font-inter">Make this field mandatory</span>
                  </div>
                </div>
              </div>
              {formData.field_type === 'select' && (
                <div className="space-y-2">
                  <Label htmlFor="options" className="font-inter">Dropdown Options (comma-separated)</Label>
                  <Input
                    id="options"
                    placeholder="e.g., Excellent, Good, Average, Poor"
                    onChange={(e) => setFormData({...formData, options: e.target.value.split(',').map(o => o.trim())})}
                  />
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-accent hover:bg-accent/90">Create Field</Button>
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
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider font-inter">Module</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider font-inter">Entity</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider font-inter">Field Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider font-inter">Label</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider font-inter">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider font-inter">Required</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider font-inter">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customFields.map((field) => (
                  <tr key={field.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3"><Badge className="bg-blue-100 text-blue-800 font-inter">{field.module}</Badge></td>
                    <td className="px-4 py-3 text-sm text-slate-600 font-inter">{field.entity}</td>
                    <td className="px-4 py-3 text-sm font-mono text-slate-900">{field.field_name}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 font-inter">{field.field_label}</td>
                    <td className="px-4 py-3"><Badge variant="outline" className="font-inter">{field.field_type}</Badge></td>
                    <td className="px-4 py-3">{field.required ? <Badge className="bg-orange-100 text-orange-800">Yes</Badge> : <Badge className="bg-gray-100 text-gray-800">No</Badge>}</td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(field.id)} className="text-destructive hover:text-destructive">Delete</Button>
                    </td>
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

const ReportBuilder = () => {
  const [reports, setReports] = useState([]);
  const [open, setOpen] = useState(false);
  const [executeOpen, setExecuteOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    module: 'crm',
    query_filters: {},
    columns: [],
    group_by: [],
    chart_type: ''
  });
  const { user } = useAuth();

  const modules = [
    { value: 'crm', label: 'CRM (Leads)' },
    { value: 'inventory', label: 'Inventory (Stock)' },
    { value: 'production', label: 'Production (Work Orders)' },
    { value: 'accounts', label: 'Accounts (Invoices)' },
    { value: 'hrms', label: 'HRMS (Employees)' },
    { value: 'quality', label: 'Quality (Inspections)' }
  ];

  const columnOptions = {
    crm: ['company_name', 'contact_person', 'email', 'phone', 'status', 'source', 'estimated_value', 'created_at'],
    inventory: ['item_code', 'item_name', 'category', 'stock_quantity', 'uom', 'standard_cost', 'selling_price'],
    production: ['wo_number', 'product_name', 'quantity', 'status', 'planned_start_date', 'planned_end_date'],
    accounts: ['invoice_number', 'customer_name', 'invoice_date', 'total_amount', 'status', 'due_date'],
    hrms: ['employee_code', 'name', 'department', 'designation', 'date_of_joining', 'basic_salary'],
    quality: ['inspection_number', 'product_name', 'inspection_date', 'result', 'inspector_name']
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await api.get('/customization/report-templates');
      setReports(response.data || []);
    } catch (error) {
      console.error('Failed to load reports:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || formData.columns.length === 0) {
      toast.error('Please provide a name and select at least one column');
      return;
    }
    try {
      const columnsData = formData.columns.map(col => ({ field: col, label: col.replace(/_/g, ' ').toUpperCase() }));
      await api.post('/customization/report-templates', {
        ...formData,
        columns: columnsData
      });
      toast.success('Report template created successfully');
      setOpen(false);
      fetchReports();
      setFormData({ name: '', description: '', module: 'crm', query_filters: {}, columns: [], group_by: [], chart_type: '' });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create report');
    }
  };

  const handleExecute = async (report) => {
    setSelectedReport(report);
    setLoading(true);
    setExecuteOpen(true);
    try {
      const response = await api.post(`/customization/report-templates/${report.id}/execute`);
      setReportData(response.data);
    } catch (error) {
      toast.error('Failed to execute report');
    } finally {
      setLoading(false);
    }
  };

  const toggleColumn = (col) => {
    setFormData(prev => ({
      ...prev,
      columns: prev.columns.includes(col) 
        ? prev.columns.filter(c => c !== col)
        : [...prev.columns, col]
    }));
  };

  if (user?.role !== 'admin') {
    return (
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-6">
          <p className="text-slate-600 font-inter">Only administrators can manage report templates.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-900 font-manrope">Report Builder</h3>
          <p className="text-slate-600 text-sm mt-1 font-inter">Create and execute custom reports</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-accent hover:bg-accent/90 font-inter" data-testid="create-report-button">
              <Plus className="h-4 w-4 mr-2" />
              Create Report
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-manrope">Create Report Template</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-inter">Report Name *</Label>
                  <Input 
                    value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})} 
                    placeholder="e.g., Monthly Sales Report"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-inter">Module *</Label>
                  <Select value={formData.module} onValueChange={(v) => setFormData({...formData, module: v, columns: []})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {modules.map(m => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-inter">Description</Label>
                <Textarea 
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="What does this report show?"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-inter">Select Columns *</Label>
                <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-lg border">
                  {columnOptions[formData.module]?.map(col => (
                    <Badge 
                      key={col} 
                      variant={formData.columns.includes(col) ? 'default' : 'outline'}
                      className="cursor-pointer hover:bg-accent/20"
                      onClick={() => toggleColumn(col)}
                    >
                      {formData.columns.includes(col) && <Check className="h-3 w-3 mr-1" />}
                      {col.replace(/_/g, ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-inter">Chart Type (optional)</Label>
                <Select value={formData.chart_type} onValueChange={(v) => setFormData({...formData, chart_type: v})}>
                  <SelectTrigger><SelectValue placeholder="No chart" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No chart</SelectItem>
                    <SelectItem value="bar">Bar Chart</SelectItem>
                    <SelectItem value="line">Line Chart</SelectItem>
                    <SelectItem value="pie">Pie Chart</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-accent hover:bg-accent/90">Create Report</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Execute Report Dialog */}
      <Dialog open={executeOpen} onOpenChange={setExecuteOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-manrope">{selectedReport?.name}</DialogTitle>
          </DialogHeader>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-accent border-t-transparent rounded-full"></div>
            </div>
          ) : reportData ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant="outline">{reportData.count} records found</Badge>
                <span className="text-xs text-slate-500">Executed: {new Date(reportData.executed_at).toLocaleString()}</span>
              </div>
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      {reportData.template.columns.map((col, i) => (
                        <th key={i} className="px-3 py-2 text-left font-semibold text-slate-700">{col.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {reportData.data.slice(0, 50).map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        {reportData.template.columns.map((col, j) => (
                          <td key={j} className="px-3 py-2 text-slate-600">{row[col.field] ?? '-'}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {reportData.count > 50 && <p className="text-xs text-slate-500 text-center">Showing 50 of {reportData.count} records</p>}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Reports List */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-0">
          {reports.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 font-inter">No report templates yet. Create your first report!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Module</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Columns</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Created</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reports.map((report) => (
                    <tr key={report.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-slate-900">{report.name}</p>
                          {report.description && <p className="text-xs text-slate-500">{report.description}</p>}
                        </div>
                      </td>
                      <td className="px-4 py-3"><Badge className="bg-blue-100 text-blue-800">{report.module}</Badge></td>
                      <td className="px-4 py-3 text-sm text-slate-600">{report.columns?.length || 0} fields</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{new Date(report.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <Button variant="ghost" size="sm" onClick={() => handleExecute(report)} className="text-accent">
                          <Play className="h-4 w-4 mr-1" /> Run
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const Customization = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 font-manrope" data-testid="customization-title">
          <Wand2 className="inline h-8 w-8 mr-2 text-accent" />
          Customization & Extensions
        </h1>
        <p className="text-slate-600 mt-1 font-inter">Extend and customize your ERP system</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer">
          <CardContent className="p-6 text-center">
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-3">
              <Plus className="h-6 w-6 text-white" />
            </div>
            <h3 className="font-semibold text-slate-900 font-manrope">Custom Fields</h3>
            <p className="text-sm text-slate-600 mt-1 font-inter">Add fields to any module</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer">
          <CardContent className="p-6 text-center">
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mx-auto mb-3">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <h3 className="font-semibold text-slate-900 font-manrope">Report Builder</h3>
            <p className="text-sm text-slate-600 mt-1 font-inter">Create custom reports</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer">
          <CardContent className="p-6 text-center">
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mx-auto mb-3">
              <Mail className="h-6 w-6 text-white" />
            </div>
            <h3 className="font-semibold text-slate-900 font-manrope">Email Templates</h3>
            <p className="text-sm text-slate-600 mt-1 font-inter">Customize email content</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer">
          <CardContent className="p-6 text-center">
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mx-auto mb-3">
              <Bell className="h-6 w-6 text-white" />
            </div>
            <h3 className="font-semibold text-slate-900 font-manrope">Notifications</h3>
            <p className="text-sm text-slate-600 mt-1 font-inter">Setup alert rules</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer">
          <CardContent className="p-6 text-center">
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center mx-auto mb-3">
              <Code className="h-6 w-6 text-white" />
            </div>
            <h3 className="font-semibold text-slate-900 font-manrope">API Access</h3>
            <p className="text-sm text-slate-600 mt-1 font-inter">Integrate external systems</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer">
          <CardContent className="p-6 text-center">
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center mx-auto mb-3">
              <Download className="h-6 w-6 text-white" />
            </div>
            <h3 className="font-semibold text-slate-900 font-manrope">Data Import/Export</h3>
            <p className="text-sm text-slate-600 mt-1 font-inter">Bulk operations</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="fields" className="space-y-4">
        <TabsList className="bg-white border border-slate-200">
          <TabsTrigger value="fields" className="font-inter">Custom Fields</TabsTrigger>
          <TabsTrigger value="reports" className="font-inter">Report Builder</TabsTrigger>
          <TabsTrigger value="api" className="font-inter">API Documentation</TabsTrigger>
        </TabsList>

        <TabsContent value="fields">
          <CustomFieldsManager />
        </TabsContent>

        <TabsContent value="reports">
          <ReportBuilder />
        </TabsContent>

        <TabsContent value="api">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="font-manrope">API Documentation</CardTitle>
              <CardDescription className="font-inter">RESTful API endpoints for external integrations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-slate-900 rounded-lg p-4 font-mono text-sm text-green-400">
                <p>Base URL: {import.meta.env.VITE_BACKEND_URL}/api</p>
                <p className="mt-2">Authentication: Bearer Token (JWT)</p>
                <p className="mt-4">Available Endpoints:</p>
                <ul className="mt-2 space-y-1 ml-4">
                  <li>GET /crm/leads - List all leads</li>
                  <li>POST /crm/leads - Create new lead</li>
                  <li>GET /inventory/stock - Get stock levels</li>
                  <li>POST /production/work-orders - Create work order</li>
                  <li>GET /dashboard/overview - Get dashboard data</li>
                </ul>
              </div>
              <Button className="mt-4 bg-accent hover:bg-accent/90 font-inter">
                <Download className="h-4 w-4 mr-2" />
                Download Full API Docs (Swagger)
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Customization;