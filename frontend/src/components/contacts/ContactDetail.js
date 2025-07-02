import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import contactService from '../../services/contactService';
import { format } from 'date-fns';

const ContactDetail = () => {
  const [contact, setContact] = useState(null);
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [noteError, setNoteError] = useState(null);
  const { id } = useParams();

  const fetchContactAndNotes = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const contactResponse = await contactService.getContactById(id);
      setContact(contactResponse.data);

      const notesResponse = await contactService.getContactNotes(id);
      setNotes(notesResponse.data.results || notesResponse.data); // Assuming pagination or direct list

      setError(null);
    } catch (err) {
      setError(err.message || `Failed to fetch contact details for ID ${id}.`);
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContactAndNotes();
  }, [id]);

  const handleNoteChange = (e) => {
    setNewNote(e.target.value);
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) {
      setNoteError("Note text cannot be empty.");
      return;
    }
    setNoteError(null);
    try {
      const addedNote = await contactService.addNoteToContact(id, { note_text: newNote });
      setNotes(prevNotes => [addedNote.data, ...prevNotes]); // Add new note to the top
      setNewNote(''); // Clear input
    } catch (err) {
      setNoteError(err.message || "Failed to add note.");
      console.error("Add note error:", err.response?.data || err);
    }
  };

  if (loading) return <p>Loading contact details...</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;
  if (!contact) return <p>Contact not found.</p>;

  const displayName = contact.contact_type === 'ORG'
    ? contact.first_name
    : `${contact.first_name || ''} ${contact.last_name || ''}`.trim();

  return (
    <div>
      <h2>Contact: {displayName} (ID: {contact.id})</h2>
      <div style={{ border: '1px solid #ccc', padding: '15px', marginBottom: '15px' }}>
        <h4>Contact Information</h4>
        <p><strong>Type:</strong> {contact.contact_type_display || contact.contact_type}</p>
        <p><strong>Email:</strong> {contact.email || 'N/A'}</p>
        <p><strong>Phone:</strong> {contact.phone || 'N/A'}</p>
        <p><strong>Address:</strong> {contact.address || 'N/A'}</p>
        <p><strong>Created:</strong> {contact.created_at ? format(new Date(contact.created_at), 'PPP p') : 'N/A'}</p>
        <p><strong>Last Updated:</strong> {contact.updated_at ? format(new Date(contact.updated_at), 'PPP p') : 'N/A'}</p>
      </div>

      <Link to={`/contacts/${contact.id}/edit`} style={{ marginRight: '10px' }}>
        <button>Edit Contact</button>
      </Link>
      <Link to="/contacts">
        <button>Back to Contacts List</button>
      </Link>

      <div style={{ marginTop: '20px', border: '1px solid #ccc', padding: '15px' }}>
        <h4>Contact Notes</h4>
        <form onSubmit={handleAddNote} style={{ marginBottom: '15px' }}>
          <div>
            <textarea
              value={newNote}
              onChange={handleNoteChange}
              placeholder="Add a new note..."
              rows="3"
              style={{ width: 'calc(100% - 22px)', marginBottom: '5px', padding: '10px' }}
            />
          </div>
          {noteError && <p style={{color: 'red', fontSize: '0.9em'}}>{noteError}</p>}
          <button type="submit">Add Note</button>
        </form>
        {notes.length > 0 ? (
          <ul style={{ listStyleType: 'none', paddingLeft: 0 }}>
            {notes.map(note => (
              <li key={note.id} style={{ borderBottom: '1px solid #eee', padding: '10px 0' }}>
                <p style={{ margin: '0 0 5px 0' }}>{note.note_text}</p>
                <small>
                  By: {note.created_by ? note.created_by.username : 'System'} on {note.created_at ? format(new Date(note.created_at), 'Pp') : 'N/A'}
                </small>
              </li>
            ))}
          </ul>
        ) : (
          <p>No notes for this contact yet.</p>
        )}
      </div>
    </div>
  );
};

export default ContactDetail;
