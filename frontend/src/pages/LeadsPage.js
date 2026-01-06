import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { 
  Plus, Search, Edit, Trash2, Eye, Phone, Mail, Calendar, 
  Building2, MoreVertical, Filter, LayoutGrid, List, RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Textarea } from '../components/ui/textarea';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import api from '../lib/api';
import { toast } from 'sonner';

// Status configuration
const STATUS_CONFIG = {
  new: { label: 'New', bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-800', header: 'bg-blue-500' },
  contacted: { label: 'Contacted', bg: 'bg-yellow-50', border: 'border-yellow-200', badge: 'bg-yellow-100 text-yellow-800', header: 'bg-yellow-500' },
  qualified: { label: 'Qualified', bg: 'bg-green-50', border: 'border-green-200', badge: 'bg-green-100 text-green-800', header: 'bg-green-500' },
  proposal: { label: 'Proposal', bg: 'bg-purple-50', border: 'border-purple-200', badge: 'bg-purple-100 text-purple-800', header: 'bg-purple-500' },
  negotiation: { label: 'Negotiation', bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-800', header: 'bg-orange-500' },
  converted: { label: 'Converted', bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-800', header: 'bg-emerald-500' },
  lost: { label: 'Lost', bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-100 text-red-800', header: 'bg-red-500' }
};

const STATUSES = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'converted', 'lost'];

// ==================== EDITABLE SELECT COMPONENT ====================
export const EditableSelect = ({ value, onChange, category, options: initialOptions, placeholder, className }) => {
  const [options, setOptions] = useState(initialOptions || []);
  const [newValue, setNewValue] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const fetchOptions = useCallback(async () => {
    try {
      const response = await api.get(`/master-data/category/${category}`);
      setOptions(response.data);
    } catch (error) {
      console.error('Failed to fetch options:', error);
    }
  }, [category]);

  useEffect(() => {
    if (category && (!initialOptions || initialOptions.length === 0)) {
      fetchOptions();
    }
  }, [category, initialOptions, fetchOptions]);

  // (removed duplicate fetchOptions block)


  const handleAddNew = async () => {
    if (!newValue.trim()) return;
    
    try {
      if (category) {
        await api.post(`/master-data/category/${category}`, {
          value: newValue.trim(),
          label: newValue.trim()
        });
        await fetchOptions();
      } else {
        setOptions([...options, { value: newValue.trim(), label: newValue.trim() }]);
      }
      onChange(newValue.trim());
      setNewValue('');
      setIsAdding(false);
      toast.success('Option added');
    } catch (error) {
      toast.error('Failed to add option');
    }
  };

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
        {isAdding ? (
          <div className="p-2 flex gap-2">
            <Input
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="New value..."
              className="h-8"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddNew();
                if (e.key === 'Escape') setIsAdding(false);
              }}
            />
            <Button size="sm" onClick={handleAddNew} className="h-8">Add</Button>
          </div>
        ) : (
          <div 
            className="p-2 text-sm text-blue-600 cursor-pointer hover:bg-blue-50"
            onClick={(e) => { e.stopPropagation(); setIsAdding(true); }}
          >
            + Add New
          </div>
        )}
      </SelectContent>
    </Select>
  );
};

// ==================== LEAD CARD COMPONENT ====================
const LeadCard = ({ lead, index, onEdit, onView, onDelete }) => {
  const config = STATUS_CONFIG[lead.status] || STATUS_CONFIG.new;
  
  return (
    <Draggable draggableId={lead.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`mb-3 ${snapshot.isDragging ? 'opacity-75 rotate-2' : ''}`}
        >
          <Card className={`${config.bg} ${config.border} border shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing`}>
            <CardContent className="p-3">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-slate-900 text-sm truncate font-inter">{lead.company_name}</h4>
                  <p className="text-xs text-slate-500 truncate font-inter">{lead.contact_person}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onView?.(lead)}>
                      <Eye className="h-4 w-4 mr-2" />View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit?.(lead)}>
                      <Edit className="h-4 w-4 mr-2" />Edit Lead
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDelete?.(lead)} className="text-red-600">
                      <Trash2 className="h-4 w-4 mr-2" />Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div className="space-y-1 text-xs text-slate-600">
                {lead.email && (
                  <div className="flex items-center gap-1 truncate">
                    <Mail className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{lead.email}</span>
                  </div>
                )}
                {lead.phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="h-3 w-3 flex-shrink-0" />
                    <span className="font-mono">{lead.phone}</span>
                  </div>
                )}
                {lead.product_interest && (
                  <div className="flex items-center gap-1 truncate">
                    <Building2 className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{lead.product_interest}</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-200/50">
                <Badge className={`${config.badge} text-xs`}>{lead.source}</Badge>
                {lead.estimated_value && (
                  <span className="text-xs font-semibold text-slate-700 font-mono">
                    ₹{lead.estimated_value.toLocaleString('en-IN')}
                  </span>
                )}
              </div>
              
              {lead.next_followup_date && (
                <div className="flex items-center gap-1 mt-2 text-xs text-slate-500">
                  <Calendar className="h-3 w-3" />
                  <span>Follow-up: {new Date(lead.next_followup_date).toLocaleDateString()}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </Draggable>
  );
};

// ==================== KANBAN COLUMN COMPONENT ====================
const KanbanColumn = ({ status, leads, onEdit, onView, onDelete }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.new;
  
  return (
    <div className="flex-shrink-0 w-72">
      <div className={`${config.header} rounded-t-lg px-3 py-2`}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-white text-sm font-inter">{config.label}</h3>
          <Badge className="bg-white/20 text-white border-0">{leads.length}</Badge>
        </div>
      </div>
      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`${config.bg} ${config.border} border border-t-0 rounded-b-lg p-2 min-h-[400px] max-h-[calc(100vh-320px)] overflow-y-auto ${
              snapshot.isDraggingOver ? 'ring-2 ring-blue-400' : ''
            }`}
          >
            {leads.map((lead, index) => (
              <LeadCard 
                key={lead.id} 
                lead={lead} 
                index={index} 
                onEdit={onEdit}
                onView={onView}
                onDelete={onDelete}
              />
            ))}
            {provided.placeholder}
            {leads.length === 0 && (
              <div className="text-center py-8 text-slate-400 text-sm font-inter">
                No leads in this stage
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
};

// ==================== LEAD FORM DIALOG ====================
const LeadFormDialog = ({ open, onOpenChange, lead, onSuccess }) => {
  const [salesUsers, setSalesUsers] = useState([]);
  const [loadingGeo, setLoadingGeo] = useState(false);
  const [stateOptions, setStateOptions] = useState([]);

  const [formData, setFormData] = useState({
    company_name: '', contact_person: '', email: '', phone: '', mobile: '',
    address: '', country: 'India', state: '', district: '', city: '', pincode: '',
    customer_type: '', pipeline: 'main', assigned_to: '',
    source: 'IndiaMART', industry: '', product_interest: '',
    estimated_value: '', notes: '', next_followup_date: '', followup_activity: ''
  });

  useEffect(() => {
    if (lead) {
      setFormData({
        company_name: lead.company_name || '',
        contact_person: lead.contact_person || '',
        email: lead.email || '',
        phone: lead.phone || '',
        mobile: lead.mobile || '',
        address: lead.address || '',
        city: lead.city || '',
        state: lead.state || '',
        pincode: lead.pincode || '',
        source: lead.source || 'IndiaMART',
        industry: lead.industry || '',
        product_interest: lead.product_interest || '',
        estimated_value: lead.estimated_value || '',
        notes: lead.notes || '',
        next_followup_date: lead.next_followup_date || '',
        followup_activity: lead.followup_activity || ''
      });
    } else {
      setFormData({
        company_name: '', contact_person: '', email: '', phone: '', mobile: '',
        address: '', city: '', state: '', pincode: '',
        source: 'IndiaMART', industry: '', product_interest: '',
        estimated_value: '', notes: '', next_followup_date: '', followup_activity: ''
      });
    }
  }, [lead, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        estimated_value: formData.estimated_value ? parseFloat(formData.estimated_value) : null
      };
      
      if (lead) {
        await api.put(`/crm/leads/${lead.id}`, payload);
        toast.success('Lead updated');
      } else {
        await api.post('/crm/leads', payload);
        toast.success('Lead created');
      }
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save lead');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-manrope">{lead ? 'Edit Lead' : 'Create New Lead'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Company Name *</Label>
              <Input value={formData.company_name} onChange={(e) => setFormData({...formData, company_name: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label>Contact Person *</Label>
              <Input value={formData.contact_person} onChange={(e) => setFormData({...formData, contact_person: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label>Phone *</Label>
              <Input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label>Mobile</Label>
              <Input value={formData.mobile} onChange={(e) => setFormData({...formData, mobile: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Source *</Label>
              <EditableSelect 
                value={formData.source} 
                onChange={(value) => setFormData({...formData, source: value})}
                category="lead_source"
                placeholder="Select source"
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Address</Label>
              <Input value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>City</Label>
              <Input value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>State</Label>
              <Input value={formData.state} onChange={(e) => setFormData({...formData, state: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Pincode</Label>
              <Input value={formData.pincode} onChange={(e) => setFormData({...formData, pincode: e.target.value})} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Industry</Label>
              <EditableSelect 
                value={formData.industry} 
                onChange={(value) => setFormData({...formData, industry: value})}
                category="industry"
                placeholder="Select industry"
              />
            </div>
            <div className="space-y-2">
              <Label>Product Interest</Label>
              <Input value={formData.product_interest} onChange={(e) => setFormData({...formData, product_interest: e.target.value})} placeholder="BOPP Tape, Masking Tape..." />
            </div>
            <div className="space-y-2">
              <Label>Estimated Value (₹)</Label>
              <Input type="number" value={formData.estimated_value} onChange={(e) => setFormData({...formData, estimated_value: e.target.value})} placeholder="50000" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Next Follow-up Date</Label>
              <Input type="date" value={formData.next_followup_date} onChange={(e) => setFormData({...formData, next_followup_date: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Follow-up Activity</Label>
              <EditableSelect 
                value={formData.followup_activity} 
                onChange={(value) => setFormData({...formData, followup_activity: value})}
                category="followup_type"
                placeholder="Select activity"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} rows={3} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="bg-accent hover:bg-accent/90">{lead ? 'Update' : 'Create'} Lead</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// ==================== ADVANCED FILTERS ====================
const AdvancedFilters = ({ filters, onChange, onClear }) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {Object.values(filters).filter(v => v && v !== 'all').length > 0 && (
            <Badge className="ml-2 bg-accent text-white">{Object.values(filters).filter(v => v && v !== 'all').length}</Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <h4 className="font-semibold text-slate-900">Filter Leads</h4>
          
          <div className="space-y-2">
            <Label className="text-xs">Status</Label>
            <Select value={filters.status || 'all'} onValueChange={(v) => onChange({...filters, status: v})}>
              <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {STATUSES.map(s => <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Source</Label>
            <EditableSelect 
              value={filters.source || 'all'} 
              onChange={(v) => onChange({...filters, source: v})}
              category="lead_source"
              placeholder="All Sources"
              className="h-8"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Industry</Label>
            <EditableSelect 
              value={filters.industry || 'all'} 
              onChange={(v) => onChange({...filters, industry: v})}
              category="industry"
              placeholder="All Industries"
              className="h-8"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">City</Label>
            <Input 
              value={filters.city || ''} 
              onChange={(e) => onChange({...filters, city: e.target.value})}
              placeholder="Filter by city"
              className="h-8"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">State</Label>
            <Input 
              value={filters.state || ''} 
              onChange={(e) => onChange({...filters, state: e.target.value})}
              placeholder="Filter by state"
              className="h-8"
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClear} className="flex-1">Clear All</Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

// ==================== MAIN LEADS PAGE ====================
const LeadsPage = () => {
  const [leads, setLeads] = useState([]);
  const [kanbanData, setKanbanData] = useState({});
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' or 'list'
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ status: 'all', source: 'all', industry: 'all', city: '', state: '' });
  const [formOpen, setFormOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);

  useEffect(() => {
    fetchData();
  }, [viewMode, filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (viewMode === 'kanban') {
        const response = await api.get('/crm/leads/kanban/view');
        setKanbanData(response.data.data || {});
      } else {
        const params = new URLSearchParams();
        if (filters.status && filters.status !== 'all') params.append('status', filters.status);
        if (filters.source && filters.source !== 'all') params.append('source', filters.source);
        if (filters.industry && filters.industry !== 'all') params.append('industry', filters.industry);
        if (filters.city) params.append('city', filters.city);
        if (filters.state) params.append('state', filters.state);
        if (searchTerm) params.append('search', searchTerm);
        
        const response = await api.get(`/crm/leads?${params.toString()}`);
        setLeads(response.data);
      }
    } catch (error) {
      toast.error('Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    
    // Optimistic update
    const newKanbanData = { ...kanbanData };
    const sourceLeads = [...(newKanbanData[source.droppableId] || [])];
    const [movedLead] = sourceLeads.splice(source.index, 1);
    
    if (!movedLead) return;
    
    newKanbanData[source.droppableId] = sourceLeads;
    const destLeads = source.droppableId === destination.droppableId 
      ? sourceLeads 
      : [...(newKanbanData[destination.droppableId] || [])];
    
    movedLead.status = destination.droppableId;
    destLeads.splice(destination.index, 0, movedLead);
    newKanbanData[destination.droppableId] = destLeads;
    
    setKanbanData(newKanbanData);
    
    // API call
    try {
      await api.put(`/crm/leads/${draggableId}/move?new_status=${destination.droppableId}`);
      toast.success(`Lead moved to ${STATUS_CONFIG[destination.droppableId].label}`);
    } catch (error) {
      toast.error('Failed to move lead');
      fetchData(); // Revert on error
    }
  };

  const handleEdit = (lead) => {
    setEditingLead(lead);
    setFormOpen(true);
  };

  const handleDelete = async (lead) => {
    if (!window.confirm(`Delete lead "${lead.company_name}"?`)) return;
    try {
      await api.delete(`/crm/leads/${lead.id}`);
      toast.success('Lead deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete lead');
    }
  };

  const clearFilters = () => {
    setFilters({ status: 'all', source: 'all', industry: 'all', city: '', state: '' });
    setSearchTerm('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin h-12 w-12 border-4 border-accent border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="leads-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 font-manrope">Leads Pipeline</h2>
          <p className="text-slate-600 mt-1 font-inter">
            {viewMode === 'kanban' 
              ? `${Object.values(kanbanData).flat().length} leads across ${STATUSES.length} stages`
              : `${leads.length} leads`
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-lg overflow-hidden">
            <Button 
              variant={viewMode === 'kanban' ? 'default' : 'ghost'} 
              size="sm" 
              onClick={() => setViewMode('kanban')}
              className={viewMode === 'kanban' ? 'bg-accent' : ''}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button 
              variant={viewMode === 'list' ? 'default' : 'ghost'} 
              size="sm" 
              onClick={() => setViewMode('list')}
              className={viewMode === 'list' ? 'bg-accent' : ''}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={fetchData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button 
            onClick={() => { setEditingLead(null); setFormOpen(true); }} 
            className="bg-accent hover:bg-accent/90"
            data-testid="add-lead-btn"
          >
            <Plus className="h-4 w-4 mr-2" />Add Lead
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search leads..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchData()}
            className="pl-10" 
          />
        </div>
        <AdvancedFilters filters={filters} onChange={setFilters} onClear={clearFilters} />
      </div>

      {/* Content */}
      {viewMode === 'kanban' ? (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {STATUSES.map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                leads={kanbanData[status] || []}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </DragDropContext>
      ) : (
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Company</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Contact</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Source</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Est. Value</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">City</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leads.length === 0 ? (
                    <tr><td colSpan="7" className="px-4 py-12 text-center text-slate-500">No leads found</td></tr>
                  ) : (
                    leads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900">{lead.company_name}</div>
                          <div className="text-sm text-slate-500">{lead.email}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm">{lead.contact_person}</div>
                          <div className="text-sm text-slate-500 font-mono">{lead.phone}</div>
                        </td>
                        <td className="px-4 py-3"><Badge className="bg-blue-100 text-blue-800">{lead.source}</Badge></td>
                        <td className="px-4 py-3">
                          <Badge className={STATUS_CONFIG[lead.status]?.badge}>{STATUS_CONFIG[lead.status]?.label}</Badge>
                        </td>
                        <td className="px-4 py-3 font-mono">
                          {lead.estimated_value ? `₹${lead.estimated_value.toLocaleString('en-IN')}` : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">{lead.city || '-'}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(lead)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(lead)} className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
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
      )}

      {/* Lead Form Dialog */}
      <LeadFormDialog 
        open={formOpen} 
        onOpenChange={setFormOpen} 
        lead={editingLead}
        onSuccess={fetchData}
      />
    </div>
  );
};

export default LeadsPage;
