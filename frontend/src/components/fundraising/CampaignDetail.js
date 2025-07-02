import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import fundraisingService from '../../services/fundraisingService';
import { format } from 'date-fns'; // For date formatting
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'; // For basic chart

const CampaignDetail = () => {
  const [campaign, setCampaign] = useState(null);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { id: campaignId } = useParams();

  useEffect(() => {
    const fetchCampaignData = async () => {
      if (!campaignId) return;
      try {
        setLoading(true);
        const campaignRes = await fundraisingService.getCampaignById(campaignId);
        setCampaign(campaignRes.data);

        const donationsRes = await fundraisingService.getCampaignDonations(campaignId);
        setDonations(donationsRes.data.results || donationsRes.data);

        setError(null);
      } catch (err) {
        setError(err.message || `Failed to fetch campaign data for ID ${campaignId}.`);
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCampaignData();
  }, [campaignId]);

  if (loading) return <p>Loading campaign details...</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;
  if (!campaign) return <p>Campaign not found.</p>;

  const totalRaised = donations.reduce((sum, donation) => {
    // Assuming 'amount' exists and is a number for monetary donations
    return sum + (donation.donation_type === 'MON' ? parseFloat(donation.amount || 0) : 0);
  }, 0);

  const progress = campaign.goal_amount > 0 ? (totalRaised / parseFloat(campaign.goal_amount)) * 100 : 0;

  const chartData = [
    { name: 'Campaign Progress', Raised: totalRaised, Goal: parseFloat(campaign.goal_amount) }
  ];

  return (
    <div>
      <h2>Campaign: {campaign.name} (ID: {campaign.id})</h2>
      <Link to={`/campaigns/${campaign.id}/edit`} style={{ marginRight: '10px' }}>
        <button>Edit Campaign Info</button>
      </Link>
      <Link to="/campaigns">
        <button>Back to Campaigns List</button>
      </Link>

      <div style={{ border: '1px solid #eee', padding: '15px', margin: '15px 0' }}>
        <h4>Campaign Information</h4>
        <p><strong>Description:</strong> {campaign.description || 'N/A'}</p>
        <p><strong>Status:</strong> {campaign.status_display || campaign.status}</p>
        <p><strong>Goal Amount:</strong> ${parseFloat(campaign.goal_amount).toFixed(2)}</p>
        <p><strong>Total Raised (Monetary):</strong> ${totalRaised.toFixed(2)}</p>
        <p><strong>Progress:</strong> {progress.toFixed(2)}%</p>
        <div style={{ width: '100%', height: 50, backgroundColor: '#e0e0e0', borderRadius: '4px', marginTop: '5px', marginBottom: '15px' }}>
            <div style={{ width: `${Math.min(progress, 100)}%`, height: '100%', backgroundColor: '#4caf50', borderRadius: '4px', transition: 'width 0.5s ease-in-out' }} />
        </div>
        <p><strong>Start Date:</strong> {campaign.start_date ? format(new Date(campaign.start_date), 'PPP') : 'N/A'}</p>
        <p><strong>End Date:</strong> {campaign.end_date ? format(new Date(campaign.end_date), 'PPP') : 'N/A'}</p>
        <p><strong>Managed By:</strong> {campaign.managed_by?.username || 'N/A'}</p>
      </div>

      {/* Basic Bar Chart for Goal vs Raised - requires 'recharts' */}
      {/* <div style={{ border: '1px solid #eee', padding: '15px', margin: '15px 0', height: 300 }}>
        <h4>Goal vs Raised Chart</h4>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
            <Legend />
            <Bar dataKey="Raised" fill="#82ca9d" />
            <Bar dataKey="Goal" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div> */}


      <div style={{ border: '1px solid #eee', padding: '15px', margin: '15px 0' }}>
        <h4>Donations for this Campaign ({donations.length})</h4>
        {donations.length > 0 ? (
          <table border="1" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
            <thead>
              <tr>
                <th style={{padding: '8px'}}>Donation ID</th>
                <th style={{padding: '8px'}}>Date</th>
                <th style={{padding: '8px'}}>Donor</th>
                <th style={{padding: '8px'}}>Type</th>
                <th style={{padding: '8px'}}>Amount/Item</th>
              </tr>
            </thead>
            <tbody>
              {donations.map(donation => (
                <tr key={donation.id}>
                  <td style={{padding: '8px'}}><Link to={`/donations/${donation.id}`}>{donation.id}</Link></td>
                  <td style={{padding: '8px'}}>{donation.donation_date ? format(new Date(donation.donation_date), 'yyyy-MM-dd') : 'N/A'}</td>
                  <td style={{padding: '8px'}}>
                    {donation.donor_contact ? `${donation.donor_contact.first_name || ''} ${donation.donor_contact.last_name || ''}`.trim() : 'N/A'}
                  </td>
                  <td style={{padding: '8px'}}>{donation.donation_type_display || donation.donation_type}</td>
                  <td style={{padding: '8px', textAlign: 'right'}}>
                    {donation.donation_type === 'MON'
                      ? `$${parseFloat(donation.amount).toFixed(2)}`
                      : (donation.in_kind_details ? `${donation.in_kind_details.item_name} (Qty: ${donation.in_kind_details.quantity})` : 'In-Kind')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No donations recorded for this campaign yet.</p>
        )}
      </div>
    </div>
  );
};

export default CampaignDetail;
