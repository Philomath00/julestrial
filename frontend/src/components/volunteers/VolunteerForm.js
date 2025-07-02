import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import volunteerService from '../../services/volunteerService';
import contactService from '../../services/contactService'; // Assuming this will exist for contact types etc.

// Mock contact types if contactService isn't fully built out or to avoid API call for static choices
const contactTypes = [
    { value: 'IND', label: 'Individual' },
    { value: 'ORG', label: 'Organization' }, // Volunteers are usually individuals
];

// Mock volunteer statuses
const volunteerStatuses = [
    { value: 'ACT', label: 'Active' },
    { value: 'INA', label: 'Inactive' },
    { value: 'PEN', label: 'Pending Approval' },
];


const VolunteerForm = () => {
  const { id } = useParams(); // For editing existing volunteer
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    // Contact fields (nested under contact_data for create)
    contact_first_name: '',
    contact_last_name: '',
    contact_email: '',
    contact_phone: '',
    contact_address: '',
    contact_contact_type: 'IND', // Default to Individual for volunteers

    // Volunteer fields
    skills: '',
    availability: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    status: 'PEN', // Default status
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formError, setFormError] = useState({}); // For field-specific errors


  useEffect(() => {
    if (isEditMode && id) {
      const fetchVolunteerData = async () => {
        setLoading(true);
        try {
          const volunteerRes = await volunteerService.getVolunteerById(id);
          const volData = volunteerRes.data;

          // Backend returns contact details nested or flat based on serializer.
          // VolunteerSerializer returns: contact, contact_first_name, contact_last_name, contact_email etc.
          // For the form, we need to map these to our flat formData structure.
          setFormData({
            contact_first_name: volData.contact_first_name || '',
            contact_last_name: volData.contact_last_name || '',
            contact_email: volData.contact_email || '',
            // Assuming contact phone & address are not directly on VolunteerSerializer output,
            // one might need a separate call to get full contact details if they were part of Contact model only.
            // For now, let's assume they might be blank or fetched if ContactSerializer was nested.
            // If Contact model fields (phone, address) are needed for edit,
            // the backend VolunteerViewSet.update expects them under 'contact_data'.
            // And getVolunteerById should ideally return them.
            // Let's assume basic fields are available.
            contact_phone: volData.contact_phone || '', // Placeholder if not directly on volunteer serializer
            contact_address: volData.contact_address || '', // Placeholder
            contact_contact_type: volData.contact_contact_type || 'IND', // This might not be on VolunteerSerializer

            skills: volData.skills || '',
            availability: volData.availability || '',
            emergency_contact_name: volData.emergency_contact_name || '',
            emergency_contact_phone: volData.emergency_contact_phone || '',
            status: volData.status || 'PEN',
          });

        } catch (err) {
          setError('Failed to load volunteer data for editing.');
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchVolunteerData();
    }
  }, [id, isEditMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFormError(prev => ({...prev, [name]: null})); // Clear error on change
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.contact_first_name.trim()) errors.contact_first_name = "Contact's first name is required.";
    // if (!formData.contact_last_name.trim() && formData.contact_contact_type === 'IND') errors.contact_last_name = "Contact's last name is required for individuals.";
    if (!formData.contact_email.trim()) errors.contact_email = "Contact's email is required.";
    else if (!/\S+@\S+\.\S+/.test(formData.contact_email)) errors.contact_email = "Email is invalid.";

    // Add more validations as needed for other fields e.g. skills, status
    if (!formData.status) errors.status = "Volunteer status is required.";

    setFormError(errors);
    return Object.keys(errors).length === 0;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      setError("Please correct the errors in the form.");
      return;
    }
    setError(null);
    setLoading(true);

    // Prepare payload for backend
    const payload = {
        contact_data: {
            first_name: formData.contact_first_name,
            last_name: formData.contact_last_name,
            email: formData.contact_email,
            phone: formData.contact_phone,
            address: formData.contact_address,
            contact_type: formData.contact_contact_type,
        },
        skills: formData.skills,
        availability: formData.availability,
        emergency_contact_name: formData.emergency_contact_name,
        emergency_contact_phone: formData.emergency_contact_phone,
        status: formData.status,
    };

    try {
      if (isEditMode) {
        // For PATCH, only send changed fields. For PUT, send all.
        // The backend VolunteerViewSet.update handles 'contact_data' and volunteer fields.
        // If only volunteer fields changed, contact_data can be omitted or sent as is.
        // If contact fields changed, they must be in contact_data.
        // Our current view's update method handles partial updates if PATCH is used.
        // volunteerService.updateVolunteer should ideally use PATCH if only some fields are sent.
        // For simplicity, let's assume PUT and send the whole constructed payload.
        await volunteerService.updateVolunteer(id, payload);
        alert('Volunteer updated successfully!');
      } else {
        await volunteerService.createVolunteer(payload);
        alert('Volunteer created successfully!');
      }
      navigate('/volunteers'); // Redirect to volunteer list
    } catch (err) {
      console.error("Submit error:", err);
      if (err.response && err.response.data) {
        // Handle backend validation errors
        const backendErrors = err.response.data;
        let readableErrors = "";
        for (const key in backendErrors) {
            if (Array.isArray(backendErrors[key])) {
                readableErrors += `${key}: ${backendErrors[key].join(', ')}\n`;
            } else if (typeof backendErrors[key] === 'object') { // Nested errors like contact_data
                 for (const nestedKey in backendErrors[key]) {
                    if (Array.isArray(backendErrors[key][nestedKey])) {
                        readableErrors += `${key}.${nestedKey}: ${backendErrors[key][nestedKey].join(', ')}\n`;
                    }
                 }
            }
        }
        setError(`Submission failed: ${err.message}. Backend validation: ${readableErrors || 'Check console.'}`);
        // TODO: map backendErrors to formError state for individual fields
      } else {
        setError(`Submission failed: ${err.message || 'An unexpected error occurred.'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode && !formData.contact_first_name) { // Initial load for edit
    return <p>Loading volunteer data...</p>;
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '600px', margin: 'auto' }}>
      <h2>{isEditMode ? 'Edit Volunteer' : 'Register New Volunteer'}</h2>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <fieldset style={{ marginBottom: '1em', padding: '1em' }}>
        <legend>Contact Information</legend>
        <div>
          <label htmlFor="contact_first_name">First Name/Org Name: </label>
          <input type="text" name="contact_first_name" id="contact_first_name" value={formData.contact_first_name} onChange={handleChange} required />
          {formError.contact_first_name && <p style={{color: 'red', fontSize: '0.8em'}}>{formError.contact_first_name}</p>}
        </div>
        <div>
          <label htmlFor="contact_last_name">Last Name (if individual): </label>
          <input type="text" name="contact_last_name" id="contact_last_name" value={formData.contact_last_name} onChange={handleChange} />
          {/* {formError.contact_last_name && <p style={{color: 'red', fontSize: '0.8em'}}>{formError.contact_last_name}</p>} */}
        </div>
        <div>
          <label htmlFor="contact_email">Email: </label>
          <input type="email" name="contact_email" id="contact_email" value={formData.contact_email} onChange={handleChange} required />
          {formError.contact_email && <p style={{color: 'red', fontSize: '0.8em'}}>{formError.contact_email}</p>}
        </div>
        <div>
          <label htmlFor="contact_phone">Phone: </label>
          <input type="tel" name="contact_phone" id="contact_phone" value={formData.contact_phone} onChange={handleChange} />
        </div>
        <div>
          <label htmlFor="contact_address">Address: </label>
          <textarea name="contact_address" id="contact_address" value={formData.contact_address} onChange={handleChange} />
        </div>
         {/* Contact Type - usually fixed as Individual for Volunteers, but can be shown/set */}
        <div>
            <label htmlFor="contact_contact_type">Contact Type: </label>
            <select name="contact_contact_type" id="contact_contact_type" value={formData.contact_contact_type} onChange={handleChange} disabled>
                 {/* Typically a volunteer is an individual, so this might be fixed or hidden */}
                <option value="IND">Individual</option>
            </select>
        </div>
      </fieldset>

      <fieldset style={{ marginBottom: '1em', padding: '1em' }}>
        <legend>Volunteer Details</legend>
        <div>
          <label htmlFor="skills">Skills: </label>
          <input type="text" name="skills" id="skills" value={formData.skills} onChange={handleChange} />
          <small> (Comma-separated)</small>
        </div>
        <div>
          <label htmlFor="availability">Availability: </label>
          <input type="text" name="availability" id="availability" value={formData.availability} onChange={handleChange} />
        </div>
        <div>
          <label htmlFor="status">Status: </label>
          <select name="status" id="status" value={formData.status} onChange={handleChange} required>
            {volunteerStatuses.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          {formError.status && <p style={{color: 'red', fontSize: '0.8em'}}>{formError.status}</p>}
        </div>
      </fieldset>

      <fieldset style={{ marginBottom: '1em', padding: '1em' }}>
        <legend>Emergency Contact</legend>
        <div>
          <label htmlFor="emergency_contact_name">Name: </label>
          <input type="text" name="emergency_contact_name" id="emergency_contact_name" value={formData.emergency_contact_name} onChange={handleChange} />
        </div>
        <div>
          <label htmlFor="emergency_contact_phone">Phone: </label>
          <input type="tel" name="emergency_contact_phone" id="emergency_contact_phone" value={formData.emergency_contact_phone} onChange={handleChange} />
        </div>
      </fieldset>

      <button type="submit" disabled={loading}>
        {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Volunteer' : 'Create Volunteer')}
      </button>
      <button type="button" onClick={() => navigate('/volunteers')} style={{ marginLeft: '10px' }} disabled={loading}>
        Cancel
      </button>
    </form>
  );
};

export default VolunteerForm;
