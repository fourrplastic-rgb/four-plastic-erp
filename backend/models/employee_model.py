from . import Model

class EmployeeModel(Model):
    def __init__(self):
        super().__init__()
        self.table = 'employees'
    
    def get_all(self, status=None, department=None, search=None):
        query = "SELECT * FROM employees WHERE 1=1"
        params = []
        
        if status and status != 'all':
            query += " AND status = ?"
            params.append(status)
        
        if department and department != 'all':
            query += " AND department = ?"
            params.append(department)
        
        if search:
            query += """ AND (first_name LIKE ? OR last_name LIKE ? OR 
                             employee_code LIKE ? OR email LIKE ? OR phone LIKE ?)"""
            search_term = f"%{search}%"
            params.extend([search_term, search_term, search_term, search_term, search_term])
        
        query += " ORDER BY first_name ASC"
        return self.execute_query(query, params)
    
    def get_by_id(self, employee_id):
        query = "SELECT * FROM employees WHERE id = ?"
        result = self.execute_query(query, (employee_id,))
        return result[0] if result else None
    
    def create(self, data):
        # Generate employee code if not provided
        if 'employee_code' not in data or not data['employee_code']:
            last = self.execute_query("SELECT employee_code FROM employees ORDER BY id DESC LIMIT 1")
            if last:
                last_code = last[0][0]
                num = int(last_code.replace('EMP', '')) + 1
                data['employee_code'] = f"EMP{num:03d}"
            else:
                data['employee_code'] = "EMP001"
        
        # Build insert query
        columns = []
        placeholders = []
        values = []
        
        for key, value in data.items():
            if value is not None:
                columns.append(key)
                placeholders.append('?')
                values.append(value)
        
        query = f"INSERT INTO employees ({', '.join(columns)}) VALUES ({', '.join(placeholders)})"
        return self.execute_insert(query, values)
    
    def update(self, employee_id, data):
        set_clause = []
        values = []
        
        for key, value in data.items():
            if key not in ['id', 'created_at'] and value is not None:
                set_clause.append(f"{key} = ?")
                values.append(value)
        
        values.append(employee_id)
        query = f"UPDATE employees SET {', '.join(set_clause)} WHERE id = ?"
        return self.execute_update(query, values)
    
    def delete(self, employee_id):
        query = "DELETE FROM employees WHERE id = ?"
        return self.execute_update(query, (employee_id,))
    
    def get_last_code(self):
        query = "SELECT employee_code FROM employees ORDER BY employee_code DESC LIMIT 1"
        result = self.execute_query(query)
        return result[0][0] if result else 'EMP000'