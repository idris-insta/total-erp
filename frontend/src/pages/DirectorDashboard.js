import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  DollarSign, TrendingUp, TrendingDown, Package, AlertTriangle, Users, 
  Factory, ShoppingCart, Clock, CheckCircle, XCircle, RefreshCw,
  ArrowUpRight, ArrowDownRight, Banknote, CreditCard, Wallet
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const DirectorDashboard = () => {
  const [cashPulse, setCashPulse] = useState(null);
  const [productionPulse, setProductionPulse] = useState(null);
  const [salesPulse, setSalesPulse] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const token = localStorage.getItem('token');

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const [cashRes, prodRes, salesRes, alertsRes] = await Promise.all([
        fetch(`${API_URL}/api/director/cash-pulse`, { headers }),
        fetch(`${API_URL}/api/director/production-pulse`, { headers }),
        fetch(`${API_URL}/api/director/sales-pulse`, { headers }),
        fetch(`${API_URL}/api/director/alerts`, { headers })
      ]);

      if (cashRes.ok) setCashPulse(await cashRes.json());
      if (prodRes.ok) setProductionPulse(await prodRes.json());
      if (salesRes.ok) setSalesPulse(await salesRes.json());
      if (alertsRes.ok) setAlerts(await alertsRes.json());
    } catch (error) {
      console.error('Error fetching director dashboard:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchData, 300000);
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatPercent = (value) => `${(value || 0).toFixed(1)}%`;

  if (loading && !cashPulse) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Director Command Center</h1>
          <p className="text-sm text-gray-500">Consolidated Pulse View</p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Alert Banner */}
      {alerts && (alerts.pending_approvals?.count > 0 || alerts.overdue_invoices?.count > 0) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-4">
          <AlertTriangle className="h-6 w-6 text-red-500" />
          <div className="flex-1">
            <p className="font-medium text-red-800">Attention Required</p>
            <p className="text-sm text-red-600">
              {alerts.pending_approvals?.count > 0 && `${alerts.pending_approvals.count} pending approvals`}
              {alerts.pending_approvals?.count > 0 && alerts.overdue_invoices?.count > 0 && ' • '}
              {alerts.overdue_invoices?.count > 0 && `${alerts.overdue_invoices.count} overdue invoices`}
            </p>
          </div>
          <Button variant="destructive" size="sm">View All</Button>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="cash">Cash Pulse</TabsTrigger>
          <TabsTrigger value="production">Production</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* KPI Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Cash Position */}
            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Net Cash Position</p>
                    <p className="text-2xl font-bold">{formatCurrency(cashPulse?.net_position)}</p>
                  </div>
                  <Wallet className="h-10 w-10 text-green-200" />
                </div>
                <div className="mt-4 flex items-center text-green-100 text-sm">
                  {cashPulse?.net_position >= 0 ? 
                    <ArrowUpRight className="h-4 w-4 mr-1" /> : 
                    <ArrowDownRight className="h-4 w-4 mr-1" />
                  }
                  AR: {formatCurrency(cashPulse?.total_receivables)}
                </div>
              </CardContent>
            </Card>

            {/* MTD Sales */}
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">MTD Sales</p>
                    <p className="text-2xl font-bold">{formatCurrency(salesPulse?.mtd_sales)}</p>
                  </div>
                  <TrendingUp className="h-10 w-10 text-blue-200" />
                </div>
                <div className="mt-4 flex items-center text-blue-100 text-sm">
                  <span className="font-medium">{formatPercent(salesPulse?.mtd_achievement)}</span>
                  <span className="ml-1">of target</span>
                </div>
              </CardContent>
            </Card>

            {/* Production */}
            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Production</p>
                    <p className="text-2xl font-bold">{formatPercent(productionPulse?.completion_percent)}</p>
                  </div>
                  <Factory className="h-10 w-10 text-purple-200" />
                </div>
                <div className="mt-4 flex items-center text-purple-100 text-sm">
                  <span>{productionPulse?.work_orders_in_progress || 0} WOs in progress</span>
                </div>
              </CardContent>
            </Card>

            {/* Alerts */}
            <Card className={`bg-gradient-to-br ${alerts?.pending_approvals?.count > 0 ? 'from-red-500 to-red-600' : 'from-gray-500 to-gray-600'} text-white`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-100 text-sm">Pending Actions</p>
                    <p className="text-2xl font-bold">{alerts?.pending_approvals?.count || 0}</p>
                  </div>
                  <AlertTriangle className="h-10 w-10 text-red-200" />
                </div>
                <div className="mt-4 flex items-center text-red-100 text-sm">
                  {alerts?.low_stock_alerts?.count || 0} low stock alerts
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Second Row - Detailed Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* AR/AP Aging */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">AR/AP Aging Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Receivables</p>
                    <div className="grid grid-cols-4 gap-2">
                      {['0-30', '31-60', '61-90', '90+'].map((bucket) => (
                        <div key={bucket} className="text-center p-2 bg-green-50 rounded">
                          <p className="text-xs text-gray-500">{bucket} days</p>
                          <p className="font-semibold text-green-700">
                            {formatCurrency(cashPulse?.receivables_aging?.[bucket])}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Payables</p>
                    <div className="grid grid-cols-4 gap-2">
                      {['0-30', '31-60', '61-90', '90+'].map((bucket) => (
                        <div key={bucket} className="text-center p-2 bg-red-50 rounded">
                          <p className="text-xs text-gray-500">{bucket} days</p>
                          <p className="font-semibold text-red-700">
                            {formatCurrency(cashPulse?.payables_aging?.[bucket])}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Customers */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Top Customers (This Month)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {salesPulse?.top_customers?.length > 0 ? (
                    salesPulse.top_customers.map((customer, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs">
                            {idx + 1}
                          </span>
                          <span className="font-medium">{customer.account_name || 'Unknown'}</span>
                        </div>
                        <span className="text-green-600 font-semibold">
                          {formatCurrency(customer.total_revenue)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">No sales data available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pending Approvals */}
          {alerts?.pending_approvals?.items?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Pending Approvals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {alerts.pending_approvals.items.slice(0, 5).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-100">
                      <div>
                        <p className="font-medium">{item.action}</p>
                        <p className="text-sm text-gray-600">{item.module} - {item.condition}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="text-red-600 border-red-200">
                          <XCircle className="h-4 w-4 mr-1" /> Reject
                        </Button>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700">
                          <CheckCircle className="h-4 w-4 mr-1" /> Approve
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Cash Pulse Tab */}
        <TabsContent value="cash" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 rounded-full">
                    <ArrowDownRight className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Receivables</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(cashPulse?.total_receivables)}</p>
                  </div>
                </div>
                <div className="mt-4 text-sm text-red-600">
                  Overdue: {formatCurrency(cashPulse?.overdue_receivables)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-red-100 rounded-full">
                    <ArrowUpRight className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Payables</p>
                    <p className="text-2xl font-bold text-red-600">{formatCurrency(cashPulse?.total_payables)}</p>
                  </div>
                </div>
                <div className="mt-4 text-sm text-red-600">
                  Overdue: {formatCurrency(cashPulse?.overdue_payables)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Banknote className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Bank Balance</p>
                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(cashPulse?.bank_balance)}</p>
                  </div>
                </div>
                <div className="mt-4 text-sm text-gray-600">
                  Cash: {formatCurrency(cashPulse?.cash_in_hand)}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Production Tab */}
        <TabsContent value="production" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6 text-center">
                <Factory className="h-8 w-8 mx-auto text-purple-500 mb-2" />
                <p className="text-sm text-gray-500">Work Orders In Progress</p>
                <p className="text-3xl font-bold">{productionPulse?.work_orders_in_progress || 0}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <TrendingUp className="h-8 w-8 mx-auto text-green-500 mb-2" />
                <p className="text-sm text-gray-500">Completion Rate</p>
                <p className="text-3xl font-bold">{formatPercent(productionPulse?.completion_percent)}</p>
              </CardContent>
            </Card>

            <Card className={productionPulse?.scrap_alert ? 'border-red-300 bg-red-50' : ''}>
              <CardContent className="p-6 text-center">
                <AlertTriangle className={`h-8 w-8 mx-auto mb-2 ${productionPulse?.scrap_alert ? 'text-red-500' : 'text-gray-400'}`} />
                <p className="text-sm text-gray-500">Avg Scrap %</p>
                <p className={`text-3xl font-bold ${productionPulse?.scrap_alert ? 'text-red-600' : ''}`}>
                  {formatPercent(productionPulse?.avg_scrap_percent)}
                </p>
                <p className="text-xs text-gray-400">Standard: 7%</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <Package className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                <p className="text-sm text-gray-500">Machines Running</p>
                <p className="text-3xl font-bold">
                  {productionPulse?.machines_running || 0}
                  <span className="text-lg text-gray-400">/{(productionPulse?.machines_running || 0) + (productionPulse?.machines_idle || 0)}</span>
                </p>
              </CardContent>
            </Card>
          </div>

          {productionPulse?.pending_approvals > 0 && (
            <Card className="border-red-300 bg-red-50">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <AlertTriangle className="h-10 w-10 text-red-500" />
                  <div>
                    <p className="font-bold text-red-800">Redline Alerts</p>
                    <p className="text-red-600">{productionPulse.pending_approvals} batches exceeded 7% scrap limit and require your approval</p>
                  </div>
                  <Button variant="destructive" className="ml-auto">Review Now</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Sales Tab */}
        <TabsContent value="sales" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-gray-500">MTD Sales</p>
                <p className="text-2xl font-bold">{formatCurrency(salesPulse?.mtd_sales)}</p>
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${Math.min(salesPulse?.mtd_achievement || 0, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatPercent(salesPulse?.mtd_achievement)} of {formatCurrency(salesPulse?.mtd_target)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-gray-500">YTD Sales</p>
                <p className="text-2xl font-bold">{formatCurrency(salesPulse?.ytd_sales)}</p>
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${Math.min(salesPulse?.ytd_achievement || 0, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatPercent(salesPulse?.ytd_achievement)} of {formatCurrency(salesPulse?.ytd_target)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-gray-500">Avg Order Value</p>
                <p className="text-2xl font-bold">{formatCurrency(salesPulse?.avg_order_value)}</p>
                <p className="text-sm text-gray-400 mt-2">
                  {salesPulse?.orders_this_month || 0} orders this month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-gray-500">Orders Today</p>
                <p className="text-2xl font-bold">{salesPulse?.orders_today || 0}</p>
                <Badge variant="outline" className="mt-2">
                  {new Date().toLocaleDateString('en-IN')}
                </Badge>
              </CardContent>
            </Card>
          </div>

          {/* Top Products */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top Products (This Month)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {salesPulse?.top_products?.length > 0 ? (
                  salesPulse.top_products.map((product, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="font-medium">{product._id || 'Unknown'}</p>
                          <p className="text-sm text-gray-500">{product.total_qty} units sold</p>
                        </div>
                      </div>
                      <span className="text-lg font-semibold text-green-600">
                        {formatCurrency(product.total_revenue)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No product data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DirectorDashboard;
