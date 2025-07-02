import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import donationService from '../../services/donationService';
import { format } from 'date-fns'; // For formatting dates

const DonationDetail = () => {
  const [donation, setDonation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { id } = useParams();

  useEffect(() => {
    const fetchDonation = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const response = await donationService.getDonationById(id);
        setDonation(response.data);
        setError(null);
      } catch (err) {
        setError(err.message || `Failed to fetch donation with ID ${id}.`);
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDonation();
  }, [id]);

  if (loading) return <p>Loading donation details...</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;
  if (!donation) return <p>Donation not found.</p>;

  return (
    <div>
      <h2>Donation Details (ID: {donation.id})</h2>
      <div style={{ border: '1px solid #ccc', padding: '15px', marginBottom: '15px' }}>
        <h4>General Information</h4>
        <p><strong>Date:</strong> {donation.donation_date ? format(new Date(donation.donation_date), 'PPP') : 'N/A'}</p>
        <p>
          <strong>Donor:</strong>
          {donation.donor_contact ?
            `${donation.donor_contact.first_name || ''} ${donation.donor_contact.last_name || ''} (Contact ID: ${donation.donor_contact.id})`
            : 'N/A'}
        </p>
        <p>
          <strong>Campaign:</strong>
          {donation.campaign ? donation.campaign.name : 'N/A'} (Campaign ID: {donation.campaign ? donation.campaign.id : 'N/A'})
        </p>
        <p><strong>Type:</strong> {donation.donation_type_display || donation.donation_type}</p>
        <p><strong>Anonymous:</strong> {donation.is_anonymous ? 'Yes' : 'No'}</p>
        <p><strong>Notes:</strong> {donation.notes || 'N/A'}</p>
        <p>
          <strong>Received By:</strong>
          {donation.received_by ? donation.received_by.username : 'N/A'} (User ID: {donation.received_by ? donation.received_by.id : 'N/A'})
        </p>
      </div>

      {donation.donation_type === 'MON' && (
        <div style={{ border: '1px solid #ccc', padding: '15px', marginBottom: '15px' }}>
          <h4>Monetary Details</h4>
          <p><strong>Amount:</strong> ${donation.amount ? parseFloat(donation.amount).toFixed(2) : 'N/A'}</p>
          <p><strong>Payment Method:</strong> {donation.payment_method_display || donation.payment_method || 'N/A'}</p>
        </div>
      )}

      {donation.donation_type === 'INK' && donation.in_kind_details && (
        <div style={{ border: '1px solid #ccc', padding: '15px', marginBottom: '15px' }}>
          <h4>In-Kind Item Details</h4>
          <p><strong>Item Name:</strong> {donation.in_kind_details.item_name || 'N/A'}</p>
          <p><strong>Description:</strong> {donation.in_kind_details.description || 'N/A'}</p>
          <p><strong>Estimated Value:</strong> ${donation.in_kind_details.estimated_value ? parseFloat(donation.in_kind_details.estimated_value).toFixed(2) : 'N/A'}</p>
          <p><strong>Quantity:</strong> {donation.in_kind_details.quantity || 'N/A'}</p>
          <p><strong>Condition:</strong> {donation.in_kind_details.condition_display || donation.in_kind_details.condition || 'N/A'}</p>
        </div>
      )}
       {donation.donation_type === 'INK' && !donation.in_kind_details && (
        <div style={{ border: '1px solid #ccc', padding: '15px', marginBottom: '15px' }}>
            <h4>In-Kind Item Details</h4>
            <p>No in-kind details recorded for this donation.</p>
        </div>
      )}


      <Link to={`/donations/${donation.id}/edit`} style={{ marginRight: '10px' }}>
        <button>Edit Donation</button>
      </Link>
      <Link to="/donations">
        <button>Back to Donations List</button>
      </Link>
    </div>
  );
};

export default DonationDetail;
