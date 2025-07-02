import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom'; // Link for navigation
import volunteerService from '../../services/volunteerService';

const VolunteerDetail = () => {
  const [volunteer, setVolunteer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { id } = useParams(); // Get volunteer ID from URL parameters

  useEffect(() => {
    const fetchVolunteer = async () => {
      if (!id) return; // Should not happen if route is set up correctly

      try {
        setLoading(true);
        const response = await volunteerService.getVolunteerById(id);
        setVolunteer(response.data);
        setError(null);
      } catch (err) {
        setError(err.message || `Failed to fetch volunteer with ID ${id}.`);
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchVolunteer();
  }, [id]);

  if (loading) {
    return <p>Loading volunteer details...</p>;
  }

  if (error) {
    return <p style={{ color: 'red' }}>Error: {error}</p>;
  }

  if (!volunteer) {
    return <p>Volunteer not found.</p>;
  }

  return (
    <div>
      <h2>Volunteer Details</h2>
      <p><strong>Name:</strong> {volunteer.contact_first_name} {volunteer.contact_last_name}</p>
      <p><strong>Email:</strong> {volunteer.contact_email || 'N/A'}</p>
      <p><strong>Skills:</strong> {volunteer.skills || 'N/A'}</p>
      <p><strong>Availability:</strong> {volunteer.availability || 'N/A'}</p>
      <p><strong>Status:</strong> {volunteer.status_display || volunteer.status}</p>
      <p><strong>Joined Date:</strong> {volunteer.joined_date ? new Date(volunteer.joined_date).toLocaleDateString() : 'N/A'}</p>
      <p><strong>Emergency Contact:</strong> {volunteer.emergency_contact_name || 'N/A'} ({volunteer.emergency_contact_phone || 'N/A'})</p>

      <Link to={`/volunteers/${volunteer.contact}/edit`} style={{ marginRight: '10px' }}>Edit</Link>
      <Link to="/volunteers">Back to List</Link>
      {/* Delete button could be here too */}
    </div>
  );
};

export default VolunteerDetail;
