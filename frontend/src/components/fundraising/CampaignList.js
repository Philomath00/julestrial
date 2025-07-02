import React, { useState, useEffect } from 'react';
import fundraisingService from '../../services/fundraisingService';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

const CampaignList = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        setLoading(true);
        const response = await fundraisingService.getAllCampaigns();
        setCampaigns(response.data.results || response.data);
        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to fetch campaigns.');
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm(`Are you sure you want to delete campaign ${id}? This might also affect related donations (e.g., set their campaign link to null).`)) {
      try {
        await fundraisingService.deleteCampaign(id);
        setCampaigns(prevCampaigns => prevCampaigns.filter(campaign => campaign.id !== id));
        alert(`Campaign ${id} deleted successfully.`);
      } catch (err) {
        alert(`Failed to delete campaign ${id}: ${err.message} - ${err.response?.data?.detail || ''}`);
        console.error("Delete error:", err.response?.data || err);
      }
    }
  };

  if (loading) return <p>Loading campaigns...</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;
  if (!campaigns.length) {
    return (
      <div>
        <p>No campaigns found.</p>
        <Link to="/campaigns/new"><button>Add New Campaign</button></Link>
      </div>
    );
  }

  return (
    <div>
      <h2>Fundraising Campaigns</h2>
      <Link to="/campaigns/new">
        <button style={{ marginBottom: '1em' }}>Add New Campaign</button>
      </Link>
      <table border="1" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{padding: '8px'}}>ID</th>
            <th style={{padding: '8px'}}>Name</th>
            <th style={{padding: '8px'}}>Status</th>
            <th style={{padding: '8px'}}>Goal Amount</th>
            <th style={{padding: '8px'}}>Start Date</th>
            <th style={{padding: '8px'}}>End Date</th>
            {/* <th style={{padding: '8px'}}>Total Raised</th> Placeholder from serializer if enabled */}
            <th style={{padding: '8px'}}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {campaigns.map((campaign) => (
            <tr key={campaign.id}>
              <td style={{padding: '8px'}}>{campaign.id}</td>
              <td style={{padding: '8px'}}>{campaign.name}</td>
              <td style={{padding: '8px'}}>{campaign.status_display || campaign.status}</td>
              <td style={{padding: '8px', textAlign: 'right'}}>${parseFloat(campaign.goal_amount).toFixed(2)}</td>
              <td style={{padding: '8px'}}>{campaign.start_date ? format(new Date(campaign.start_date), 'yyyy-MM-dd') : 'N/A'}</td>
              <td style={{padding: '8px'}}>{campaign.end_date ? format(new Date(campaign.end_date), 'yyyy-MM-dd') : 'N/A'}</td>
              {/* <td style={{padding: '8px', textAlign: 'right'}}>${campaign.total_raised ? parseFloat(campaign.total_raised).toFixed(2) : '0.00'}</td> */}
              <td style={{padding: '8px', textAlign: 'center'}}>
                <Link to={`/campaigns/${campaign.id}`} style={{ marginRight: '5px' }}>
                  <button>View Details</button>
                </Link>
                <Link to={`/campaigns/${campaign.id}/edit`} style={{ marginRight: '5px' }}>
                  <button>Edit</button>
                </Link>
                <button onClick={() => handleDelete(campaign.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CampaignList;
