import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import './App.css';
import VolunteerList from './components/volunteers/VolunteerList';
import VolunteerDetail from './components/volunteers/VolunteerDetail'; // Assuming this exists or will be created
import VolunteerForm from './components/volunteers/VolunteerForm';

import DonationList from './components/donations/DonationList';
import DonationDetail from './components/donations/DonationDetail'; // Assuming this exists
import DonationForm from './components/donations/DonationForm';

import InventoryItemList from './components/inventory/InventoryItemList';
import InventoryItemDetail from './components/inventory/InventoryItemDetail'; // Assuming this exists
import InventoryItemForm from './components/inventory/InventoryItemForm';   // Assuming this exists
import StockAdjustmentForm from './components/inventory/StockAdjustmentForm';

import ContactList from './components/contacts/ContactList';
import ContactDetail from './components/contacts/ContactDetail';
import ContactForm from './components/contacts/ContactForm';

import ProjectList from './components/projects/ProjectList';
import ProjectDetail from './components/projects/ProjectDetail'; // Assuming this exists
import ProjectForm from './components/projects/ProjectForm';   // Assuming this exists

import CampaignList from './components/fundraising/CampaignList'; // Import CampaignList

// Placeholder components for other routes
const Home = () => <h2>Home</h2>;
// Placeholders for Campaign specific views
const CampaignDetail = () => <h2>Campaign Detail & Donations (TODO)</h2>;
const CampaignForm = () => <h2>Campaign Form (Create/Edit - TODO)</h2>;


function App() {
  return (
    <Router>
      <div className="App">
        <nav style={{ marginBottom: '20px', background: '#f0f0f0', padding: '10px' }}>
          <Link to="/" style={{ marginRight: '10px' }}>Home</Link>
          <Link to="/contacts" style={{ marginRight: '10px' }}>Contacts</Link>
          <Link to="/volunteers" style={{ marginRight: '10px' }}>Volunteers</Link>
          <Link to="/donations" style={{ marginRight: '10px' }}>Donations</Link>
          <Link to="/inventory" style={{ marginRight: '10px' }}>Inventory</Link>
          <Link to="/projects" style={{ marginRight: '10px' }}>Projects</Link>
          <Link to="/campaigns" style={{ marginRight: '10px' }}>Fundraising</Link>
          {/* Add other top-level navigation links here */}
        </nav>

        <div style={{ padding: '20px' }}>
          <Routes>
            <Route path="/" element={<Home />} />
            {/* Contact Routes */}
            <Route path="/contacts" element={<ContactList />} />
            <Route path="/contacts/new" element={<ContactForm />} />
            <Route path="/contacts/:id" element={<ContactDetail />} />
            <Route path="/contacts/:id/edit" element={<ContactForm />} />

            {/* Volunteer Routes */}
            <Route path="/volunteers" element={<VolunteerList />} />
            <Route path="/volunteers/new" element={<VolunteerForm />} />
            <Route path="/volunteers/:id" element={<VolunteerDetail />} />
            <Route path="/volunteers/:id/edit" element={<VolunteerForm />} />

            {/* Donation Routes */}
            <Route path="/donations" element={<DonationList />} />
            <Route path="/donations/new" element={<DonationForm />} />
            <Route path="/donations/:id" element={<DonationDetail />} />
            <Route path="/donations/:id/edit" element={<DonationForm />} />

            {/* Inventory Routes */}
            <Route path="/inventory" element={<InventoryItemList />} />
            <Route path="/inventory/items/new" element={<InventoryItemForm />} />
            <Route path="/inventory/items/:id" element={<InventoryItemDetail />} />
            <Route path="/inventory/items/:id/edit" element={<InventoryItemForm />} />
            <Route path="/inventory/items/:id/adjust" element={<StockAdjustmentForm />} />

            {/* Project Routes */}
            <Route path="/projects" element={<ProjectList />} />
            <Route path="/projects/new" element={<ProjectForm />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/projects/:id/edit" element={<ProjectForm />} />

            {/* Fundraising Campaign Routes */}
            <Route path="/campaigns" element={<CampaignList />} />
            <Route path="/campaigns/new" element={<CampaignForm />} />
            <Route path="/campaigns/:id" element={<CampaignDetail />} />
            <Route path="/campaigns/:id/edit" element={<CampaignForm />} />

          </Routes>
        </div>

        <footer style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #ccc', textAlign: 'center' }}>
          <p>NGO CRM &copy; 2024</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
