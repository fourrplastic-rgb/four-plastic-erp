from models.purchase_invoice_model import PurchaseInvoiceModel

try:
    print("Fetching lots...")
    lots = PurchaseInvoiceModel.get_lots()
    print("Found lots:", len(lots))
    if lots:
        print("First lot:", lots[0])
except Exception as e:
    import traceback
    traceback.print_exc()
