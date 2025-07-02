import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import contactService from '../../services/contactService';

const contactTypes = [
    { value: 'IND', label: 'Individual' },
    { value: 'ORG', label: 'Organization' },
];

const initialFormData = {
    first_name: '', // For Individual: First Name; For Organization: Organization Name
    last_name: '',  // For Individual: Last Name; Blank for Organization
    email: '',
    phone: '',
    address: '',
    contact_type: 'IND', // Default to Individual
};

const ContactForm = () => {
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
            contactService.getContactById(id)
                .then(response => {
                    const contact = response.data;
                    setFormData({
                        first_name: contact.first_name || '',
                        last_name: contact.last_name || '',
                        email: contact.email || '',
                        phone: contact.phone || '',
                        address: contact.address || '',
                        contact_type: contact.contact_type || 'IND',
                    });
                })
                .catch(err => {
                    setError('Failed to load contact data for editing.');
                    console.error(err);
                })
                .finally(() => setLoading(false));
        } else {
            // Reset form for create mode if navigating from an edit form or for a clean slate
            setFormData(initialFormData);
        }
    }, [id, isEditMode]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        let newFormData = { ...formData, [name]: value };

        if (name === "contact_type" && value === "ORG") {
            newFormData.last_name = ''; // Clear last name if type changes to Organization
        }
        setFormData(newFormData);
        setFormErrors(prev => ({ ...prev, [name]: null })); // Clear specific field error on change
    };

    const validate = () => {
        const errors = {};
        if (!formData.first_name.trim()) {
            errors.first_name = formData.contact_type === 'ORG' ? "Organization name is required." : "First name is required.";
        }
        if (formData.contact_type === 'IND' && !formData.last_name.trim()) {
            // Making last_name optional for individuals for now, can be made required if needed
            // errors.last_name = "Last name is required for individuals.";
        }
        if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
            errors.email = "Email is invalid.";
        }
        // Add other validations as needed (e.g., phone format)
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

        const payload = { ...formData };
        if (payload.contact_type === 'ORG') {
            payload.last_name = ''; // Ensure last_name is blank for organizations
        }

        try {
            if (isEditMode) {
                await contactService.updateContact(id, payload);
                alert('Contact updated successfully!');
            } else {
                await contactService.createContact(payload);
                alert('Contact created successfully!');
            }
            navigate('/contacts'); // Redirect to contact list
        } catch (err) {
            console.error("Submit error:", err.response?.data || err.message);
            let errorMsg = `Submission failed: ${err.message}. `;
            if (err.response && err.response.data) {
                const backendErrors = err.response.data;
                const messages = Object.entries(backendErrors).map(([key, value]) =>
                    `${key}: ${Array.isArray(value) ? value.join(', ') : value}`
                );
                errorMsg += messages.join('; ');
                 // Set field-specific errors from backend if possible
                setFormErrors(prev => ({...prev, ...backendErrors}));
            }
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    if (loading && isEditMode && !formData.first_name) {
        return <p>Loading contact data...</p>;
    }

    return (
        <form onSubmit={handleSubmit} style={{ maxWidth: '600px', margin: 'auto' }}>
            <h2>{isEditMode ? 'Edit Contact' : 'Create New Contact'}</h2>
            {error && <p style={{ color: 'red', whiteSpace: 'pre-wrap' }}>{error}</p>}

            <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="contact_type">Contact Type: </label>
                <select name="contact_type" id="contact_type" value={formData.contact_type} onChange={handleChange} required>
                    {contactTypes.map(ct => <option key={ct.value} value={ct.value}>{ct.label}</option>)}
                </select>
            </div>

            <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="first_name">
                    {formData.contact_type === 'ORG' ? 'Organization Name:' : 'First Name:'}
                </label>
                <input type="text" name="first_name" id="first_name" value={formData.first_name} onChange={handleChange} required />
                {formErrors.first_name && <p style={{color: 'red', fontSize: '0.8em'}}>{formErrors.first_name}</p>}
            </div>

            {formData.contact_type === 'IND' && (
                <div style={{ marginBottom: '1rem' }}>
                    <label htmlFor="last_name">Last Name: </label>
                    <input type="text" name="last_name" id="last_name" value={formData.last_name} onChange={handleChange} />
                    {formErrors.last_name && <p style={{color: 'red', fontSize: '0.8em'}}>{formErrors.last_name}</p>}
                </div>
            )}

            <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="email">Email: </label>
                <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} />
                {formErrors.email && <p style={{color: 'red', fontSize: '0.8em'}}>{formErrors.email}</p>}
            </div>

            <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="phone">Phone: </label>
                <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleChange} />
            </div>

            <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="address">Address: </label>
                <textarea name="address" id="address" value={formData.address} onChange={handleChange} rows="3" />
            </div>

            <button type="submit" disabled={loading}>
                {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Contact' : 'Create Contact')}
            </button>
            <button type="button" onClick={() => navigate('/contacts')} style={{ marginLeft: '10px' }} disabled={loading}>
                Cancel
            </button>
        </form>
    );
};

export default ContactForm;
