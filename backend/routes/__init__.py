# Remove these lines
# from .finished_goods_routes import finished_goods_bp
# from .raw_materials_routes import raw_materials_bp

# Your other imports remain the same
from .bank_routes import bank_bp
from .company_routes import company_bp
from .customer_ledger_routes import customer_ledger_bp
from .customer_payments_routes import customer_payments_bp
from .customer_routes import customer_bp
from .delivery_challan_routes import delivery_challan_bp
from .item_routes import item_bp
from .production_routes import production_bp
from .purchase_invoice_routes import purchase_invoice_bp
from .sales_invoice_routes import sales_invoice_bp
from .stock_routes import stock_bp
from .vendor_ledger_routes import vendor_ledger_bp
from .vendor_payments_routes import vendor_payments_bp
from .vendor_routes import vendor_bp

__all__ = [
    'bank_routes',
    'company_routes',
    'customer_ledger_routes',
    'customer_payments_routes',
    'customer_routes',
    'delivery_challan_routes',
    'item_routes',
    'production_routes',
    'purchase_invoice_routes',
    'sales_invoice_routes',
    'stock_routes',
    'vendor_ledger_routes',
    'vendor_payments_routes',
    'vendor_routes'
]