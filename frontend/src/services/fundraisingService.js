import apiClient from './api';

const fundraisingService = {
  // === Campaign Endpoints ===
  getAllCampaigns: (params) => {
    return apiClient.get('/campaigns/', { params });
  },
  getCampaignById: (id) => {
    return apiClient.get(`/campaigns/${id}/`);
  },
  createCampaign: (campaignData) => {
    // managed_by is set by backend
    return apiClient.post('/campaigns/', campaignData);
  },
  updateCampaign: (id, campaignData) => {
    return apiClient.put(`/campaigns/${id}/`, campaignData); // Or PATCH
  },
  deleteCampaign: (id) => {
    return apiClient.delete(`/campaigns/${id}/`);
  },

  // === Campaign-specific Donation Listing (using custom action) ===
  getCampaignDonations: (campaignId, params) => {
    return apiClient.get(`/campaigns/${campaignId}/donations/`, { params });
  },
};

export default fundraisingService;
