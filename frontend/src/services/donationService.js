import apiClient from './api';

const donationService = {
  getAllDonations: (params) => { // params for filtering/pagination if needed
    return apiClient.get('/donations/', { params });
  },

  getDonationById: (id) => {
    return apiClient.get(`/donations/${id}/`);
  },

  createDonation: (donationData) => {
    // donationData should include:
    // donor_contact_id, donation_date, donation_type,
    // (if monetary): amount, payment_method
    // (if in-kind): in_kind_details: { item_name, quantity, ... }
    // campaign_id (optional), notes (optional)
    return apiClient.post('/donations/', donationData);
  },

  updateDonation: (id, donationData) => {
    return apiClient.put(`/donations/${id}/`, donationData); // Or PATCH
  },

  deleteDonation: (id) => {
    return apiClient.delete(`/donations/${id}/`);
  },

  // It might be useful to have services for related models too, e.g.,
  // getContactsForSelect: () => apiClient.get('/contacts/?limit=1000'), // For dropdowns
  // getCampaignsForSelect: () => apiClient.get('/campaigns/?limit=1000'), // For dropdowns
};

export default donationService;
