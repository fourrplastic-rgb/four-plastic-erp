from . import Model
from datetime import datetime

class AttendanceModel(Model):
    def __init__(self):
        super().__init__()
        self.table = 'attendance'
    
    def get_by_date(self, date=None):
        if not date:
            date = datetime.now().strftime('%Y-%m-%d')
        
        query = """
            SELECT a.*, 
                   e.first_name, e.last_name, e.employee_code, e.department
            FROM attendance a
            LEFT JOIN employees e ON a.employee_id = e.id
            WHERE a.date = ?
            ORDER BY e.first_name
        """
        return self.execute_query(query, (date,))
    
    def get_today_summary(self):
        today = datetime.now().strftime('%Y-%m-%d')
        query = """
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present,
                SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent,
                SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late,
                SUM(CASE WHEN status = 'halfday' THEN 1 ELSE 0 END) as halfday,
                SUM(CASE WHEN status = 'leave' THEN 1 ELSE 0 END) as leave
            FROM attendance 
            WHERE date = ?
        """
        result = self.execute_query(query, (today,))
        return result[0] if result else {}
    
    def mark(self, data):
        # Check if exists
        check_query = "SELECT id FROM attendance WHERE employee_id = ? AND date = ?"
        existing = self.execute_query(check_query, (data['employee_id'], data['date']))
        
        if existing:
            # Update
            set_clause = []
            values = []
            for key, value in data.items():
                if key not in ['id', 'created_at']:
                    set_clause.append(f"{key} = ?")
                    values.append(value)
            values.append(existing[0][0])
            query = f"UPDATE attendance SET {', '.join(set_clause)} WHERE id = ?"
            return self.execute_update(query, values)
        else:
            # Insert
            columns = []
            placeholders = []
            values = []
            for key, value in data.items():
                columns.append(key)
                placeholders.append('?')
                values.append(value)
            query = f"INSERT INTO attendance ({', '.join(columns)}) VALUES ({', '.join(placeholders)})"
            return self.execute_insert(query, values)