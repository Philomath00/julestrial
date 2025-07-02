import React, { useState, useEffect, Suspense } from 'react'; // Added Suspense for lazy
import volunteerService from '../../services/volunteerService';
import { Link } from 'react-router-dom'; // Correct way to import Link

const VolunteerList = () => {
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVolunteers = async () => {
      try {
        setLoading(true);
        const response = await volunteerService.getAllVolunteers();
        setVolunteers(response.data.results || response.data);
        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to fetch volunteers.');
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchVolunteers();
  }, []);

  // Basic delete handler (confirmation and actual API call would be needed)
  const handleDelete = async (id) => {
    if (window.confirm(`Are you sure you want to delete volunteer ${id}?`)) {
      try {
        await volunteerService.deleteVolunteer(id);
        setVolunteers(volunteers.filter(v => v.contact !== id)); // Update UI
        alert(`Volunteer ${id} deleted successfully.`);
      } catch (err) {
        alert(`Failed to delete volunteer ${id}: ${err.message}`);
        console.error("Delete error:", err);
      }
    }
  };


  if (loading) {
    return <p>Loading volunteers...</p>;
  }

  if (error) {
    return <p style={{ color: 'red' }}>Error: {error}</p>;
  }

  if (!volunteers.length) {
    return (
      <div>
        <p>No volunteers found.</p>
        <Link to="/volunteers/new">
          <button>Add New Volunteer</button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2>Volunteers</h2>
      <Link to="/volunteers/new">
        <button style={{ marginBottom: '1em' }}>Add New Volunteer</button>
      </Link>
      <table border="1" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{padding: '8px'}}>Name</th>
            <th style={{padding: '8px'}}>Email</th>
            <th style={{padding: '8px'}}>Skills</th>
            <th style={{padding: '8px'}}>Status</th>
            <th style={{padding: '8px'}}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {volunteers.map((volunteer) => (
            <tr key={volunteer.contact}>
              <td style={{padding: '8px'}}>{volunteer.contact_first_name} {volunteer.contact_last_name}</td>
              <td style={{padding: '8px'}}>{volunteer.contact_email || 'N/A'}</td>
              <td style={{padding: '8px'}}>{volunteer.skills || 'N/A'}</td>
              <td style={{padding: '8px'}}>{volunteer.status_display || volunteer.status}</td>
              <td style={{padding: '8px', textAlign: 'center'}}>
                <Link to={`/volunteers/${volunteer.contact}`} style={{ marginRight: '5px' }}>
                  <button>View</button>
                </Link>
                <Link to={`/volunteers/${volunteer.contact}/edit`} style={{ marginRight: '5px' }}>
                  <button>Edit</button>
                </Link>
                <button onClick={() => handleDelete(volunteer.contact)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default VolunteerList;
