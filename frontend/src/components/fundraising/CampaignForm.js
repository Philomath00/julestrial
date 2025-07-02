import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import fundraisingService from '../../services/fundraisingService';
// import userService from '../../services/userService'; // If selecting 'managed_by'

// Static choices for campaign status (mirroring backend model)
const campaignStatuses = [
    { value: 'PLA', label: 'Planning' },
    { value: 'ACT', label: 'Active' },
    { value: 'COM', label: 'Completed' },
    { value: 'CAN', label: 'Cancelled' },
    { value: 'HLD', label: 'On Hold' },
];

const initialFormData = {
    name: '',
    description: '',
    goal_amount: '0.00',
    start_date: new Date().toISOString().split('T')[0], // Default to today
    end_date: '',
    status: 'PLA', // Default status
    // managed_by_id is set by backend from authenticated user
};

const CampaignForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = Boolean(id);

    const [formData, setFormData] = useState(initialFormData);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [formErrors, setFormErrors] = useState({});

    useEffect(() => {
        if (isEditMode && id) {
            setLoading(true);
            fundraisingService.getCampaignById(id)
                .then(response => {
                    const campaign = response.data;
                    setFormData({
                        name: campaign.name || '',
                        description: campaign.description || '',
                        goal_amount: campaign.goal_amount ? parseFloat(campaign.goal_amount).toFixed(2) : '0.00',
                        start_date: campaign.start_date || '',
                        end_date: campaign.end_date || '',
                        status: campaign.status || 'PLA',
                    });
                })
                .catch(err => {
                    setError('Failed to load campaign data for editing.');
                    console.error(err);
                })
                .finally(() => setLoading(false));
        } else {
            setFormData(initialFormData); // Reset for create mode
        }
    }, [id, isEditMode]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setFormErrors(prev => ({ ...prev, [name]: null }));
    };

    const validate = () => {
        const errors = {};
        if (!formData.name.trim()) errors.name = "Campaign name is required.";
        if (!formData.status) errors.status = "Campaign status is required.";
        if (!formData.start_date) errors.start_date = "Start date is required.";
        if (parseFloat(formData.goal_amount) <= 0) {
            errors.goal_amount = "Goal amount must be positive.";
        }
        if (formData.start_date && formData.end_date && new Date(formData.end_date) < new Date(formData.start_date)) {
            errors.end_date = "End date cannot be before start date.";
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) {
            setError("Please correct the errors in the form.");
            return;
        }
        setError(null);
        setLoading(true);

        const payload = {
            ...formData,
            goal_amount: parseFloat(formData.goal_amount).toFixed(2),
            start_date: formData.start_date || null,
            end_date: formData.end_date || null,
        };
        // managed_by is handled by the backend (uses request.user)

        try {
            if (isEditMode) {
                await fundraisingService.updateCampaign(id, payload);
                alert('Campaign updated successfully!');
            } else {
                await fundraisingService.createCampaign(payload);
                alert('Campaign created successfully!');
            }
            navigate('/campaigns'); // Redirect to campaign list
        } catch (err) {
            console.error("Submit error:", err.response?.data || err.message);
            let errorMsg = `Submission failed: ${err.message}. `;
            if (err.response && err.response.data) {
                const backendErrors = err.response.data;
                const messages = Object.entries(backendErrors).map(([key, value]) =>
                    `${key}: ${Array.isArray(value) ? value.join(', ') : value}`
                );
                errorMsg += messages.join('; ');
                setFormErrors(prev => ({...prev, ...backendErrors}));
            }
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    if (loading && isEditMode && !formData.name) {
        return <p>Loading campaign data...</p>;
    }

    return (
        <form onSubmit={handleSubmit} style={{ maxWidth: '600px', margin: 'auto' }}>
            <h2>{isEditMode ? 'Edit Campaign' : 'Create New Campaign'}</h2>
            {error && <p style={{ color: 'red', whiteSpace: 'pre-wrap' }}>{error}</p>}

            <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="name">Campaign Name: </label>
                <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required />
                {formErrors.name && <p style={{color: 'red', fontSize: '0.8em'}}>{formErrors.name}</p>}
            </div>
            <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="description">Description: </label>
                <textarea name="description" id="description" value={formData.description} onChange={handleChange} rows="3" />
            </div>
            <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="goal_amount">Goal Amount: </label>
                <input type="number" name="goal_amount" id="goal_amount" value={formData.goal_amount} onChange={handleChange} step="0.01" min="0.01" required />
                {formErrors.goal_amount && <p style={{color: 'red', fontSize: '0.8em'}}>{formErrors.goal_amount}</p>}
            </div>
            <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="status">Status: </label>
                <select name="status" id="status" value={formData.status} onChange={handleChange} required>
                    {campaignStatuses.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                {formErrors.status && <p style={{color: 'red', fontSize: '0.8em'}}>{formErrors.status}</p>}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{width: '48%'}}>
                    <label htmlFor="start_date">Start Date: </label>
                    <input type="date" name="start_date" id="start_date" value={formData.start_date} onChange={handleChange} required/>
                    {formErrors.start_date && <p style={{color: 'red', fontSize: '0.8em'}}>{formErrors.start_date}</p>}
                </div>
                <div style={{width: '48%'}}>
                    <label htmlFor="end_date">End Date (Optional): </label>
                    <input type="date" name="end_date" id="end_date" value={formData.end_date} onChange={handleChange} />
                    {formErrors.end_date && <p style={{color: 'red', fontSize: '0.8em'}}>{formErrors.end_date}</p>}
                </div>
            </div>

            <button type="submit" disabled={loading}>
                {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Campaign' : 'Create Campaign')}
            </button>
            <button type="button" onClick={() => navigate('/campaigns')} style={{ marginLeft: '10px' }} disabled={loading}>
                Cancel
            </button>
        </form>
    );
};

export default CampaignForm;
