import datetime

class AccountingHook:
    """Helper methods to automatically post double-entry transactions from modules."""
    
    @staticmethod
    def _get_or_create_ledger(cursor, name, group_name, balance_type='DR'):
        """Fetch a ledger ID, or create it if missing"""
        cursor.execute("SELECT id FROM ledgers WHERE name = ?", (name,))
        res = cursor.fetchone()
        if res:
            return res[0]
            
        # Get Group ID
        cursor.execute("SELECT id FROM ledger_groups WHERE name = ?", (group_name,))
        grp = cursor.fetchone()
        if not grp:
            # Fallback
            cursor.execute("SELECT id FROM ledger_groups LIMIT 1")
            grp = cursor.fetchone()
            
        cursor.execute(
            "INSERT INTO ledgers (name, group_id, balance_type, is_system) VALUES (?, ?, ?, 1)", 
            (name, grp[0], balance_type)
        )
        return cursor.lastrowid
        
    @staticmethod
    def generate_voucher_no(cursor):
        date_str = datetime.datetime.now().strftime('%y%m')
        prefix = f"JV{date_str}"
        cursor.execute('''
            SELECT voucher_no FROM journal_vouchers 
            WHERE voucher_no LIKE ? 
            ORDER BY voucher_no DESC LIMIT 1
        ''', (f"{prefix}%",))
        row = cursor.fetchone()
        if row:
            last_no = row[0]
            try:
                # Extract the last 4 digits
                last_num = int(last_no[-4:])
                new_num = last_num + 1
            except Exception:
                new_num = 1
            return f"{prefix}{new_num:04d}"
        else:
            return f"{prefix}0001"

    @staticmethod
    def post_sales_invoice(cursor, invoice_no, customer_id, taxable_amount, cgst, sgst, igst, grand_total):
        """Debits AR, Credits Sales and GST Payable"""
        
        ar_ledger = AccountingHook._get_or_create_ledger(cursor, 'Accounts Receivable (Control)', 'Sundry Debtors', 'DR')
        sales_ledger = AccountingHook._get_or_create_ledger(cursor, 'Sales Account', 'Sales Accounts', 'CR')
        cgst_ledger = AccountingHook._get_or_create_ledger(cursor, 'CGST Payable', 'Duties & Taxes', 'CR')
        sgst_ledger = AccountingHook._get_or_create_ledger(cursor, 'SGST Payable', 'Duties & Taxes', 'CR')
        igst_ledger = AccountingHook._get_or_create_ledger(cursor, 'IGST Payable', 'Duties & Taxes', 'CR')
        
        voucher_no = AccountingHook.generate_voucher_no(cursor)
        today = datetime.date.today().isoformat()
        
        # Insert Header Let's tie reference to invoice_no
        cursor.execute('''
            INSERT INTO journal_vouchers (voucher_no, voucher_date, reference_no, notes)
            VALUES (?, ?, ?, ?)
        ''', (voucher_no, today, invoice_no, f"Auto-posted from Sales Invoice {invoice_no}"))
        voucher_id = cursor.lastrowid
        
        # DEBIT: AR
        cursor.execute('''
            INSERT INTO journal_entries (voucher_id, ledger_id, debit, credit)
            VALUES (?, ?, ?, 0)
        ''', (voucher_id, ar_ledger, grand_total))
        
        # CREDIT: Sales
        if taxable_amount > 0:
            cursor.execute('''
                INSERT INTO journal_entries (voucher_id, ledger_id, debit, credit)
                VALUES (?, ?, 0, ?)
            ''', (voucher_id, sales_ledger, taxable_amount))
            
        # CREDIT: Taxes
        if cgst > 0:
            cursor.execute('INSERT INTO journal_entries(voucher_id, ledger_id, debit, credit) VALUES(?, ?, 0, ?)', (voucher_id, cgst_ledger, cgst))
        if sgst > 0:
            cursor.execute('INSERT INTO journal_entries(voucher_id, ledger_id, debit, credit) VALUES(?, ?, 0, ?)', (voucher_id, sgst_ledger, sgst))
        if igst > 0:
            cursor.execute('INSERT INTO journal_entries(voucher_id, ledger_id, debit, credit) VALUES(?, ?, 0, ?)', (voucher_id, igst_ledger, igst))

    @staticmethod
    def post_purchase_invoice(cursor, invoice_no, vendor_id, taxable_amount, cgst, sgst, igst, grand_total):
        """Debits Purchases and Input GST, Credits AP"""
        
        ap_ledger = AccountingHook._get_or_create_ledger(cursor, 'Accounts Payable (Control)', 'Sundry Creditors', 'CR')
        purchase_ledger = AccountingHook._get_or_create_ledger(cursor, 'Purchase Account', 'Purchase Accounts', 'DR')
        cgst_ledger = AccountingHook._get_or_create_ledger(cursor, 'Input CGST', 'Duties & Taxes', 'DR')
        sgst_ledger = AccountingHook._get_or_create_ledger(cursor, 'Input SGST', 'Duties & Taxes', 'DR')
        igst_ledger = AccountingHook._get_or_create_ledger(cursor, 'Input IGST', 'Duties & Taxes', 'DR')
        
        voucher_no = AccountingHook.generate_voucher_no(cursor)
        today = datetime.date.today().isoformat()
        
        # Insert Header 
        cursor.execute('''
            INSERT INTO journal_vouchers (voucher_no, voucher_date, reference_no, notes)
            VALUES (?, ?, ?, ?)
        ''', (voucher_no, today, invoice_no, f"Auto-posted from Purchase Invoice {invoice_no}"))
        voucher_id = cursor.lastrowid
        
        # CREDIT: AP
        cursor.execute('INSERT INTO journal_entries (voucher_id, ledger_id, debit, credit) VALUES (?, ?, 0, ?)', (voucher_id, ap_ledger, grand_total))
        
        # DEBIT: Purchases & Taxes
        if taxable_amount > 0:
            cursor.execute('INSERT INTO journal_entries (voucher_id, ledger_id, debit, credit) VALUES (?, ?, ?, 0)', (voucher_id, purchase_ledger, taxable_amount))
        if cgst > 0:
             cursor.execute('INSERT INTO journal_entries (voucher_id, ledger_id, debit, credit) VALUES (?, ?, ?, 0)', (voucher_id, cgst_ledger, cgst))
        if sgst > 0:
             cursor.execute('INSERT INTO journal_entries (voucher_id, ledger_id, debit, credit) VALUES (?, ?, ?, 0)', (voucher_id, sgst_ledger, sgst))
        if igst > 0:
             cursor.execute('INSERT INTO journal_entries (voucher_id, ledger_id, debit, credit) VALUES (?, ?, ?, 0)', (voucher_id, igst_ledger, igst))

    @staticmethod
    def post_payment_receipt(cursor, receipt_no, customer_id, amount, bank_id=None):
        """Debit Bank/Cash, Credit AR"""
        ar_ledger = AccountingHook._get_or_create_ledger(cursor, 'Accounts Receivable (Control)', 'Sundry Debtors', 'DR')
        cash_ledger = AccountingHook._get_or_create_ledger(cursor, 'Main Cash', 'Cash in Hand', 'DR')
        # Here we could map `bank_id` to a dynamic bank ledger, but we will default to Cash
        
        voucher_no = AccountingHook.generate_voucher_no(cursor)
        
        cursor.execute('''
            INSERT INTO journal_vouchers (voucher_no, voucher_date, reference_no, notes)
            VALUES (?, ?, ?, ?)
        ''', (voucher_no, datetime.date.today().isoformat(), receipt_no, f"Customer Payment Receipt"))
        voucher_id = cursor.lastrowid
        
        cursor.execute('INSERT INTO journal_entries (voucher_id, ledger_id, debit, credit) VALUES (?, ?, ?, 0)', (voucher_id, cash_ledger, amount))
        cursor.execute('INSERT INTO journal_entries (voucher_id, ledger_id, debit, credit) VALUES (?, ?, 0, ?)', (voucher_id, ar_ledger, amount))

    @staticmethod
    def post_payment_made(cursor, payment_no, vendor_id, amount, bank_id=None):
        """Debit AP, Credit Bank/Cash"""
        ap_ledger = AccountingHook._get_or_create_ledger(cursor, 'Accounts Payable (Control)', 'Sundry Creditors', 'CR')
        cash_ledger = AccountingHook._get_or_create_ledger(cursor, 'Main Cash', 'Cash in Hand', 'DR')
        
        voucher_no = AccountingHook.generate_voucher_no(cursor)
        
        cursor.execute('INSERT INTO journal_vouchers (voucher_no, voucher_date, reference_no, notes) VALUES (?, ?, ?, ?)', (voucher_no, datetime.date.today().isoformat(), payment_no, f"Vendor Payment"))
        voucher_id = cursor.lastrowid
        
        cursor.execute('INSERT INTO journal_entries (voucher_id, ledger_id, debit, credit) VALUES (?, ?, ?, 0)', (voucher_id, ap_ledger, amount))
        cursor.execute('INSERT INTO journal_entries (voucher_id, ledger_id, debit, credit) VALUES (?, ?, 0, ?)', (voucher_id, cash_ledger, amount))

    @staticmethod
    def post_stock_adjustment(cursor, adjustment_no, amount, is_addition):
        """Debit/Credit Stock Account vs Stock Adjustments Expense"""
        stock_account = AccountingHook._get_or_create_ledger(cursor, 'Stock Account', 'Current Assets', 'DR')
        adj_expense = AccountingHook._get_or_create_ledger(cursor, 'Stock Adjustments', 'Direct Expenses', 'DR')
        
        voucher_no = AccountingHook.generate_voucher_no(cursor)
        today = datetime.date.today().isoformat()
        
        cursor.execute('''
            INSERT INTO journal_vouchers (voucher_no, voucher_date, reference_no, notes)
            VALUES (?, ?, ?, ?)
        ''', (voucher_no, today, adjustment_no, f"Stock Adjustment {adjustment_no}"))
        voucher_id = cursor.lastrowid
        
        if is_addition:
            # Debit Stock, Credit Adjustments (Expense reduction)
            cursor.execute('INSERT INTO journal_entries (voucher_id, ledger_id, debit, credit) VALUES (?, ?, ?, 0)', (voucher_id, stock_account, amount))
            cursor.execute('INSERT INTO journal_entries (voucher_id, ledger_id, debit, credit) VALUES (?, ?, 0, ?)', (voucher_id, adj_expense, amount))
        else:
            # Debit Adjustments (Expense), Credit Stock
            cursor.execute('INSERT INTO journal_entries (voucher_id, ledger_id, debit, credit) VALUES (?, ?, ?, 0)', (voucher_id, adj_expense, amount))
            cursor.execute('INSERT INTO journal_entries (voucher_id, ledger_id, debit, credit) VALUES (?, ?, 0, ?)', (voucher_id, stock_account, amount))
        
        return voucher_id

    @staticmethod
    def post_delivery_challan_freight(cursor, challan_no, transporter_name, freight_charges):
        """Debit Transport Freight (Direct Expense), Credit Transporter Ledger (Sundry Creditors)"""
        if not freight_charges or float(freight_charges) <= 0 or not transporter_name:
            return None
            
        transporter_name = transporter_name.strip()
        if not transporter_name:
            return None
            
        freight_ledger = AccountingHook._get_or_create_ledger(cursor, 'Transport Freight', 'Direct Expenses', 'DR')
        driver_ledger = AccountingHook._get_or_create_ledger(cursor, transporter_name, 'Sundry Creditors', 'CR')
        
        voucher_no = AccountingHook.generate_voucher_no(cursor)
        today = datetime.date.today().isoformat()
        
        cursor.execute('''
            INSERT INTO journal_vouchers (voucher_no, voucher_date, reference_no, notes)
            VALUES (?, ?, ?, ?)
        ''', (voucher_no, today, challan_no, f"Freight Charges for Delivery Challan {challan_no}"))
        voucher_id = cursor.lastrowid
        
        # Debit: Transport Freight (Expense)
        cursor.execute('INSERT INTO journal_entries (voucher_id, ledger_id, debit, credit) VALUES (?, ?, ?, 0)', (voucher_id, freight_ledger, float(freight_charges)))
        
        # Credit: Driver/Transporter Ledger (Payable)
        cursor.execute('INSERT INTO journal_entries (voucher_id, ledger_id, debit, credit) VALUES (?, ?, 0, ?)', (voucher_id, driver_ledger, float(freight_charges)))
        
        return voucher_id

    @staticmethod
    def reverse_delivery_challan_freight(cursor, challan_no):
        """Delete any existing freight journal vouchers for a delivery challan"""
        cursor.execute('''
            SELECT id FROM journal_vouchers 
            WHERE reference_no = ? AND notes LIKE 'Freight Charges for Delivery Challan %'
        ''', (challan_no,))
        vouchers = cursor.fetchall()
        
        for v in vouchers:
            cursor.execute('DELETE FROM journal_entries WHERE voucher_id = ?', (v[0],))
            cursor.execute('DELETE FROM journal_vouchers WHERE id = ?', (v[0],))
