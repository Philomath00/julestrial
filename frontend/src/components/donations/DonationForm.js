import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import donationService from '../../services/donationService';
// For contact/campaign selection, ideally, we'd fetch them.
// import contactService from '../../services/contactService';
// import campaignService from '../../services/campaignService';

// Static choices for now
const donationTypes = [
    { value: 'MON', label: 'Monetary' },
    { value: 'INK', label: 'In-Kind' },
];
const paymentMethods = [
    { value: 'CSH', label: 'Cash' }, { value: 'CRD', label: 'Credit/Debit Card' },
    { value: 'BNK', label: 'Bank Transfer' }, { value: 'CHK', label: 'Check' },
    { value: 'ONL', label: 'Online Platform' }, { value: 'OTH', label: 'Other' },
];
const itemConditions = [
    { value: 'NEW', label: 'New' }, { value: 'GOD', label: 'Good' },
    { value: 'FAR', label: 'Fair' }, { value: 'POR', label: 'Poor' },
];

const initialFormData = {
    donor_contact_id: '',
    campaign_id: '', // Optional
    donation_date: new Date().toISOString().split('T')[0], // Default to today
    donation_type: 'MON',
    amount: '',
    payment_method: '',
    notes: '',
    is_anonymous: false,
    // In-kind specific fields (nested under in_kind_details for submission)
    in_kind_item_name: '',
    in_kind_description: '',
    in_kind_estimated_value: '',
    in_kind_quantity: '1',
    in_kind_condition: 'GOD',
};

const DonationForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = Boolean(id);

    const [formData, setFormData] = useState(initialFormData);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [formErrors, setFormErrors] = useState({});

    // TODO: Fetch contacts and campaigns for dropdowns in a real scenario
    // const [contacts, setContacts] = useState([]);
    // const [campaigns, setCampaigns] = useState([]);

    useEffect(() => {
        // Fetch contacts and campaigns for select dropdowns
        // const loadRelatedData = async () => {
        // try {
        //     const contactsRes = await contactService.getAllContacts({ limit: 1000 }); // Basic fetch
        //     setContacts(contactsRes.data.results || contactsRes.data);
        //     const campaignsRes = await campaignService.getAllCampaigns({ limit: 1000 });
        //     setCampaigns(campaignsRes.data.results || campaignsRes.data);
        // } catch (err) { console.error("Failed to load contacts/campaigns", err); }
        // };
        // loadRelatedData();

        if (isEditMode && id) {
            setLoading(true);
            donationService.getDonationById(id)
                .then(response => {
                    const dbData = response.data;
                    setFormData({
                        donor_contact_id: dbData.donor_contact?.id || '',
                        campaign_id: dbData.campaign?.id || '',
                        donation_date: dbData.donation_date || new Date().toISOString().split('T')[0],
                        donation_type: dbData.donation_type || 'MON',
                        amount: dbData.amount || '',
                        payment_method: dbData.payment_method || '',
                        notes: dbData.notes || '',
                        is_anonymous: dbData.is_anonymous || false,
                        in_kind_item_name: dbData.in_kind_details?.item_name || '',
                        in_kind_description: dbData.in_kind_details?.description || '',
                        in_kind_estimated_value: dbData.in_kind_details?.estimated_value || '',
                        in_kind_quantity: dbData.in_kind_details?.quantity || '1',
                        in_kind_condition: dbData.in_kind_details?.condition || 'GOD',
                    });
                })
                .catch(err => {
                    setError('Failed to load donation data for editing.');
                    console.error(err);
                })
                .finally(() => setLoading(false));
        }
    }, [id, isEditMode]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
        setFormErrors(prev => ({ ...prev, [name]: null }));
    };

    const validate = () => {
        const errors = {};
        if (!formData.donor_contact_id) errors.donor_contact_id = "Donor contact ID is required.";
        if (!formData.donation_date) errors.donation_date = "Donation date is required.";
        if (!formData.donation_type) errors.donation_type = "Donation type is required.";

        if (formData.donation_type === 'MON') {
            if (!formData.amount || parseFloat(formData.amount) <= 0) errors.amount = "Amount must be positive for monetary donations.";
            if (!formData.payment_method) errors.payment_method = "Payment method is required for monetary donations.";
        } else if (formData.donation_type === 'INK') {
            if (!formData.in_kind_item_name.trim()) errors.in_kind_item_name = "Item name is required for in-kind donations.";
            if (!formData.in_kind_quantity || parseInt(formData.in_kind_quantity) <= 0) errors.in_kind_quantity = "Quantity must be a positive number.";
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

        const submissionData = {
            donor_contact_id: parseInt(formData.donor_contact_id),
            campaign_id: formData.campaign_id ? parseInt(formData.campaign_id) : null,
            donation_date: formData.donation_date,
            donation_type: formData.donation_type,
            notes: formData.notes,
            is_anonymous: formData.is_anonymous,
        };

        if (formData.donation_type === 'MON') {
            submissionData.amount = formData.amount;
            submissionData.payment_method = formData.payment_method;
        } else if (formData.donation_type === 'INK') {
            submissionData.in_kind_details = {
                item_name: formData.in_kind_item_name,
                description: formData.in_kind_description,
                estimated_value: formData.in_kind_estimated_value || null, // Send null if empty
                quantity: parseInt(formData.in_kind_quantity),
                condition: formData.in_kind_condition,
            };
            // Ensure amount is not sent for INK as per backend validation
            submissionData.amount = null;
        }

        try {
            if (isEditMode) {
                await donationService.updateDonation(id, submissionData);
                alert('Donation updated successfully!');
            } else {
                await donationService.createDonation(submissionData);
                alert('Donation created successfully!');
            }
            navigate('/donations');
        } catch (err) {
            console.error("Submit error:", err.response?.data || err.message);
            let errorMsg = `Submission failed: ${err.message}. `;
            if (err.response && err.response.data) {
                // Convert backend errors to a readable string or set them to formErrors
                const backendErrors = err.response.data;
                const messages = Object.entries(backendErrors).map(([key, value]) => {
                    if (key === 'in_kind_details' && typeof value === 'object') {
                        return `In-kind details: ${Object.entries(value).map(([ikKey, ikValue]) => `${ikKey}: ${ikValue}`).join(', ')}`;
                    }
                    return `${key}: ${Array.isArray(value) ? value.join(', ') : value}`;
                });
                errorMsg += messages.join('; ');
            }
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    if (loading && isEditMode && !formData.donor_contact_id) { // Initial load for edit mode
        return <p>Loading donation data for editing...</p>;
    }

    return (
        <form onSubmit={handleSubmit} style={{ maxWidth: '700px', margin: 'auto' }}>
            <h2>{isEditMode ? 'Edit Donation' : 'Record New Donation'}</h2>
            {error && <p style={{ color: 'red', whiteSpace: 'pre-wrap' }}>{error}</p>}

            <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="donor_contact_id">Donor Contact ID: </label>
                <input type="number" name="donor_contact_id" id="donor_contact_id" value={formData.donor_contact_id} onChange={handleChange} required />
                {formErrors.donor_contact_id && <p style={{color: 'red', fontSize: '0.8em'}}>{formErrors.donor_contact_id}</p>}
                {/* TODO: Replace with a searchable select component for Contacts */}
            </div>
            <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="campaign_id">Campaign ID (Optional): </label>
                <input type="number" name="campaign_id" id="campaign_id" value={formData.campaign_id} onChange={handleChange} />
                 {/* TODO: Replace with a searchable select component for Campaigns */}
            </div>
            <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="donation_date">Donation Date: </label>
                <input type="date" name="donation_date" id="donation_date" value={formData.donation_date} onChange={handleChange} required />
                {formErrors.donation_date && <p style={{color: 'red', fontSize: '0.8em'}}>{formErrors.donation_date}</p>}
            </div>
            <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="donation_type">Donation Type: </label>
                <select name="donation_type" id="donation_type" value={formData.donation_type} onChange={handleChange} required>
                    {donationTypes.map(dt => <option key={dt.value} value={dt.value}>{dt.label}</option>)}
                </select>
                {formErrors.donation_type && <p style={{color: 'red', fontSize: '0.8em'}}>{formErrors.donation_type}</p>}
            </div>

            {formData.donation_type === 'MON' && (
                <fieldset style={{ margin: '1rem 0', padding: '1rem', border: '1px dashed #ccc' }}>
                    <legend>Monetary Donation Details</legend>
                    <div style={{ marginBottom: '1rem' }}>
                        <label htmlFor="amount">Amount: </label>
                        <input type="number" name="amount" id="amount" value={formData.amount} onChange={handleChange} step="0.01" required={formData.donation_type === 'MON'} />
                        {formErrors.amount && <p style={{color: 'red', fontSize: '0.8em'}}>{formErrors.amount}</p>}
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                        <label htmlFor="payment_method">Payment Method: </label>
                        <select name="payment_method" id="payment_method" value={formData.payment_method} onChange={handleChange} required={formData.donation_type === 'MON'}>
                            <option value="">Select method...</option>
                            {paymentMethods.map(pm => <option key={pm.value} value={pm.value}>{pm.label}</option>)}
                        </select>
                        {formErrors.payment_method && <p style={{color: 'red', fontSize: '0.8em'}}>{formErrors.payment_method}</p>}
                    </div>
                </fieldset>
            )}

            {formData.donation_type === 'INK' && (
                <fieldset style={{ margin: '1rem 0', padding: '1rem', border: '1px dashed #ccc' }}>
                    <legend>In-Kind Donation Details</legend>
                    <div style={{ marginBottom: '1rem' }}>
                        <label htmlFor="in_kind_item_name">Item Name: </label>
                        <input type="text" name="in_kind_item_name" id="in_kind_item_name" value={formData.in_kind_item_name} onChange={handleChange} required={formData.donation_type === 'INK'} />
                        {formErrors.in_kind_item_name && <p style={{color: 'red', fontSize: '0.8em'}}>{formErrors.in_kind_item_name}</p>}
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                        <label htmlFor="in_kind_description">Item Description: </label>
                        <textarea name="in_kind_description" id="in_kind_description" value={formData.in_kind_description} onChange={handleChange} />
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                        <label htmlFor="in_kind_estimated_value">Estimated Value (Optional): </label>
                        <input type="number" name="in_kind_estimated_value" id="in_kind_estimated_value" value={formData.in_kind_estimated_value} onChange={handleChange} step="0.01" />
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                        <label htmlFor="in_kind_quantity">Quantity: </label>
                        <input type="number" name="in_kind_quantity" id="in_kind_quantity" value={formData.in_kind_quantity} onChange={handleChange} step="1" min="1" required={formData.donation_type === 'INK'} />
                        {formErrors.in_kind_quantity && <p style={{color: 'red', fontSize: '0.8em'}}>{formErrors.in_kind_quantity}</p>}
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                        <label htmlFor="in_kind_condition">Condition: </label>
                        <select name="in_kind_condition" id="in_kind_condition" value={formData.in_kind_condition} onChange={handleChange}>
                            {itemConditions.map(ic => <option key={ic.value} value={ic.value}>{ic.label}</option>)}
                        </select>
                    </div>
                </fieldset>
            )}

            <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="notes">Notes: </label>
                <textarea name="notes" id="notes" value={formData.notes} onChange={handleChange} />
            </div>
            <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="is_anonymous">
                    <input type="checkbox" name="is_anonymous" id="is_anonymous" checked={formData.is_anonymous} onChange={handleChange} />
                    Is this donation anonymous?
                </label>
            </div>

            <button type="submit" disabled={loading}>
                {loading ? (isEditMode ? 'Updating...' : 'Saving...') : (isEditMode ? 'Update Donation' : 'Save Donation')}
            </button>
            <button type="button" onClick={() => navigate('/donations')} style={{ marginLeft: '10px' }} disabled={loading}>
                Cancel
            </button>
        </form>
    );
};

export default DonationForm;
