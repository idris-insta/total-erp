#!/usr/bin/env python3
"""
Backend API Testing Script for Adhesive ERP System
Tests all backend endpoints as per review request
"""

import requests
import json
import sys
from datetime import datetime, timedelta
import uuid

# Configuration
BASE_URL = "https://adhesiveerp.preview.emergentagent.com/api"
ADMIN_EMAIL = "admin@instabiz.com"
ADMIN_PASSWORD = "adminpassword"

class APITester:
    def __init__(self):
        self.token = None
        self.session = requests.Session()
        self.test_results = []
        
    def log_test(self, test_name, success, details=""):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details
        })
        
    def make_request(self, method, endpoint, data=None, params=None):
        """Make authenticated API request"""
        url = f"{BASE_URL}{endpoint}"
        headers = {"Content-Type": "application/json"}
        
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
            
        try:
            if method.upper() == "GET":
                response = self.session.get(url, headers=headers, params=params, timeout=30)
            elif method.upper() == "POST":
                response = self.session.post(url, headers=headers, json=data, timeout=30)
            elif method.upper() == "PUT":
                response = self.session.put(url, headers=headers, json=data, timeout=30)
            elif method.upper() == "DELETE":
                response = self.session.delete(url, headers=headers, timeout=30)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            return response
        except requests.exceptions.Timeout:
            print(f"Request timeout for {method} {endpoint}")
            return None
        except requests.exceptions.ConnectionError:
            print(f"Connection error for {method} {endpoint}")
            return None
        except Exception as e:
            print(f"Request failed: {e}")
            return None
    
    def test_auth_login(self):
        """Test 1: POST /api/auth/login"""
        print("\n=== Testing Authentication ===")
        
        response = self.make_request("POST", "/auth/login", {
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        
        if response and response.status_code == 200:
            data = response.json()
            if "token" in data:
                self.token = data["token"]
                self.log_test("Auth Login", True, f"Token received for {data.get('user', {}).get('email')}")
                return True
            else:
                self.log_test("Auth Login", False, "No token in response")
        else:
            status = response.status_code if response else "No response"
            error = response.text if response else "Connection failed"
            self.log_test("Auth Login", False, f"Status: {status}, Error: {error}")
        return False
    
    def test_auth_me(self):
        """Test 2: GET /api/auth/me"""
        response = self.make_request("GET", "/auth/me")
        
        if response and response.status_code == 200:
            data = response.json()
            self.log_test("Auth Me", True, f"User: {data.get('name')} ({data.get('role')})")
            return True
        else:
            status = response.status_code if response else "No response"
            self.log_test("Auth Me", False, f"Status: {status}")
        return False
    
    def test_hrms_employees(self):
        """Test 3-4: HRMS Employee CRUD"""
        print("\n=== Testing HRMS ===")
        
        # Create employee
        employee_data = {
            "employee_code": f"EMP{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "name": "Rajesh Kumar",
            "email": f"rajesh.kumar.{uuid.uuid4().hex[:8]}@instabiz.com",
            "phone": "9876543210",
            "department": "Production",
            "designation": "Machine Operator",
            "location": "Mumbai Plant",
            "date_of_joining": "2024-01-15",
            "shift_timing": "08:00-17:00",
            "basic_salary": 25000.0,
            "hra": 5000.0,
            "pf": 12.0,
            "esi": 1.75,
            "pt": 200.0
        }
        
        response = self.make_request("POST", "/hrms/employees", employee_data)
        
        if response and response.status_code == 200:
            emp_data = response.json()
            employee_id = emp_data.get("id")
            self.log_test("Create Employee", True, f"Employee ID: {employee_id}")
            
            # List employees
            response = self.make_request("GET", "/hrms/employees")
            if response and response.status_code == 200:
                employees = response.json()
                found = any(emp.get("id") == employee_id for emp in employees)
                self.log_test("List Employees", found, f"Found {len(employees)} employees, created employee present: {found}")
                return employee_id
            else:
                self.log_test("List Employees", False, f"Status: {response.status_code if response else 'No response'}")
        else:
            status = response.status_code if response else "No response"
            error = response.text if response else "Connection failed"
            self.log_test("Create Employee", False, f"Status: {status}, Error: {error}")
        return None
    
    def test_hrms_attendance(self, employee_id):
        """Test 5: HRMS Attendance"""
        if not employee_id:
            self.log_test("Mark Attendance", False, "No employee ID available")
            return
            
        today = datetime.now().strftime("%Y-%m-%d")
        attendance_data = {
            "employee_id": employee_id,
            "date": today,
            "check_in": "08:30:00",
            "check_out": "17:15:00",
            "status": "present",
            "hours_worked": 8.75
        }
        
        response = self.make_request("POST", "/hrms/attendance", attendance_data)
        
        if response and response.status_code == 200:
            self.log_test("Mark Attendance", True, f"Attendance marked for {today}")
            
            # Get attendance
            response = self.make_request("GET", "/hrms/attendance", params={"date": today})
            if response and response.status_code == 200:
                attendance_list = response.json()
                found = any(att.get("employee_id") == employee_id for att in attendance_list)
                self.log_test("Get Attendance", found, f"Found {len(attendance_list)} attendance records")
            else:
                self.log_test("Get Attendance", False, f"Status: {response.status_code if response else 'No response'}")
        else:
            status = response.status_code if response else "No response"
            error = response.text if response else "Connection failed"
            self.log_test("Mark Attendance", False, f"Status: {status}, Error: {error}")
    
    def test_hrms_leave_requests(self, employee_id):
        """Test 6: HRMS Leave Requests"""
        if not employee_id:
            self.log_test("Create Leave Request", False, "No employee ID available")
            return
            
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        day_after = (datetime.now() + timedelta(days=2)).strftime("%Y-%m-%d")
        
        leave_data = {
            "employee_id": employee_id,
            "leave_type": "Sick Leave",
            "from_date": tomorrow,
            "to_date": day_after,
            "reason": "Medical checkup and recovery"
        }
        
        response = self.make_request("POST", "/hrms/leave-requests", leave_data)
        
        if response and response.status_code == 200:
            leave_data = response.json()
            leave_id = leave_data.get("id")
            self.log_test("Create Leave Request", True, f"Leave ID: {leave_id}")
            
            # Approve leave
            response = self.make_request("PUT", f"/hrms/leave-requests/{leave_id}/approve")
            if response and response.status_code == 200:
                self.log_test("Approve Leave Request", True, "Leave approved successfully")
            else:
                self.log_test("Approve Leave Request", False, f"Status: {response.status_code if response else 'No response'}")
        else:
            status = response.status_code if response else "No response"
            error = response.text if response else "Connection failed"
            self.log_test("Create Leave Request", False, f"Status: {status}, Error: {error}")
    
    def test_quality_inspections(self):
        """Test 7: Quality Inspections"""
        print("\n=== Testing Quality ===")
        
        inspection_data = {
            "inspection_type": "Incoming Material",
            "reference_type": "Purchase Order",
            "reference_id": f"PO-{uuid.uuid4().hex[:8]}",
            "item_id": f"ITEM-{uuid.uuid4().hex[:8]}",
            "batch_number": f"BATCH-{datetime.now().strftime('%Y%m%d')}-001",
            "test_parameters": [
                {"parameter": "Thickness", "expected": "0.5mm", "actual": "0.52mm", "result": "pass"},
                {"parameter": "Adhesion Strength", "expected": ">2N/cm", "actual": "2.3N/cm", "result": "pass"},
                {"parameter": "Color Match", "expected": "Blue", "actual": "Blue", "result": "pass"}
            ],
            "inspector": "Quality Team",
            "notes": "All parameters within acceptable limits"
        }
        
        response = self.make_request("POST", "/quality/inspections", inspection_data)
        
        if response and response.status_code == 200:
            insp_data = response.json()
            self.log_test("Create QC Inspection", True, f"Inspection: {insp_data.get('inspection_number')}")
            
            # List inspections
            response = self.make_request("GET", "/quality/inspections")
            if response and response.status_code == 200:
                inspections = response.json()
                self.log_test("List QC Inspections", True, f"Found {len(inspections)} inspections")
            else:
                self.log_test("List QC Inspections", False, f"Status: {response.status_code if response else 'No response'}")
        else:
            status = response.status_code if response else "No response"
            error = response.text if response else "Connection failed"
            self.log_test("Create QC Inspection", False, f"Status: {status}, Error: {error}")
    
    def test_quality_complaints(self):
        """Test 8: Quality Complaints"""
        complaint_data = {
            "account_id": f"ACC-{uuid.uuid4().hex[:8]}",
            "invoice_id": f"INV-{uuid.uuid4().hex[:8]}",
            "batch_number": f"BATCH-{datetime.now().strftime('%Y%m%d')}-002",
            "complaint_type": "Adhesion Failure",
            "description": "Customer reported that tape is not sticking properly to cardboard surfaces",
            "severity": "high"
        }
        
        response = self.make_request("POST", "/quality/complaints", complaint_data)
        
        if response and response.status_code == 200:
            complaint_data = response.json()
            self.log_test("Create Complaint", True, f"Complaint: {complaint_data.get('complaint_number')}")
            
            # List complaints
            response = self.make_request("GET", "/quality/complaints")
            if response and response.status_code == 200:
                complaints = response.json()
                self.log_test("List Complaints", True, f"Found {len(complaints)} complaints")
            else:
                self.log_test("List Complaints", False, f"Status: {response.status_code if response else 'No response'}")
        else:
            status = response.status_code if response else "No response"
            error = response.text if response else "Connection failed"
            self.log_test("Create Complaint", False, f"Status: {status}, Error: {error}")
    
    def test_quality_tds(self):
        """Test 9: Quality TDS Documents"""
        tds_data = {
            "item_id": f"ITEM-{uuid.uuid4().hex[:8]}",
            "document_type": "Technical Data Sheet",
            "document_url": "https://example.com/tds/adhesive-tape-001.pdf",
            "version": "v2.1",
            "notes": "Updated specifications for improved adhesion"
        }
        
        response = self.make_request("POST", "/quality/tds", tds_data)
        
        if response and response.status_code == 200:
            tds_data = response.json()
            self.log_test("Create TDS Document", True, f"TDS ID: {tds_data.get('id')}")
            
            # List TDS
            response = self.make_request("GET", "/quality/tds")
            if response and response.status_code == 200:
                tds_list = response.json()
                self.log_test("List TDS Documents", True, f"Found {len(tds_list)} TDS documents")
            else:
                self.log_test("List TDS Documents", False, f"Status: {response.status_code if response else 'No response'}")
        else:
            status = response.status_code if response else "No response"
            error = response.text if response else "Connection failed"
            self.log_test("Create TDS Document", False, f"Status: {status}, Error: {error}")
    
    def test_inventory_setup(self):
        """Test 10: Ensure warehouse and item exist"""
        print("\n=== Testing Inventory Setup ===")
        
        # Check warehouses
        response = self.make_request("GET", "/inventory/warehouses")
        warehouse_id = None
        
        if response and response.status_code == 200:
            warehouses = response.json()
            if warehouses:
                warehouse_id = warehouses[0]["id"]
                self.log_test("Check Warehouses", True, f"Found {len(warehouses)} warehouses")
            else:
                # Create warehouse
                warehouse_data = {
                    "warehouse_code": "WH-MAIN",
                    "warehouse_name": "Main Warehouse",
                    "warehouse_type": "Main",
                    "address": "Industrial Area, Mumbai",
                    "city": "Mumbai",
                    "state": "Maharashtra",
                    "pincode": "400001",
                    "is_active": True
                }
                
                response = self.make_request("POST", "/inventory/warehouses", warehouse_data)
                if response and response.status_code == 200:
                    wh_data = response.json()
                    warehouse_id = wh_data.get("id")
                    self.log_test("Create Warehouse", True, f"Warehouse ID: {warehouse_id}")
                else:
                    self.log_test("Create Warehouse", False, f"Status: {response.status_code if response else 'No response'}")
        else:
            self.log_test("Check Warehouses", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Check items
        response = self.make_request("GET", "/inventory/items")
        item_id = None
        
        if response and response.status_code == 200:
            items = response.json()
            if items:
                item_id = items[0]["id"]
                self.log_test("Check Items", True, f"Found {len(items)} items")
            else:
                # Create item
                item_data = {
                    "item_code": f"TAPE-{datetime.now().strftime('%Y%m%d%H%M%S')}",
                    "item_name": "Double Sided Adhesive Tape",
                    "category": "Adhesive Tapes",
                    "item_type": "Finished Goods",
                    "hsn_code": "39191090",
                    "uom": "Rolls",
                    "thickness": 0.5,
                    "width": 25.0,
                    "length": 50.0,
                    "color": "Clear",
                    "adhesive_type": "Acrylic",
                    "base_material": "PET Film",
                    "grade": "Industrial",
                    "standard_cost": 150.0,
                    "selling_price": 200.0,
                    "min_order_qty": 10,
                    "reorder_level": 50,
                    "safety_stock": 20,
                    "lead_time_days": 7,
                    "is_active": True
                }
                
                response = self.make_request("POST", "/inventory/items", item_data)
                if response and response.status_code == 200:
                    item_data = response.json()
                    item_id = item_data.get("id")
                    self.log_test("Create Item", True, f"Item ID: {item_id}")
                else:
                    self.log_test("Create Item", False, f"Status: {response.status_code if response else 'No response'}")
        else:
            self.log_test("Check Items", False, f"Status: {response.status_code if response else 'No response'}")
        
        return warehouse_id, item_id
    
    def test_production_setup(self):
        """Test 11: Ensure machine exists"""
        print("\n=== Testing Production Setup ===")
        
        response = self.make_request("GET", "/production/machines")
        machine_id = None
        
        if response and response.status_code == 200:
            machines = response.json()
            if machines:
                machine_id = machines[0]["id"]
                self.log_test("Check Machines", True, f"Found {len(machines)} machines")
            else:
                # Create machine
                machine_data = {
                    "machine_code": f"MC-{datetime.now().strftime('%Y%m%d%H%M%S')}",
                    "machine_name": "Tape Coating Machine #1",
                    "machine_type": "Coating",
                    "capacity": 1000.0,
                    "location": "Production Floor A",
                    "status": "active"
                }
                
                response = self.make_request("POST", "/production/machines", machine_data)
                if response and response.status_code == 200:
                    machine_data = response.json()
                    machine_id = machine_data.get("id")
                    self.log_test("Create Machine", True, f"Machine ID: {machine_id}")
                else:
                    self.log_test("Create Machine", False, f"Status: {response.status_code if response else 'No response'}")
        else:
            self.log_test("Check Machines", False, f"Status: {response.status_code if response else 'No response'}")
        
        return machine_id
    
    def test_production_workflow(self, item_id, machine_id):
        """Test 12-15: Production + Inventory Integration"""
        print("\n=== Testing Production Workflow ===")
        
        if not item_id or not machine_id:
            self.log_test("Production Workflow", False, "Missing item_id or machine_id")
            return
        
        # Create work order
        wo_data = {
            "item_id": item_id,
            "quantity_to_make": 100.0,
            "machine_id": machine_id,
            "thickness": 0.5,
            "color": "Clear",
            "width": 25.0,
            "length": 50.0,
            "brand": "InstaBiz",
            "priority": "high"
        }
        
        response = self.make_request("POST", "/production/work-orders", wo_data)
        
        if response and response.status_code == 200:
            wo_data = response.json()
            wo_id = wo_data.get("id")
            self.log_test("Create Work Order", True, f"WO: {wo_data.get('wo_number')}")
            
            # Start work order
            response = self.make_request("PUT", f"/production/work-orders/{wo_id}/start")
            if response and response.status_code == 200:
                self.log_test("Start Work Order", True, "Work order started")
                
                # Create production entry
                production_data = {
                    "wo_id": wo_id,
                    "quantity_produced": 95.0,
                    "wastage": 5.0,
                    "start_time": "08:00:00",
                    "end_time": "16:00:00",
                    "operator": "Rajesh Kumar",
                    "notes": "Production completed successfully with minimal wastage"
                }
                
                response = self.make_request("POST", "/production/production-entries", production_data)
                if response and response.status_code == 200:
                    prod_data = response.json()
                    self.log_test("Create Production Entry", True, f"Batch: {prod_data.get('batch_number')}")
                    
                    # Verify production entries list
                    response = self.make_request("GET", "/production/production-entries")
                    if response and response.status_code == 200:
                        entries = response.json()
                        found = any(entry.get("wo_id") == wo_id for entry in entries)
                        self.log_test("List Production Entries", found, f"Found {len(entries)} entries")
                        
                        # Verify inventory stock balance
                        response = self.make_request("GET", "/inventory/stock/balance", params={"item_id": item_id})
                        if response and response.status_code == 200:
                            balances = response.json()
                            total_qty = sum(bal.get("quantity", 0) for bal in balances)
                            self.log_test("Check Stock Balance", total_qty >= 95, f"Total stock: {total_qty}")
                            
                            # Verify item current_stock
                            response = self.make_request("GET", f"/inventory/items/{item_id}")
                            if response and response.status_code == 200:
                                item_data = response.json()
                                current_stock = item_data.get("current_stock", 0)
                                self.log_test("Check Item Current Stock", current_stock >= 95, f"Current stock: {current_stock}")
                            else:
                                self.log_test("Check Item Current Stock", False, f"Status: {response.status_code if response else 'No response'}")
                        else:
                            self.log_test("Check Stock Balance", False, f"Status: {response.status_code if response else 'No response'}")
                    else:
                        self.log_test("List Production Entries", False, f"Status: {response.status_code if response else 'No response'}")
                else:
                    self.log_test("Create Production Entry", False, f"Status: {response.status_code if response else 'No response'}")
            else:
                self.log_test("Start Work Order", False, f"Status: {response.status_code if response else 'No response'}")
        else:
            status = response.status_code if response else "No response"
            error = response.text if response else "Connection failed"
            self.log_test("Create Work Order", False, f"Status: {status}, Error: {error}")
    
    def test_stock_transfer_approval(self, warehouse_id, item_id):
        """Test 1: Stock Transfer Approval Enforcement"""
        print("\n=== Testing Stock Transfer Approval Enforcement ===")
        
        if not warehouse_id or not item_id:
            self.log_test("Stock Transfer Approval", False, "Missing warehouse_id or item_id")
            return None
            
        # Get warehouses to create transfer between two
        response = self.make_request("GET", "/inventory/warehouses")
        if not response or response.status_code != 200:
            self.log_test("Get Warehouses for Transfer", False, f"Status: {response.status_code if response else 'No response'}")
            return None
            
        warehouses = response.json()
        if len(warehouses) < 2:
            # Create second warehouse
            wh2_data = {
                "warehouse_code": "WH-BRANCH",
                "warehouse_name": "Branch Warehouse",
                "warehouse_type": "Branch",
                "address": "Branch Location, Mumbai",
                "city": "Mumbai",
                "state": "Maharashtra",
                "pincode": "400002",
                "is_active": True
            }
            response = self.make_request("POST", "/inventory/warehouses", wh2_data)
            if response and response.status_code == 200:
                wh2_data = response.json()
                to_warehouse = wh2_data.get("id")
                self.log_test("Create Second Warehouse", True, f"Warehouse ID: {to_warehouse}")
            else:
                self.log_test("Create Second Warehouse", False, f"Status: {response.status_code if response else 'No response'}")
                return None
        else:
            to_warehouse = warehouses[1]["id"]
            
        # Create stock transfer
        transfer_data = {
            "from_warehouse": warehouse_id,
            "to_warehouse": to_warehouse,
            "items": [
                {
                    "item_id": item_id,
                    "quantity": 10.0,
                    "batch_no": f"BATCH-{datetime.now().strftime('%Y%m%d')}-001"
                }
            ],
            "scheduled_date": (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d"),
            "truck_no": "MH01AB1234",
            "driver_name": "Suresh Patil",
            "driver_phone": "9876543210",
            "notes": "Test transfer for approval enforcement"
        }
        
        response = self.make_request("POST", "/inventory/transfers", transfer_data)
        if response and response.status_code == 200:
            transfer = response.json()
            transfer_id = transfer.get("id")
            self.log_test("Create Stock Transfer", True, f"Transfer: {transfer.get('transfer_number')}")
            
            # Verify approval request was auto-created
            response = self.make_request("GET", "/approvals/requests", params={"status": "pending", "module": "Inventory"})
            if response and response.status_code == 200:
                approvals = response.json()
                transfer_approval = next((a for a in approvals if a.get("entity_id") == transfer_id and a.get("entity_type") == "StockTransfer"), None)
                if transfer_approval:
                    self.log_test("Auto-create Approval Request", True, f"Approval ID: {transfer_approval.get('id')}")
                    
                    # Try to issue transfer without approval - should return 409
                    response = self.make_request("PUT", f"/inventory/transfers/{transfer_id}/issue")
                    if response and response.status_code == 409:
                        self.log_test("Block Issue Without Approval", True, "409 Approval required returned")
                        
                        # Approve the request
                        approval_id = transfer_approval.get("id")
                        response = self.make_request("PUT", f"/approvals/requests/{approval_id}/approve", {"notes": "Test approval"})
                        if response and response.status_code == 200:
                            self.log_test("Approve Transfer Request", True, "Approval successful")
                            
                            # Retry issue - should succeed now
                            response = self.make_request("PUT", f"/inventory/transfers/{transfer_id}/issue")
                            if response and response.status_code == 200:
                                self.log_test("Issue After Approval", True, "Transfer issued successfully")
                                return transfer_id
                            else:
                                self.log_test("Issue After Approval", False, f"Status: {response.status_code if response else 'No response'}")
                        else:
                            self.log_test("Approve Transfer Request", False, f"Status: {response.status_code if response else 'No response'}")
                    else:
                        self.log_test("Block Issue Without Approval", False, f"Expected 409, got {response.status_code if response else 'No response'}")
                else:
                    self.log_test("Auto-create Approval Request", False, "No approval request found for transfer")
            else:
                self.log_test("List Approval Requests", False, f"Status: {response.status_code if response else 'No response'}")
        else:
            status = response.status_code if response else "No response"
            error = response.text if response else "Connection failed"
            self.log_test("Create Stock Transfer", False, f"Status: {status}, Error: {error}")
        
        return None
    
    def test_hrms_payroll_approval(self, employee_id):
        """Test 2: HRMS Payroll Approval Enforcement"""
        print("\n=== Testing HRMS Payroll Approval Enforcement ===")
        
        if not employee_id:
            self.log_test("HRMS Payroll Approval", False, "No employee ID available")
            return
            
        payroll_data = {
            "employee_id": employee_id,
            "month": "December",
            "year": 2024,
            "days_present": 22.0,
            "days_absent": 8.0,
            "overtime_hours": 5.0
        }
        
        # First call should return 409 and auto-create approval request
        response = self.make_request("POST", "/hrms/payroll", payroll_data)
        if response and response.status_code == 409:
            self.log_test("Block Payroll Without Approval", True, "409 Approval required returned")
            
            # Verify approval request was auto-created
            response = self.make_request("GET", "/approvals/requests", params={"status": "pending", "module": "HRMS"})
            if response and response.status_code == 200:
                approvals = response.json()
                payroll_approval = next((a for a in approvals if a.get("entity_type") == "Payroll" and a.get("action") == "Payroll Run"), None)
                if payroll_approval:
                    self.log_test("Auto-create Payroll Approval", True, f"Approval ID: {payroll_approval.get('id')}")
                    
                    # Approve the request
                    approval_id = payroll_approval.get("id")
                    response = self.make_request("PUT", f"/approvals/requests/{approval_id}/approve", {"notes": "Test payroll approval"})
                    if response and response.status_code == 200:
                        self.log_test("Approve Payroll Request", True, "Approval successful")
                        
                        # Retry payroll - should succeed now
                        response = self.make_request("POST", "/hrms/payroll", payroll_data)
                        if response and response.status_code == 200:
                            payroll_result = response.json()
                            self.log_test("Generate Payroll After Approval", True, f"Net salary: {payroll_result.get('net_salary')}")
                        else:
                            self.log_test("Generate Payroll After Approval", False, f"Status: {response.status_code if response else 'No response'}")
                    else:
                        self.log_test("Approve Payroll Request", False, f"Status: {response.status_code if response else 'No response'}")
                else:
                    self.log_test("Auto-create Payroll Approval", False, "No payroll approval request found")
            else:
                self.log_test("List Payroll Approvals", False, f"Status: {response.status_code if response else 'No response'}")
        else:
            self.log_test("Block Payroll Without Approval", False, f"Expected 409, got {response.status_code if response else 'No response'}")
    
    def test_production_scrap_approval(self, item_id, machine_id):
        """Test 3: Production Scrap >7% Approval Enforcement"""
        print("\n=== Testing Production Scrap >7% Approval Enforcement ===")
        
        if not item_id or not machine_id:
            self.log_test("Production Scrap Approval", False, "Missing item_id or machine_id")
            return None
            
        # Create work order
        wo_data = {
            "item_id": item_id,
            "quantity_to_make": 100.0,
            "machine_id": machine_id,
            "thickness": 0.5,
            "color": "Clear",
            "width": 25.0,
            "length": 50.0,
            "brand": "InstaBiz",
            "priority": "high"
        }
        
        response = self.make_request("POST", "/production/work-orders", wo_data)
        if response and response.status_code == 200:
            wo = response.json()
            wo_id = wo.get("id")
            self.log_test("Create Work Order for Scrap Test", True, f"WO: {wo.get('wo_number')}")
            
            # Start work order
            response = self.make_request("PUT", f"/production/work-orders/{wo_id}/start")
            if response and response.status_code == 200:
                self.log_test("Start Work Order for Scrap Test", True, "Work order started")
                
                # Create production entry with >7% wastage (8 wastage out of 92 produced = 8.7%)
                production_data = {
                    "wo_id": wo_id,
                    "quantity_produced": 92.0,
                    "wastage": 8.0,  # 8.7% wastage
                    "start_time": "08:00:00",
                    "end_time": "16:00:00",
                    "operator": "Rajesh Kumar",
                    "notes": "Test production with high wastage for approval enforcement"
                }
                
                # First call should return 409 and auto-create approval request
                response = self.make_request("POST", "/production/production-entries", production_data)
                if response and response.status_code == 409:
                    self.log_test("Block High Scrap Without Approval", True, "409 Approval required returned")
                    
                    # Verify approval request was auto-created
                    response = self.make_request("GET", "/approvals/requests", params={"status": "pending", "module": "Production"})
                    if response and response.status_code == 200:
                        approvals = response.json()
                        scrap_approval = next((a for a in approvals if a.get("entity_id") == wo_id and a.get("action") == "Production Scrap"), None)
                        if scrap_approval:
                            self.log_test("Auto-create Scrap Approval", True, f"Approval ID: {scrap_approval.get('id')}")
                            
                            # Approve the request
                            approval_id = scrap_approval.get("id")
                            response = self.make_request("PUT", f"/approvals/requests/{approval_id}/approve", {"notes": "Test scrap approval"})
                            if response and response.status_code == 200:
                                self.log_test("Approve Scrap Request", True, "Approval successful")
                                
                                # Retry production entry - should succeed now and update inventory
                                response = self.make_request("POST", "/production/production-entries", production_data)
                                if response and response.status_code == 200:
                                    prod_result = response.json()
                                    self.log_test("Create Production Entry After Approval", True, f"Batch: {prod_result.get('batch_number')}")
                                    
                                    # Verify inventory stock was updated
                                    response = self.make_request("GET", "/inventory/stock/balance", params={"item_id": item_id})
                                    if response and response.status_code == 200:
                                        balances = response.json()
                                        total_qty = sum(bal.get("quantity", 0) for bal in balances)
                                        self.log_test("Verify Stock Update After Production", total_qty >= 92, f"Total stock: {total_qty}")
                                        return wo_id
                                    else:
                                        self.log_test("Verify Stock Update After Production", False, f"Status: {response.status_code if response else 'No response'}")
                                else:
                                    self.log_test("Create Production Entry After Approval", False, f"Status: {response.status_code if response else 'No response'}")
                            else:
                                self.log_test("Approve Scrap Request", False, f"Status: {response.status_code if response else 'No response'}")
                        else:
                            self.log_test("Auto-create Scrap Approval", False, "No scrap approval request found")
                    else:
                        self.log_test("List Scrap Approvals", False, f"Status: {response.status_code if response else 'No response'}")
                else:
                    self.log_test("Block High Scrap Without Approval", False, f"Expected 409, got {response.status_code if response else 'No response'}")
            else:
                self.log_test("Start Work Order for Scrap Test", False, f"Status: {response.status_code if response else 'No response'}")
        else:
            self.log_test("Create Work Order for Scrap Test", False, f"Status: {response.status_code if response else 'No response'}")
        
        return None
    
    def test_production_cancel_approval(self, item_id, machine_id):
        """Test 4: Production Cancel Work Order Approval Enforcement"""
        print("\n=== Testing Production Cancel Work Order Approval Enforcement ===")
        
        if not item_id or not machine_id:
            self.log_test("Production Cancel Approval", False, "Missing item_id or machine_id")
            return
            
        # Create work order for cancellation test
        wo_data = {
            "item_id": item_id,
            "quantity_to_make": 50.0,
            "machine_id": machine_id,
            "thickness": 0.5,
            "color": "Blue",
            "width": 20.0,
            "length": 30.0,
            "brand": "InstaBiz",
            "priority": "normal"
        }
        
        response = self.make_request("POST", "/production/work-orders", wo_data)
        if response and response.status_code == 200:
            wo = response.json()
            wo_id = wo.get("id")
            self.log_test("Create Work Order for Cancel Test", True, f"WO: {wo.get('wo_number')}")
            
            # First call to cancel should return 409 and auto-create approval request
            response = self.make_request("PUT", f"/production/work-orders/{wo_id}/cancel")
            if response and response.status_code == 409:
                self.log_test("Block Cancel Without Approval", True, "409 Approval required returned")
                
                # Verify approval request was auto-created
                response = self.make_request("GET", "/approvals/requests", params={"status": "pending", "module": "Production"})
                if response and response.status_code == 200:
                    approvals = response.json()
                    cancel_approval = next((a for a in approvals if a.get("entity_id") == wo_id and a.get("action") == "Cancel Production Order"), None)
                    if cancel_approval:
                        self.log_test("Auto-create Cancel Approval", True, f"Approval ID: {cancel_approval.get('id')}")
                        
                        # Approve the request
                        approval_id = cancel_approval.get("id")
                        response = self.make_request("PUT", f"/approvals/requests/{approval_id}/approve", {"notes": "Test cancel approval"})
                        if response and response.status_code == 200:
                            self.log_test("Approve Cancel Request", True, "Approval successful")
                            
                            # Retry cancel - should succeed now and set status to cancelled
                            response = self.make_request("PUT", f"/production/work-orders/{wo_id}/cancel")
                            if response and response.status_code == 200:
                                self.log_test("Cancel Work Order After Approval", True, "Work order cancelled successfully")
                                
                                # Verify work order status is cancelled
                                response = self.make_request("GET", f"/production/work-orders/{wo_id}")
                                if response and response.status_code == 200:
                                    wo_status = response.json()
                                    if wo_status.get("status") == "cancelled":
                                        self.log_test("Verify Cancelled Status", True, "Status set to cancelled")
                                    else:
                                        self.log_test("Verify Cancelled Status", False, f"Status: {wo_status.get('status')}")
                                else:
                                    self.log_test("Verify Cancelled Status", False, f"Status: {response.status_code if response else 'No response'}")
                            else:
                                self.log_test("Cancel Work Order After Approval", False, f"Status: {response.status_code if response else 'No response'}")
                        else:
                            self.log_test("Approve Cancel Request", False, f"Status: {response.status_code if response else 'No response'}")
                    else:
                        self.log_test("Auto-create Cancel Approval", False, "No cancel approval request found")
                else:
                    self.log_test("List Cancel Approvals", False, f"Status: {response.status_code if response else 'No response'}")
            else:
                self.log_test("Block Cancel Without Approval", False, f"Expected 409, got {response.status_code if response else 'No response'}")
        else:
            self.log_test("Create Work Order for Cancel Test", False, f"Status: {response.status_code if response else 'No response'}")

    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting Backend API Tests for Adhesive ERP System - Approval Enforcement Focus")
        print(f"Base URL: {BASE_URL}")
        print("=" * 60)
        
        # Authentication tests
        if not self.test_auth_login():
            print("❌ Authentication failed - stopping tests")
            return
        
        self.test_auth_me()
        
        # Setup required data
        warehouse_id, item_id = self.test_inventory_setup()
        machine_id = self.test_production_setup()
        employee_id = self.test_hrms_employees()
        
        # Approval enforcement tests (main focus)
        self.test_stock_transfer_approval(warehouse_id, item_id)
        self.test_hrms_payroll_approval(employee_id)
        self.test_production_scrap_approval(item_id, machine_id)
        self.test_production_cancel_approval(item_id, machine_id)
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result["success"])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total*100):.1f}%")
        
        if total - passed > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  - {result['test']}: {result['details']}")
        
        return passed == total

if __name__ == "__main__":
    tester = APITester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)