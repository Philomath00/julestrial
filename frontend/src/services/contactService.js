import apiClient from './api';

const contactService = {
  getAllContacts: (params) => {
    return apiClient.get('/contacts/', { params });
  },

  getContactById: (id) => {
    return apiClient.get(`/contacts/${id}/`);
  },

  createContact: (contactData) => {
    // contactData: { first_name, last_name (optional), email, phone, address, contact_type }
    return apiClient.post('/contacts/', contactData);
  },

  updateContact: (id, contactData) => {
    return apiClient.put(`/contacts/${id}/`, contactData); // Or PATCH
  },

  deleteContact: (id) => {
    return apiClient.delete(`/contacts/${id}/`);
  },

  // For Contact Notes (using custom actions on ContactViewSet)
  getContactNotes: (contactId, params) => {
    return apiClient.get(`/contacts/${contactId}/notes/`, { params });
  },

  addNoteToContact: (contactId, noteData) => {
    // noteData: { note_text } (created_by is set by backend)
    return apiClient.post(`/contacts/${contactId}/add_note/`, noteData);
  },

  // If managing notes via standalone ContactNoteViewSet (less common for creation)
  // deleteContactNote: (noteId) => {
  //   return apiClient.delete(`/contact-notes/${noteId}/`);
  // }
};

export default contactService;
