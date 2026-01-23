import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, Factory, ShoppingCart, Calculator, Users, Shield, Settings, Menu, X, LogOut, TrendingUp, Boxes, Wand2, ClipboardCheck, BarChart3, Gauge, Truck, Banknote, Ship, FolderLock, Trophy, Receipt, PieChart, Clock, Layers, FileEdit, Sliders, Brain, ChevronDown, ChevronRight, MessageSquare, HardDrive, Upload, FileText, Zap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import NotificationCenter from '../NotificationCenter';

const NavGroup = ({ group, location, setIsOpen }) => {
  const [expanded, setExpanded] = useState(
    group.children.some(child => location.pathname.startsWith(child.href))
  );

  const isGroupActive = group.children.some(child => location.pathname.startsWith(child.href));

  return (
    <div className="space-y-1">
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all",
          isGroupActive
            ? "bg-gradient-to-r from-accent/10 to-transparent border-l-2 border-accent text-white"
            : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
        )}
      >
        <div className="flex items-center gap-3">
          <group.icon className="h-5 w-5" strokeWidth={1.5} />
          <span className="font-inter">{group.name}</span>
        </div>
        {expanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </button>
      
      {expanded && (
        <div className="ml-4 pl-4 border-l border-slate-700 space-y-1">
          {group.children.map((item) => {
            const isActive = location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all",
                  isActive
                    ? "bg-accent/20 text-white font-medium"
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                )}
                onClick={() => setIsOpen(false)}
              >
                <item.icon className="h-4 w-4" strokeWidth={1.5} />
                <span className="font-inter">{item.name}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

const Sidebar = ({ isOpen, setIsOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  // Grouped navigation structure
  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, type: 'link' },
    { name: 'Director Center', href: '/director', icon: Gauge, type: 'link' },
    { name: 'CRM', href: '/crm', icon: TrendingUp, type: 'link' },
    { 
      name: 'Inventory', 
      icon: Boxes, 
      type: 'group',
      children: [
        { name: 'Stock & Items', href: '/inventory', icon: Package },
        { name: 'Advanced', href: '/advanced-inventory', icon: Layers },
      ]
    },
    { name: 'Production', href: '/production', icon: Factory, type: 'link' },
    { 
      name: 'Procurement', 
      icon: ShoppingCart, 
      type: 'group',
      children: [
        { name: 'Purchase Orders', href: '/procurement', icon: ShoppingCart },
        { name: 'Gatepass', href: '/gatepass', icon: Truck },
        { name: 'Import Bridge', href: '/import-bridge', icon: Ship },
      ]
    },
    { name: 'Accounts', href: '/accounts', icon: Calculator, type: 'link' },
    { 
      name: 'HRMS', 
      icon: Users, 
      type: 'group',
      children: [
        { name: 'Employees', href: '/hrms', icon: Users },
        { name: 'HR Dashboard', href: '/hrms-dashboard', icon: Clock },
        { name: 'Payroll', href: '/payroll', icon: Banknote },
        { name: 'Employee Vault', href: '/employee-vault', icon: FolderLock },
      ]
    },
    { name: 'Sales Incentives', href: '/sales-incentives', icon: Trophy, type: 'link' },
    { name: 'GST Compliance', href: '/gst-compliance', icon: Receipt, type: 'link' },
    { name: 'E-Invoice', href: '/einvoice', icon: FileText, type: 'link' },
    { name: 'Analytics', href: '/analytics', icon: PieChart, type: 'link' },
    { name: 'AI Dashboard', href: '/ai-dashboard', icon: Brain, type: 'link' },
    { name: 'Quality', href: '/quality', icon: Shield, type: 'link' },
    { name: 'Approvals', href: '/approvals', icon: ClipboardCheck, type: 'link' },
    { name: 'Reports', href: '/reports', icon: BarChart3, type: 'link' },
    { name: 'Chat', href: '/chat', icon: MessageSquare, type: 'link' },
    { name: 'Drive', href: '/drive', icon: HardDrive, type: 'link' },
    { name: 'Bulk Import', href: '/bulk-import', icon: Upload, type: 'link' },
    { name: 'Customization', href: '/customization', icon: Wand2, type: 'link' },
    { name: 'Power Settings', href: '/power-settings', icon: Sliders, type: 'link' },
    { name: 'Doc Editor', href: '/document-editor', icon: FileEdit, type: 'link' },
    { name: 'Settings', href: '/settings', icon: Settings, type: 'link' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsOpen(false)}
      />
      
      <aside
        className={cn(
          "fixed md:sticky top-0 left-0 z-50 h-screen w-64 bg-primary border-r border-slate-800 transition-transform duration-300 flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-manrope font-bold text-primary-foreground">AdhesiveFlow ERP</h1>
          <p className="text-xs text-slate-400 mt-1 font-inter">Industrial Management</p>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navigation.map((item) => {
            if (item.type === 'group') {
              return (
                <NavGroup 
                  key={item.name} 
                  group={item} 
                  location={location} 
                  setIsOpen={setIsOpen}
                />
              );
            }
            
            const isActive = location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all",
                  isActive
                    ? "bg-gradient-to-r from-accent/10 to-transparent border-l-2 border-accent text-white"
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                )}
                onClick={() => setIsOpen(false)}
              >
                <item.icon className="h-5 w-5" strokeWidth={1.5} />
                <span className="font-inter">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-accent to-orange-600 flex items-center justify-center text-white font-bold text-sm">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate font-inter">{user?.name}</p>
              <p className="text-xs text-slate-400 truncate font-inter">{user?.role}</p>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800/50"
            data-testid="logout-button"
          >
            <LogOut className="h-4 w-4 mr-2" />
            <span className="font-inter">Logout</span>
          </Button>
        </div>
      </aside>
    </>
  );
};

const MainLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md flex items-center px-6 justify-between sticky top-0 z-30">
          <button
            className="md:hidden p-2 rounded-lg hover:bg-slate-100"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            data-testid="mobile-menu-button"
          >
            {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <NotificationCenter />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
