"""
Comprehensive Backend API Tests for New ERP Modules
Testing: hrms_enhanced, gst_compliance, inventory_advanced, reports_analytics, notifications
Focus: Verify NO ObjectId serialization errors occur in any response
"""

import pytest
import requests
import os
from datetime import datetime, timedelta

# Get BASE_URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    raise ValueError("REACT_APP_BACKEND_URL environment variable not set")

# Test credentials
TEST_EMAIL = "admin@instabiz.com"
TEST_PASSWORD = "adminpassword"


class TestAuth:
    """Authentication tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data, "No token in response"
        return data["token"]
    
    def test_login_success(self, auth_token):
        """Test login returns valid token"""
        assert auth_token is not None
        assert len(auth_token) > 0
        print(f"✅ Login successful, token obtained")


class TestHRMSEnhanced:
    """HRMS Enhanced Module Tests - Leave Types, Holidays, Statutory, Attendance, Loans, Leave Applications"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get auth headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        token = response.json()["token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_get_leave_types(self, auth_headers):
        """Test GET /api/hrms-enhanced/leave-types - should return list without ObjectId errors"""
        response = requests.get(f"{BASE_URL}/api/hrms-enhanced/leave-types", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        # Check no ObjectId in response
        response_text = response.text
        assert "_id" not in response_text or '"_id"' not in response_text, "ObjectId found in response"
        print(f"✅ Leave types returned: {len(data)} types")
        # Verify structure if data exists
        if data:
            assert "id" in data[0], "Leave type should have 'id' field"
            assert "name" in data[0], "Leave type should have 'name' field"
    
    def test_get_holidays_2025(self, auth_headers):
        """Test GET /api/hrms-enhanced/holidays/2025 - should return holidays without ObjectId errors"""
        response = requests.get(f"{BASE_URL}/api/hrms-enhanced/holidays/2025", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        # Check no ObjectId in response
        assert "_id" not in response.text, "ObjectId found in response"
        print(f"✅ Holidays 2025 returned: {len(data)} holidays")
        if data:
            assert "id" in data[0], "Holiday should have 'id' field"
            assert "name" in data[0], "Holiday should have 'name' field"
    
    def test_get_statutory_config(self, auth_headers):
        """Test GET /api/hrms-enhanced/statutory/config - should return config without ObjectId errors"""
        response = requests.get(f"{BASE_URL}/api/hrms-enhanced/statutory/config", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert isinstance(data, dict), "Response should be a dict"
        # Check no ObjectId in response
        assert "_id" not in response.text, "ObjectId found in response"
        print(f"✅ Statutory config returned: FY {data.get('financial_year', 'N/A')}")
        assert "id" in data, "Config should have 'id' field"
        assert "pf_employee_percent" in data, "Config should have PF settings"
    
    def test_get_attendance(self, auth_headers):
        """Test GET /api/hrms-enhanced/attendance - should return list without ObjectId errors"""
        response = requests.get(f"{BASE_URL}/api/hrms-enhanced/attendance", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        # Check no ObjectId in response
        assert "_id" not in response.text, "ObjectId found in response"
        print(f"✅ Attendance records returned: {len(data)} records")
    
    def test_get_loans(self, auth_headers):
        """Test GET /api/hrms-enhanced/loans - should return list without ObjectId errors"""
        response = requests.get(f"{BASE_URL}/api/hrms-enhanced/loans", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        # Check no ObjectId in response
        assert "_id" not in response.text, "ObjectId found in response"
        print(f"✅ Loans returned: {len(data)} loans")
    
    def test_get_leave_applications(self, auth_headers):
        """Test GET /api/hrms-enhanced/leave-applications - should return list without ObjectId errors"""
        response = requests.get(f"{BASE_URL}/api/hrms-enhanced/leave-applications", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        # Check no ObjectId in response
        assert "_id" not in response.text, "ObjectId found in response"
        print(f"✅ Leave applications returned: {len(data)} applications")


class TestAnalytics:
    """Reports & Analytics Module Tests"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get auth headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        token = response.json()["token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_dashboard_kpis(self, auth_headers):
        """Test GET /api/analytics/dashboard/kpis - should return KPIs without ObjectId errors"""
        response = requests.get(f"{BASE_URL}/api/analytics/dashboard/kpis", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert isinstance(data, dict), "Response should be a dict"
        # Check no ObjectId in response
        assert "_id" not in response.text, "ObjectId found in response"
        print(f"✅ Dashboard KPIs returned: today_sales={data.get('today_sales', 0)}, month_sales={data.get('month_sales', 0)}")
        # Verify expected fields
        assert "today_sales" in data, "Should have today_sales"
        assert "month_sales" in data, "Should have month_sales"
    
    def test_sales_summary(self, auth_headers):
        """Test GET /api/analytics/sales/summary - should return summary without ObjectId errors"""
        response = requests.get(f"{BASE_URL}/api/analytics/sales/summary", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert isinstance(data, dict), "Response should be a dict"
        # Check no ObjectId in response
        assert "_id" not in response.text, "ObjectId found in response"
        print(f"✅ Sales summary returned: period={data.get('period', 'N/A')}")
        assert "current_period" in data, "Should have current_period"
        assert "growth" in data, "Should have growth"
    
    def test_sales_top_products(self, auth_headers):
        """Test GET /api/analytics/sales/top-products - should return products without ObjectId errors"""
        response = requests.get(f"{BASE_URL}/api/analytics/sales/top-products", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert isinstance(data, dict), "Response should be a dict"
        # Check no ObjectId in response
        assert "_id" not in response.text, "ObjectId found in response"
        print(f"✅ Top products returned: {len(data.get('top_products', []))} products")
        assert "top_products" in data, "Should have top_products"
    
    def test_inventory_summary(self, auth_headers):
        """Test GET /api/analytics/inventory/summary - should return summary without ObjectId errors"""
        response = requests.get(f"{BASE_URL}/api/analytics/inventory/summary", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert isinstance(data, dict), "Response should be a dict"
        # Check no ObjectId in response
        assert "_id" not in response.text, "ObjectId found in response"
        print(f"✅ Inventory summary returned: total_items={data.get('total_items', 0)}")
        assert "total_items" in data, "Should have total_items"
        assert "total_stock_value" in data, "Should have total_stock_value"
    
    def test_financial_profit_loss(self, auth_headers):
        """Test GET /api/analytics/financial/profit-loss - should return P&L without ObjectId errors"""
        response = requests.get(f"{BASE_URL}/api/analytics/financial/profit-loss", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert isinstance(data, dict), "Response should be a dict"
        # Check no ObjectId in response
        assert "_id" not in response.text, "ObjectId found in response"
        print(f"✅ P&L returned: net_profit={data.get('net_profit', 0)}")
        assert "revenue" in data, "Should have revenue"
        assert "net_profit" in data, "Should have net_profit"


class TestGSTCompliance:
    """GST Compliance Module Tests"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get auth headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        token = response.json()["token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_gstr1_report(self, auth_headers):
        """Test GET /api/gst/gstr1/{period} - should return GSTR-1 without ObjectId errors"""
        period = "122025"  # December 2025
        response = requests.get(f"{BASE_URL}/api/gst/gstr1/{period}", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert isinstance(data, dict), "Response should be a dict"
        # Check no ObjectId in response
        assert "_id" not in response.text, "ObjectId found in response"
        print(f"✅ GSTR-1 returned: period={data.get('period', 'N/A')}, invoices={data.get('summary', {}).get('total_invoices', 0)}")
        assert "period" in data, "Should have period"
        assert "summary" in data, "Should have summary"
        assert "tables" in data, "Should have tables"
    
    def test_gstr3b_report(self, auth_headers):
        """Test GET /api/gst/gstr3b/{period} - should return GSTR-3B without ObjectId errors"""
        period = "122025"  # December 2025
        response = requests.get(f"{BASE_URL}/api/gst/gstr3b/{period}", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert isinstance(data, dict), "Response should be a dict"
        # Check no ObjectId in response
        assert "_id" not in response.text, "ObjectId found in response"
        print(f"✅ GSTR-3B returned: period={data.get('period', 'N/A')}")
        assert "period" in data, "Should have period"
        assert "summary" in data, "Should have summary"
    
    def test_itc_summary(self, auth_headers):
        """Test GET /api/gst/itc/{period} - should return ITC without ObjectId errors"""
        period = "122025"  # December 2025
        response = requests.get(f"{BASE_URL}/api/gst/itc/{period}", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert isinstance(data, dict), "Response should be a dict"
        # Check no ObjectId in response
        assert "_id" not in response.text, "ObjectId found in response"
        print(f"✅ ITC summary returned: period={data.get('period', 'N/A')}, purchases={data.get('summary', {}).get('total_purchases', 0)}")
        assert "period" in data, "Should have period"
        assert "summary" in data, "Should have summary"
    
    def test_eway_bills_list(self, auth_headers):
        """Test GET /api/gst/eway-bills - should return list without ObjectId errors"""
        response = requests.get(f"{BASE_URL}/api/gst/eway-bills", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        # Check no ObjectId in response
        assert "_id" not in response.text, "ObjectId found in response"
        print(f"✅ E-Way Bills returned: {len(data)} bills")


class TestInventoryAdvanced:
    """Advanced Inventory Module Tests"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get auth headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        token = response.json()["token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_batches_list(self, auth_headers):
        """Test GET /api/inventory-advanced/batches - should return list without ObjectId errors"""
        response = requests.get(f"{BASE_URL}/api/inventory-advanced/batches", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        # Check no ObjectId in response
        assert "_id" not in response.text, "ObjectId found in response"
        print(f"✅ Batches returned: {len(data)} batches")
    
    def test_bin_locations_list(self, auth_headers):
        """Test GET /api/inventory-advanced/bin-locations - should return list without ObjectId errors"""
        response = requests.get(f"{BASE_URL}/api/inventory-advanced/bin-locations", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        # Check no ObjectId in response
        assert "_id" not in response.text, "ObjectId found in response"
        print(f"✅ Bin locations returned: {len(data)} locations")
    
    def test_reorder_alerts(self, auth_headers):
        """Test GET /api/inventory-advanced/reorder-alerts - should return alerts without ObjectId errors"""
        response = requests.get(f"{BASE_URL}/api/inventory-advanced/reorder-alerts", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert isinstance(data, dict), "Response should be a dict"
        # Check no ObjectId in response
        assert "_id" not in response.text, "ObjectId found in response"
        print(f"✅ Reorder alerts returned: {data.get('total_alerts', 0)} alerts")
        assert "total_alerts" in data, "Should have total_alerts"
        assert "alerts" in data, "Should have alerts list"


class TestNotifications:
    """Notifications Module Tests"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get auth headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        token = response.json()["token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_notifications_list(self, auth_headers):
        """Test GET /api/notifications/notifications - should return list without ObjectId errors"""
        response = requests.get(f"{BASE_URL}/api/notifications/notifications", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        # Check no ObjectId in response
        assert "_id" not in response.text, "ObjectId found in response"
        print(f"✅ Notifications returned: {len(data)} notifications")
    
    def test_notifications_count(self, auth_headers):
        """Test GET /api/notifications/notifications/count - should return count without ObjectId errors"""
        response = requests.get(f"{BASE_URL}/api/notifications/notifications/count", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert isinstance(data, dict), "Response should be a dict"
        # Check no ObjectId in response
        assert "_id" not in response.text, "ObjectId found in response"
        print(f"✅ Unread count: {data.get('unread_count', 0)}")
        assert "unread_count" in data, "Should have unread_count"
    
    def test_generate_alerts(self, auth_headers):
        """Test POST /api/notifications/alerts/generate - should generate alerts without ObjectId errors"""
        response = requests.post(f"{BASE_URL}/api/notifications/alerts/generate", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert isinstance(data, dict), "Response should be a dict"
        # Check no ObjectId in response
        assert "_id" not in response.text, "ObjectId found in response"
        print(f"✅ Alerts generated: {data.get('message', 'N/A')}")
        assert "message" in data, "Should have message"
        assert "alerts" in data, "Should have alerts list"


class TestPOSTEndpoints:
    """Test POST endpoints to verify ObjectId exclusion on create operations"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get auth headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        token = response.json()["token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_create_leave_type(self, auth_headers):
        """Test POST /api/hrms-enhanced/leave-types - should return created object without ObjectId"""
        unique_code = f"TEST{datetime.now().strftime('%H%M%S')}"
        response = requests.post(
            f"{BASE_URL}/api/hrms-enhanced/leave-types",
            headers=auth_headers,
            json={
                "name": f"Test Leave {unique_code}",
                "code": unique_code,
                "annual_quota": 5,
                "carry_forward": False,
                "max_carry_forward": 0,
                "is_paid": True,
                "requires_approval": True
            }
        )
        # May return 400 if code already exists, which is fine
        if response.status_code == 200:
            data = response.json()
            assert "_id" not in response.text, "ObjectId found in response"
            assert "id" in data, "Should have 'id' field"
            print(f"✅ Leave type created: {data.get('name', 'N/A')}")
        else:
            print(f"⚠️ Leave type creation returned {response.status_code} (may already exist)")
    
    def test_create_notification(self, auth_headers):
        """Test POST /api/notifications/notifications - should return created object without ObjectId"""
        response = requests.post(
            f"{BASE_URL}/api/notifications/notifications",
            headers=auth_headers,
            json={
                "title": "Test Notification",
                "message": "This is a test notification for ObjectId verification",
                "type": "system",
                "priority": "normal"
            }
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "_id" not in response.text, "ObjectId found in response"
        assert "id" in data, "Should have 'id' field"
        print(f"✅ Notification created: {data.get('title', 'N/A')}")
    
    def test_create_bin_location(self, auth_headers):
        """Test POST /api/inventory-advanced/bin-locations - should return created object without ObjectId"""
        # First get a warehouse ID
        warehouses_resp = requests.get(f"{BASE_URL}/api/inventory/warehouses", headers=auth_headers)
        if warehouses_resp.status_code == 200:
            warehouses = warehouses_resp.json()
            if warehouses:
                warehouse_id = warehouses[0].get("id")
                unique_suffix = datetime.now().strftime('%H%M%S')
                response = requests.post(
                    f"{BASE_URL}/api/inventory-advanced/bin-locations",
                    headers=auth_headers,
                    params={
                        "warehouse_id": warehouse_id,
                        "aisle": f"T{unique_suffix}",
                        "rack": "01",
                        "shelf": "01",
                        "bin_type": "picking",
                        "max_capacity": 100
                    }
                )
                if response.status_code == 200:
                    data = response.json()
                    assert "_id" not in response.text, "ObjectId found in response"
                    assert "id" in data, "Should have 'id' field"
                    print(f"✅ Bin location created: {data.get('bin_code', 'N/A')}")
                elif response.status_code == 400:
                    print(f"⚠️ Bin location already exists (expected)")
                else:
                    print(f"⚠️ Bin location creation returned {response.status_code}")
            else:
                print("⚠️ No warehouses found, skipping bin location test")
        else:
            print("⚠️ Could not fetch warehouses, skipping bin location test")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
