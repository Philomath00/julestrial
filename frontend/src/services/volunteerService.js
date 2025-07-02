import apiClient from './api';

const volunteerService = {
  getAllVolunteers: () => {
    return apiClient.get('/volunteers/');
  },

  getVolunteerById: (id) => {
    return apiClient.get(`/volunteers/${id}/`);
  },

  createVolunteer: (volunteerData) => {
    // volunteerData should be in the format expected by the backend:
    // { contact_data: { ... }, skills: "...", ... }
    return apiClient.post('/volunteers/', volunteerData);
  },

  updateVolunteer: (id, volunteerData) => {
    // volunteerData can include contact_data for nested updates,
    // and/or volunteer-specific fields.
    return apiClient.put(`/volunteers/${id}/`, volunteerData); // Or PATCH for partial updates
  },

  deleteVolunteer: (id) => {
    return apiClient.delete(`/volunteers/${id}/`);
  },

  // Example if you had custom actions like logging hours (not implemented yet in backend view)
  // logHoursForVolunteer: (id, hoursData) => {
  //   return apiClient.post(`/volunteers/${id}/log-hours/`, hoursData);
  // }
};

export default volunteerService;
