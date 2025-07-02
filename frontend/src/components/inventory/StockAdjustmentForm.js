import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import inventoryService from '../../services/inventoryService';
import { format } from 'date-fns';

// Get transaction types from backend or define statically if they are fixed
// For now, static, matching backend model choices
const transactionTypes = [
    { value: 'IN', label: 'Stock In (Receive)' },
    { value: 'OUT', label: 'Stock Out (Issue/Use)' },
    { value: 'ADJ', label: 'Adjustment (Correction)' },
];

const StockAdjustmentForm = () => {
    const { id: itemId } = useParams(); // Item ID from URL
    const navigate = useNavigate();
    const location = useLocation(); // To get item name if passed in state

    const [itemName, setItemName] = useState(location.state?.itemName || '');
    const [currentQuantity, setCurrentQuantity] = useState(location.state?.currentQuantity || null);

    const [formData, setFormData] = useState({
        transaction_type: 'ADJ', // Default to adjustment
        quantity: '',
        notes: '',
        transaction_date: new Date().toISOString().split('T')[0], // Not directly on backend model, but good for UI
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [formErrors, setFormErrors] = useState({});

    useEffect(() => {
        if (itemId && (!itemName || currentQuantity === null)) { // Fetch item details if not passed in state
            inventoryService.getItemById(itemId)
                .then(response => {
                    setItemName(response.data.name);
                    setCurrentQuantity(parseFloat(response.data.quantity_on_hand));
                })
                .catch(err => {
                    console.error("Failed to fetch item details for adjustment form", err);
                    setError("Could not load item details.");
                });
        }
    }, [itemId, itemName, currentQuantity]);


    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setFormErrors(prev => ({ ...prev, [name]: null }));
    };

    const validate = () => {
        const errors = {};
        if (!formData.transaction_type) errors.transaction_type = "Transaction type is required.";
        if (!formData.quantity || parseFloat(formData.quantity) === 0) {
            errors.quantity = "Quantity is required and cannot be zero.";
        } else if (formData.transaction_type === 'ADJ') {
            // For ADJ, quantity is delta. Backend will validate if it leads to negative stock.
            // No positive check here for ADJ quantity.
        } else { // IN or OUT
            if (parseFloat(formData.quantity) < 0) errors.quantity = "Quantity must be positive for IN/OUT.";
        }

        if (formData.transaction_type === 'OUT' && currentQuantity !== null && parseFloat(formData.quantity) > currentQuantity) {
            errors.quantity = `Cannot stock out more than available (${currentQuantity}).`;
        }
        // Note: The "Quantity must be positive" issue for ADJ with negative values is a known backend validation puzzle.
        // This form currently doesn't easily support negative input for ADJ delta if that backend issue persists.
        // For now, this form assumes ADJ delta is positive (for adding) or user uses OUT for subtracting.
        // Or, the backend logic for ADJ quantity (being the *new total*) would simplify this.
        // The current backend `InventoryTransactionSerializer.validate` expects ADJ quantity to be the *delta*.

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) {
            setError("Please correct form errors.");
            return;
        }
        setError(null);
        setLoading(true);

        const payload = {
            item: parseInt(itemId), // item ID
            transaction_type: formData.transaction_type,
            quantity: formData.quantity, // Sent as string, backend serializer handles Decimal conversion
            notes: formData.notes,
            // transaction_date is handled by backend (auto_now_add)
        };

        try {
            // We can use either the standalone transaction endpoint or the item's adjust-stock action
            // Using adjust-stock action if type is ADJ might be more semantic for that specific case.
            // For IN/OUT, the general transaction endpoint is fine.
            // Let's use the general transaction endpoint for simplicity here, as it calls the same robust serializer.
            // The `adjust-stock` action in `InventoryItemViewSet` also uses `InventoryTransactionSerializer`.

            // Special handling if the backend issue with negative ADJ quantities persists:
            // If formData.transaction_type === 'ADJ' and you want to allow negative input here,
            // but the backend rejects "Quantity must be positive", this form will fail.
            // For now, this form assumes the quantity for ADJ is the *change* amount.
            // If it's negative, it *should* work with the current InventoryTransactionSerializer.validate
            // (unless the mysterious positive-only validation is still active).

            await inventoryService.createTransaction(payload);
            alert('Stock transaction recorded successfully!');
            navigate(`/inventory/items/${itemId}`); // Go back to item detail view
        } catch (err) {
            console.error("Submit error:", err.response?.data || err.message);
            let errorMsg = `Failed to record transaction: ${err.message}. `;
            if (err.response && err.response.data) {
                const backendErrors = err.response.data;
                const messages = Object.entries(backendErrors).map(([key, value]) =>
                    `${key}: ${Array.isArray(value) ? value.join(', ') : value}`
                );
                errorMsg += messages.join('; ');
            }
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ maxWidth: '600px', margin: 'auto' }}>
            <h2>Adjust Stock for Item: {itemName || `ID ${itemId}`}</h2>
            {currentQuantity !== null && <p>Current Quantity on Hand: <strong>{currentQuantity.toFixed(2)}</strong></p>}
            {error && <p style={{ color: 'red', whiteSpace: 'pre-wrap' }}>{error}</p>}

            <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="transaction_type">Transaction Type: </label>
                <select name="transaction_type" id="transaction_type" value={formData.transaction_type} onChange={handleChange} required>
                    {transactionTypes.map(tt => <option key={tt.value} value={tt.value}>{tt.label}</option>)}
                </select>
                {formErrors.transaction_type && <p style={{color: 'red', fontSize: '0.8em'}}>{formErrors.transaction_type}</p>}
            </div>

            <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="quantity">
                    Quantity {formData.transaction_type === 'ADJ' ? '(Change +/-)' : '(Positive Value)'}:
                </label>
                <input
                    type="number"
                    name="quantity"
                    id="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    step="0.01"
                    required
                />
                {formErrors.quantity && <p style={{color: 'red', fontSize: '0.8em'}}>{formErrors.quantity}</p>}
                 <small>
                    {formData.transaction_type === 'ADJ' ? "Enter positive to increase, negative to decrease." : "Enter positive value."}
                </small>
            </div>

            <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="notes">Notes/Reason: </label>
                <textarea name="notes" id="notes" value={formData.notes} onChange={handleChange} />
            </div>

            {/* Transaction Date - usually auto-set by backend, but can be made settable if needed */}
            {/* <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="transaction_date">Transaction Date: </label>
                <input type="date" name="transaction_date" id="transaction_date" value={formData.transaction_date} onChange={handleChange} required />
            </div> */}

            <button type="submit" disabled={loading}>
                {loading ? 'Processing...' : 'Record Transaction'}
            </button>
            <button type="button" onClick={() => navigate(itemId ? `/inventory/items/${itemId}` : '/inventory')} style={{ marginLeft: '10px' }} disabled={loading}>
                Cancel
            </button>
        </form>
    );
};

export default StockAdjustmentForm;
