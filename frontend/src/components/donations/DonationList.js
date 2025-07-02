import React, { useState, useEffect } from 'react';
import donationService from '../../services/donationService';
import { Link } from 'react-router-dom';
import { format } from 'date-fns'; // For formatting dates

const DonationList = () => {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDonations = async () => {
      try {
        setLoading(true);
        const response = await donationService.getAllDonations();
        setDonations(response.data.results || response.data);
        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to fetch donations.');
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDonations();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm(`Are you sure you want to delete donation ${id}? This might be restricted by protected relations.`)) {
      try {
        await donationService.deleteDonation(id);
        setDonations(donations.filter(d => d.id !== id));
        alert(`Donation ${id} deleted successfully.`);
      } catch (err) {
        alert(`Failed to delete donation ${id}: ${err.message} - ${err.response?.data?.detail || ''}`);
        console.error("Delete error:", err.response?.data || err);
      }
    }
  };

  if (loading) return <p>Loading donations...</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;
  if (!donations.length) {
    return (
      <div>
        <p>No donations found.</p>
        <Link to="/donations/new"><button>Add New Donation</button></Link>
      </div>
    );
  }

  return (
    <div>
      <h2>Donations</h2>
      <Link to="/donations/new">
        <button style={{ marginBottom: '1em' }}>Add New Donation</button>
      </Link>
      <table border="1" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{padding: '8px'}}>ID</th>
            <th style={{padding: '8px'}}>Date</th>
            <th style={{padding: '8px'}}>Donor</th>
            <th style={{padding: '8px'}}>Type</th>
            <th style={{padding: '8px'}}>Amount/Item</th>
            <th style={{padding: '8px'}}>Campaign</th>
            <th style={{padding: '8px'}}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {donations.map((donation) => (
            <tr key={donation.id}>
              <td style={{padding: '8px'}}>{donation.id}</td>
              <td style={{padding: '8px'}}>{donation.donation_date ? format(new Date(donation.donation_date), 'yyyy-MM-dd') : 'N/A'}</td>
              <td style={{padding: '8px'}}>
                {donation.donor_contact ?
                  `${donation.donor_contact.first_name || ''} ${donation.donor_contact.last_name || ''} (ID: ${donation.donor_contact.id})`
                  : 'N/A'}
              </td>
              <td style={{padding: '8px'}}>{donation.donation_type_display || donation.donation_type}</td>
              <td style={{padding: '8px'}}>
                {donation.donation_type === 'MON'
                  ? `$${parseFloat(donation.amount).toFixed(2)}`
                  : (donation.in_kind_details ? `${donation.in_kind_details.item_name} (Qty: ${donation.in_kind_details.quantity})` : 'In-Kind (No Details)')}
              </td>
              <td style={{padding: '8px'}}>{donation.campaign ? donation.campaign.name : 'N/A'}</td>
              <td style={{padding: '8px', textAlign: 'center'}}>
                <Link to={`/donations/${donation.id}`} style={{ marginRight: '5px' }}>
                  <button>View</button>
                </Link>
                <Link to={`/donations/${donation.id}/edit`} style={{ marginRight: '5px' }}>
                  <button>Edit</button>
                </Link>
                <button onClick={() => handleDelete(donation.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DonationList;
