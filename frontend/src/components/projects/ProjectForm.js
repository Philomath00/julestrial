import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import projectService from '../../services/projectService';
// import userService from '../../services/userService'; // For selecting 'created_by' if not auto

// Static choices for project status (mirroring backend model)
const projectStatuses = [
    { value: 'PLA', label: 'Planning' },
    { value: 'PRO', label: 'In Progress' },
    { value: 'COM', label: 'Completed' },
    { value: 'HLD', label: 'On Hold' },
    { value: 'CAN', label: 'Cancelled' },
];

const initialFormData = {
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    status: 'PLA', // Default status
    budget: '',
    location: '',
    // created_by_id is set by backend from authenticated user
};

const ProjectForm = () => {
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
            projectService.getProjectById(id)
                .then(response => {
                    const project = response.data;
                    setFormData({
                        name: project.name || '',
                        description: project.description || '',
                        start_date: project.start_date || '',
                        end_date: project.end_date || '',
                        status: project.status || 'PLA',
                        budget: project.budget ? parseFloat(project.budget).toFixed(2) : '',
                        location: project.location || '',
                    });
                })
                .catch(err => {
                    setError('Failed to load project data for editing.');
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
        if (!formData.name.trim()) errors.name = "Project name is required.";
        if (!formData.status) errors.status = "Project status is required.";
        if (formData.budget && parseFloat(formData.budget) < 0) {
            errors.budget = "Budget cannot be negative.";
        }
        // Basic date validation: end_date should not be before start_date
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
            budget: formData.budget ? parseFloat(formData.budget).toFixed(2) : null, // Ensure budget is number or null
            start_date: formData.start_date || null, // Send null if empty
            end_date: formData.end_date || null,     // Send null if empty
        };
        // created_by is handled by the backend (uses request.user)

        try {
            if (isEditMode) {
                await projectService.updateProject(id, payload);
                alert('Project updated successfully!');
            } else {
                await projectService.createProject(payload);
                alert('Project created successfully!');
            }
            navigate('/projects'); // Redirect to project list
        } catch (err) {
            console.error("Submit error:", err.response?.data || err.message);
            let errorMsg = `Submission failed: ${err.message}. `;
            if (err.response && err.response.data) {
                const backendErrors = err.response.data;
                const messages = Object.entries(backendErrors).map(([key, value]) =>
                    `${key}: ${Array.isArray(value) ? value.join(', ') : value}`
                );
                errorMsg += messages.join('; ');
                setFormErrors(prev => ({...prev, ...backendErrors})); // Show backend field errors
            }
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    if (loading && isEditMode && !formData.name) {
        return <p>Loading project data...</p>;
    }

    return (
        <form onSubmit={handleSubmit} style={{ maxWidth: '600px', margin: 'auto' }}>
            <h2>{isEditMode ? 'Edit Project Information' : 'Create New Project'}</h2>
            {error && <p style={{ color: 'red', whiteSpace: 'pre-wrap' }}>{error}</p>}

            <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="name">Project Name: </label>
                <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required />
                {formErrors.name && <p style={{color: 'red', fontSize: '0.8em'}}>{formErrors.name}</p>}
            </div>
            <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="description">Description: </label>
                <textarea name="description" id="description" value={formData.description} onChange={handleChange} rows="3" />
            </div>
            <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="status">Status: </label>
                <select name="status" id="status" value={formData.status} onChange={handleChange} required>
                    {projectStatuses.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                {formErrors.status && <p style={{color: 'red', fontSize: '0.8em'}}>{formErrors.status}</p>}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{width: '48%'}}>
                    <label htmlFor="start_date">Start Date: </label>
                    <input type="date" name="start_date" id="start_date" value={formData.start_date} onChange={handleChange} />
                </div>
                <div style={{width: '48%'}}>
                    <label htmlFor="end_date">End Date: </label>
                    <input type="date" name="end_date" id="end_date" value={formData.end_date} onChange={handleChange} />
                    {formErrors.end_date && <p style={{color: 'red', fontSize: '0.8em'}}>{formErrors.end_date}</p>}
                </div>
            </div>
            <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="budget">Budget (Optional): </label>
                <input type="number" name="budget" id="budget" value={formData.budget} onChange={handleChange} step="0.01" min="0" />
                {formErrors.budget && <p style={{color: 'red', fontSize: '0.8em'}}>{formErrors.budget}</p>}
            </div>
            <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="location">Location (Optional): </label>
                <input type="text" name="location" id="location" value={formData.location} onChange={handleChange} />
            </div>

            <button type="submit" disabled={loading}>
                {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Project' : 'Create Project')}
            </button>
            <button type="button" onClick={() => navigate('/projects')} style={{ marginLeft: '10px' }} disabled={loading}>
                Cancel
            </button>
        </form>
    );
};

export default ProjectForm;
