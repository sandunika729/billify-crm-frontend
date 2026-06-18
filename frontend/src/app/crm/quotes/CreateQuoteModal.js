import React, { useState, useEffect } from 'react';
import quoteService from '../../../services/quoteService';
import customerService from '../../../services/customerService';
import dealService from '../../../services/dealService';
import styles from './CreateQuoteModal.module.css';
import { X, Save, Plus, Trash2 } from 'lucide-react';
import Button from '../../../components/ui/Button';
import FormField from '../../../components/forms/FormField';
import Modal from '../../../components/modals/Modal';

export default function CreateQuoteModal({ isOpen, onClose, onSave }) {
  const [customers, setCustomers] = useState([]);
  const [deals, setDeals] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    customer_id: '',
    deal_id: '',
    valid_until: '',
    notes: '',
    status: 'draft'
  });

  const [items, setItems] = useState([
    { id: Date.now(), product_id: '', item_name: '', qty: 1, unit_price_lkr: 0, discount_lkr: 0, tax_lkr: 0, line_total_lkr: 0 }
  ]);

  useEffect(() => {
    if (isOpen) {
      fetchFormData();
      
      const savedCart = localStorage.getItem('crm_quote_cart');
      if (savedCart) {
        try {
          const cartItems = JSON.parse(savedCart);
          if (cartItems && cartItems.length > 0) {
            setItems(cartItems.map((item, idx) => ({
              id: Date.now() + idx,
              product_id: item.product_id,
              item_name: item.item_name,
              qty: item.qty,
              unit_price_lkr: item.unit_price_lkr,
              discount_lkr: 0,
              tax_lkr: 0,
              line_total_lkr: Number(item.qty) * Number(item.unit_price_lkr)
            })));
          }
          localStorage.removeItem('crm_quote_cart');
        } catch(e) {}
      }

      const savedPrefill = localStorage.getItem('crm_quote_prefill');
      if (savedPrefill) {
        try {
          const prefill = JSON.parse(savedPrefill);
          if (prefill.customer_id || prefill.deal_id) {
            setFormData(prev => ({
              ...prev,
              customer_id: prefill.customer_id || prev.customer_id,
              deal_id: prefill.deal_id || prev.deal_id,
            }));
          }
          localStorage.removeItem('crm_quote_prefill');
        } catch(e) {}
      }
    }
  }, [isOpen]);

  const fetchFormData = async () => {
    try {
      const [custRes, dealRes] = await Promise.all([
        customerService.getAllCustomers(),
        dealService.getAllDeals()
      ]);
      if (custRes.success) setCustomers(Array.isArray(custRes.data) ? custRes.data : custRes.data?.rows || []);
      if (dealRes.success) setDeals(Array.isArray(dealRes.data) ? dealRes.data : dealRes.data?.rows || []);
    } catch (error) {
      console.error('Failed to fetch quote form data:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    
    if (name === 'deal_id' && value) {
      const selectedDeal = deals.find(d => d.id == value);
      if (selectedDeal) {
        
        if (!formData.customer_id && selectedDeal.customer_id) {
          setFormData(prev => ({ ...prev, deal_id: value, customer_id: String(selectedDeal.customer_id) }));
        }

        
        let productsList = selectedDeal.products_interest;
        if (typeof productsList === 'string') {
          try { productsList = JSON.parse(productsList); } catch { productsList = []; }
        }
        if (!Array.isArray(productsList)) productsList = [];

        if (productsList.length > 0) {
          const autoItems = productsList.map((sp, idx) => ({
            id: Date.now() + idx,
            product_id: sp.product_id || '',
            item_name: sp.product_name || sp.item_name || sp.description || '',
            qty: Number(sp.qty) || 1,
            unit_price_lkr: Number(sp.unit_price) || Number(sp.unit_price_lkr) || 0,
            discount_lkr: 0,
            tax_lkr: 0,
            line_total_lkr: (Number(sp.qty) || 1) * (Number(sp.unit_price) || Number(sp.unit_price_lkr) || 0),
          }));
          setItems(autoItems);
        }
      }
    }
  };

  const handleItemChange = (id, field, value) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        
        const qty = Number(updatedItem.qty) || 0;
        const price = Number(updatedItem.unit_price_lkr) || 0;
        const discount = Number(updatedItem.discount_lkr) || 0;
        const tax = Number(updatedItem.tax_lkr) || 0;
        
        updatedItem.line_total_lkr = (qty * price) - discount + tax;
        return updatedItem;
      }
      return item;
    }));
  };

  const addItem = () => {
    setItems(prev => [
      ...prev, 
      { id: Date.now(), product_id: '', item_name: '', qty: 1, unit_price_lkr: 0, discount_lkr: 0, tax_lkr: 0, line_total_lkr: 0 }
    ]);
  };

  const removeItem = (id) => {
    if (items.length > 1) {
      setItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const subtotal = items.reduce((sum, item) => sum + ((Number(item.qty) || 0) * (Number(item.unit_price_lkr) || 0)), 0);
  const totalDiscount = items.reduce((sum, item) => sum + (Number(item.discount_lkr) || 0), 0);
  const totalTax = items.reduce((sum, item) => sum + (Number(item.tax_lkr) || 0), 0);
  const grandTotal = subtotal - totalDiscount + totalTax;

  const handleSaveQuote = async (e) => {
    e.preventDefault();
    if (!formData.customer_id) return alert('Please select a customer.');
    
    setIsSubmitting(true);
    
    const quotePayload = {
      ...formData,
      title: formData.title || `Quote for ${customers.find(c => c.id == formData.customer_id)?.name || 'Customer'}`,
      discount_amount: totalDiscount,
      tax_amount: totalTax,
      items: items.map(item => ({
        product_id: item.product_id || null,
        description: item.item_name || 'Custom Item',
        quantity: Number(item.qty),
        unit_price: Number(item.unit_price_lkr)
      }))
    };

    try {
      const res = await quoteService.createQuote(quotePayload);
      if (res.success) {
        
        localStorage.removeItem('crm_quote_cart');
        
        onSave();
        onClose();
        
        setFormData({ customer_id: '', deal_id: '', valid_until: '', notes: '', status: 'draft' });
        setItems([{ id: Date.now(), product_id: '', item_name: '', qty: 1, unit_price_lkr: 0, discount_lkr: 0, tax_lkr: 0, line_total_lkr: 0 }]);
      }
    } catch (error) {
      console.error('Failed to create quote:', error);
      alert('Error saving quotation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Quotation"
      maxWidth="1000px"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" icon={Save} onClick={handleSaveQuote} disabled={isSubmitting} isLoading={isSubmitting}>
            Save Quote
          </Button>
        </>
      }
    >
      <div className={styles.builderGrid}>
        <div className={styles.mainContent}>
          <div className={styles.card}>
                <h3>Quote Details</h3>
                <div className={styles.formGrid}>
                  <FormField 
                    label="Customer *" type="select" name="customer_id" value={formData.customer_id} onChange={handleInputChange} required
                    options={[
                      { value: '', label: '-- Select Customer --' },
                      ...customers.map(c => ({ value: c.id, label: `${c.name} ${c.company_name ? `(${c.company_name})` : ''}` }))
                    ]}
                  />

                  <FormField 
                    label="Related Deal (Optional)" type="select" name="deal_id" value={formData.deal_id} onChange={handleInputChange}
                    options={[
                      { value: '', label: '-- Select Deal --' },
                      ...deals.map(d => ({ value: d.id, label: d.title }))
                    ]}
                  />

                  <FormField label="Valid Until" type="date" name="valid_until" value={formData.valid_until} onChange={handleInputChange} />

                  <FormField 
                    label="Initial Status" type="select" name="status" value={formData.status} onChange={handleInputChange}
                    options={[
                      { value: 'draft', label: 'Draft' },
                      { value: 'sent', label: 'Sent' }
                    ]}
                  />
                </div>
              </div>

              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <h3>Line Items</h3>
                </div>
                
                <div className={styles.itemsTableWrapper}>
                  <table className={styles.itemsTable}>
                    <thead>
                      <tr>
                        <th>Product / Item Name</th>
                        <th width="80">Qty</th>
                        <th width="120">Unit Price (Rs)</th>
                        <th width="100">Discount (Rs)</th>
                        <th width="100">Tax (Rs)</th>
                        <th width="120">Line Total</th>
                        <th width="50"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <div className={styles.itemSelectWrapper}>
                              <input 
                                type="text" 
                                placeholder="Item description" 
                                value={item.item_name}
                                onChange={(e) => handleItemChange(item.id, 'item_name', e.target.value)}
                              />
                            </div>
                          </td>
                          <td>
                            <input 
                              type="number" 
                              min="1" 
                              value={item.qty}
                              onChange={(e) => handleItemChange(item.id, 'qty', e.target.value)}
                            />
                          </td>
                          <td>
                            <input 
                              type="number" 
                              min="0" 
                              value={item.unit_price_lkr}
                              onChange={(e) => handleItemChange(item.id, 'unit_price_lkr', e.target.value)}
                            />
                          </td>
                          <td>
                            <input 
                              type="number" 
                              min="0" 
                              value={item.discount_lkr}
                              onChange={(e) => handleItemChange(item.id, 'discount_lkr', e.target.value)}
                            />
                          </td>
                          <td>
                            <input 
                              type="number" 
                              min="0" 
                              value={item.tax_lkr}
                              onChange={(e) => handleItemChange(item.id, 'tax_lkr', e.target.value)}
                            />
                          </td>
                          <td className={styles.lineTotalCell}>
                            Rs. {item.line_total_lkr.toLocaleString(undefined, {minimumFractionDigits: 2})}
                          </td>
                          <td>
                            <button className={styles.deleteItemBtn} onClick={() => removeItem(item.id)} disabled={items.length === 1}>
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className={styles.addItemRow}>
                  <Button variant="secondary" icon={Plus} onClick={addItem}>
                    Add Item
                  </Button>
                </div>
              </div>
            </div>

            <div className={styles.sidebarContent}>
              <div className={styles.card}>
                <h3>Quote Summary</h3>
                <div className={styles.summaryList}>
                  <div className={styles.summaryRow}>
                    <span>Subtotal</span>
                    <span>Rs. {subtotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span>Discount</span>
                    <span className={styles.textDanger}>- Rs. {totalDiscount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span>Tax</span>
                    <span>+ Rs. {totalTax.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                  </div>
                  <div className={styles.summaryTotalRow}>
                    <span>Total Amount</span>
                    <span className={styles.grandTotal}>Rs. {grandTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                  </div>
                </div>

                <div className={styles.notesSection}>
                  <label>Customer Notes / Terms</label>
                  <textarea 
                    rows="4" 
                    placeholder="Add terms and conditions or notes for the customer..."
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                  ></textarea>
                </div>
              </div>
            </div>
      </div>
    </Modal>
  );
}
