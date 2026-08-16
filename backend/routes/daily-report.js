const express = require('express');
const router = express.Router();
const db = require('../db'); // Adjust based on your database connection

// GET daily report for a specific date
router.get('/', async (req, res) => {
  try {
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }

    // Fetch production data for the date
    const productionQuery = `
      SELECT 
        p.*,
        i.name as item_name,
        i.unit
      FROM productions p
      LEFT JOIN items i ON p.item_id = i.id
      WHERE DATE(p.production_date) = ?
    `;
    const production = await db.query(productionQuery, [date]);

    // Fetch purchase invoices for the date
    const purchaseQuery = `
      SELECT 
        pi.*,
        v.name as vendor_name,
        v.code as vendor_code
      FROM purchase_invoices pi
      LEFT JOIN vendors v ON pi.vendor_id = v.id
      WHERE DATE(pi.invoice_date) = ?
      ORDER BY pi.created_at DESC
    `;
    const purchaseInvoices = await db.query(purchaseQuery, [date]);

    // Fetch delivery challans for the date
    const deliveryQuery = `
      SELECT 
        dc.*,
        c.name as customer_name,
        c.code as customer_code
      FROM delivery_challans dc
      LEFT JOIN customers c ON dc.customer_id = c.id
      WHERE DATE(dc.challan_date) = ?
      ORDER BY dc.created_at DESC
    `;
    const deliveryChallans = await db.query(deliveryQuery, [date]);

    // Fetch items for each delivery challan
    for (let i = 0; i < deliveryChallans.length; i++) {
      const itemsQuery = `
        SELECT 
          dci.*,
          i.name as item_name,
          i.unit
        FROM delivery_challan_items dci
        LEFT JOIN items i ON dci.item_id = i.id
        WHERE dci.challan_id = ?
      `;
      const items = await db.query(itemsQuery, [deliveryChallans[i].id]);
      deliveryChallans[i].items = items;
    }

    // Fetch payment receipts for the date
    const paymentQuery = `
      SELECT 
        p.*,
        CASE 
          WHEN p.customer_id IS NOT NULL THEN c.name
          WHEN p.vendor_id IS NOT NULL THEN v.name
          ELSE 'Unknown'
        END as party_name,
        p.payment_mode,
        p.payment_type
      FROM payments p
      LEFT JOIN customers c ON p.customer_id = c.id
      LEFT JOIN vendors v ON p.vendor_id = v.id
      WHERE DATE(p.payment_date) = ?
        AND p.payment_type = 'receipt'
      ORDER BY p.created_at DESC
    `;
    const paymentReceipts = await db.query(paymentQuery, [date]);

    // Calculate summaries
    const totalProductionQty = production.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0);
    const totalProductionValue = production.reduce((sum, item) => sum + ((parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0)), 0);
    const totalPurchaseAmount = purchaseInvoices.reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0);
    
    let totalDeliveryQty = 0;
    deliveryChallans.forEach(challan => {
      const challanTotal = (challan.items || []).reduce((sum, item) => sum + (parseFloat(item.qty) || parseFloat(item.quantity) || 0), 0);
      totalDeliveryQty += challanTotal;
    });
    
    const totalPaymentReceived = paymentReceipts.reduce((sum, payment) => sum + (parseFloat(payment.amount) || 0), 0);

    res.json({
      date,
      production,
      purchaseInvoices,
      deliveryChallans,
      paymentReceipts,
      summary: {
        totalProductionQty,
        totalProductionValue,
        totalPurchaseAmount,
        totalDeliveryQty,
        totalPaymentReceived
      }
    });

  } catch (error) {
    console.error('Error fetching daily report:', error);
    res.status(500).json({ error: 'Failed to fetch daily report' });
  }
});

module.exports = router;
