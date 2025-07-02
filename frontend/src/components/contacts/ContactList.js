import React, { useState, useEffect } from 'react';
import contactService from '../../services/contactService';
import { Link } from 'react-router-dom';

const ContactList = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        setLoading(true);
        const response = await contactService.getAllContacts();
        setContacts(response.data.results || response.data);
        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to fetch contacts.');
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();
  }, []);

  const handleDelete = async (id) => {
    // Consider implications: if contact is donor or volunteer, deletion might be restricted or require cascade.
    // Backend Contact model does not have PROTECT from Volunteer (Volunteer is PK'd on Contact),
    // but Donation.donor_contact IS PROTECTED.
    if (window.confirm(`Are you sure you want to delete contact ${id}? This may fail if the contact is linked to protected records (e.g., donations).`)) {
      try {
        await contactService.deleteContact(id);
        setContacts(prevContacts => prevContacts.filter(contact => contact.id !== id));
        alert(`Contact ${id} deleted successfully.`);
      } catch (err) {
        alert(`Failed to delete contact ${id}: ${err.message} - ${err.response?.data?.detail || JSON.stringify(err.response?.data) || ''}`);
        console.error("Delete error:", err.response?.data || err);
      }
    }
  };

  if (loading) return <p>Loading contacts...</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;
  if (!contacts.length) {
    return (
      <div>
        <p>No contacts found.</p>
        <Link to="/contacts/new"><button>Add New Contact</button></Link>
      </div>
    );
  }

  return (
    <div>
      <h2>Contacts</h2>
      <Link to="/contacts/new">
        <button style={{ marginBottom: '1em' }}>Add New Contact</button>
      </Link>
      <table border="1" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{padding: '8px'}}>ID</th>
            <th style={{padding: '8px'}}>Name</th>
            <th style={{padding: '8px'}}>Email</th>
            <th style={{padding: '8px'}}>Phone</th>
            <th style={{padding: '8px'}}>Type</th>
            <th style={{padding: '8px'}}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {contacts.map((contact) => (
            <tr key={contact.id}>
              <td style={{padding: '8px'}}>{contact.id}</td>
              <td style={{padding: '8px'}}>
                {contact.contact_type === 'ORG' ? contact.first_name : `${contact.first_name || ''} ${contact.last_name || ''}`.trim()}
              </td>
              <td style={{padding: '8px'}}>{contact.email || 'N/A'}</td>
              <td style={{padding: '8px'}}>{contact.phone || 'N/A'}</td>
              <td style={{padding: '8px'}}>{contact.contact_type_display || contact.contact_type}</td>
              <td style={{padding: '8px', textAlign: 'center'}}>
                <Link to={`/contacts/${contact.id}`} style={{ marginRight: '5px' }}>
                  <button>View</button>
                </Link>
                <Link to={`/contacts/${contact.id}/edit`} style={{ marginRight: '5px' }}>
                  <button>Edit</button>
                </Link>
                <button onClick={() => handleDelete(contact.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ContactList;
