import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import inventoryService from '../../services/inventoryService';

const InventoryItemForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = Boolean(id);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: '', // Will be category ID
        unit_of_measure: '',
        reorder_level: '0.00',
        // quantity_on_hand is not directly set here. Set by initial transaction.
    });
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [formErrors, setFormErrors] = useState({});

    useEffect(() => {
        // Fetch categories for the dropdown
        inventoryService.getAllCategories()
            .then(response => {
                setCategories(response.data.results || response.data);
            })
            .catch(err => {
                console.error("Failed to fetch categories", err);
                setError("Could not load categories for selection.");
            });

        if (isEditMode && id) {
            setLoading(true);
            inventoryService.getItemById(id)
                .then(response => {
                    const item = response.data;
                    setFormData({
                        name: item.name || '',
                        description: item.description || '',
                        category: item.category || '', // category is expected to be the ID
                        unit_of_measure: item.unit_of_measure || '',
                        reorder_level: item.reorder_level ? parseFloat(item.reorder_level).toFixed(2) : '0.00',
                    });
                })
                .catch(err => {
                    setError('Failed to load item data for editing.');
                    console.error(err);
                })
                .finally(() => setLoading(false));
        }
    }, [id, isEditMode]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setFormErrors(prev => ({ ...prev, [name]: null }));
    };

    const validate = () => {
        const errors = {};
        if (!formData.name.trim()) errors.name = "Item name is required.";
        if (!formData.category) errors.category = "Category is required."; // Category ID
        if (!formData.unit_of_measure.trim()) errors.unit_of_measure = "Unit of measure is required.";
        if (formData.reorder_level && parseFloat(formData.reorder_level) < 0) {
            errors.reorder_level = "Reorder level cannot be negative.";
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) {
            setError("Please correct the form errors.");
            return;
        }
        setError(null);
        setLoading(true);

        const payload = {
            ...formData,
            reorder_level: parseFloat(formData.reorder_level).toFixed(2),
            // Ensure category is an integer if it's an ID
            category: formData.category ? parseInt(formData.category) : null,
        };
        // quantity_on_hand is not part of this payload as it's managed by transactions

        try {
            if (isEditMode) {
                await inventoryService.updateItem(id, payload);
                alert('Inventory item updated successfully!');
            } else {
                const createdItem = await inventoryService.createItem(payload);
                alert('Inventory item created successfully! You may want to record an initial stock transaction.');
                // Optionally, navigate to adjust stock page for the new item:
                // navigate(`/inventory/items/${createdItem.data.id}/adjust`); return;
            }
            navigate('/inventory');
        } catch (err) {
            console.error("Submit error:", err.response?.data || err.message);
            let errorMsg = `Submission failed: ${err.message}. `;
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

    if (loading && isEditMode && !formData.name) { // Initial load for edit
        return <p>Loading item data...</p>;
    }

    return (
        <form onSubmit={handleSubmit} style={{ maxWidth: '600px', margin: 'auto' }}>
            <h2>{isEditMode ? 'Edit Inventory Item' : 'Create New Inventory Item'}</h2>
            {error && <p style={{ color: 'red', whiteSpace: 'pre-wrap' }}>{error}</p>}

            <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="name">Item Name: </label>
                <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required />
                {formErrors.name && <p style={{color: 'red', fontSize: '0.8em'}}>{formErrors.name}</p>}
            </div>
            <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="description">Description: </label>
                <textarea name="description" id="description" value={formData.description} onChange={handleChange} />
            </div>
            <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="category">Category: </label>
                <select name="category" id="category" value={formData.category} onChange={handleChange} required>
                    <option value="">Select category...</option>
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
                {formErrors.category && <p style={{color: 'red', fontSize: '0.8em'}}>{formErrors.category}</p>}
            </div>
            <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="unit_of_measure">Unit of Measure: </label>
                <input type="text" name="unit_of_measure" id="unit_of_measure" value={formData.unit_of_measure} onChange={handleChange} required />
                {formErrors.unit_of_measure && <p style={{color: 'red', fontSize: '0.8em'}}>{formErrors.unit_of_measure}</p>}
            </div>
            <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="reorder_level">Reorder Level: </label>
                <input type="number" name="reorder_level" id="reorder_level" value={formData.reorder_level} onChange={handleChange} step="0.01" min="0" required />
                {formErrors.reorder_level && <p style={{color: 'red', fontSize: '0.8em'}}>{formErrors.reorder_level}</p>}
            </div>

            <p style={{fontSize: '0.9em', color: 'gray'}}>
                Note: Initial stock quantity is set by creating an "IN" transaction after item creation.
            </p>

            <button type="submit" disabled={loading}>
                {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Item' : 'Create Item')}
            </button>
            <button type="button" onClick={() => navigate('/inventory')} style={{ marginLeft: '10px' }} disabled={loading}>
                Cancel
            </button>
        </form>
    );
};

export default InventoryItemForm;
