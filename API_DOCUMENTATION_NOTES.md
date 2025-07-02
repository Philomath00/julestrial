# API Endpoint Documentation (Initial Notes)

This document lists the primary API endpoints available in the NGO CRM.
All endpoints are prefixed with `/api/`. Authentication (Token-based) is required for most endpoints.

---

**1. Users & Authentication (`/api/users/`)**

*   `POST /api/users/register/`
    *   Description: Register a new user.
    *   Request Body: `{"username": "...", "password": "...", "email": "...", "first_name": "...", "last_name": "..."}`
    *   Response: User details and auth token.
*   `POST /api/users/login/`
    *   Description: Log in an existing user.
    *   Request Body: `{"username": "...", "password": "..."}`
    *   Response: Auth token and basic user info.
*   `POST /api/users/logout/`
    *   Description: Log out the current authenticated user (invalidates token). Requires authentication.
*   `GET /api/users/profile/`
    *   Description: Retrieve profile of the current authenticated user. Requires authentication.

---

**2. Contacts (`/api/contacts/`)**

*   `GET /api/contacts/`
    *   Description: List all contacts. Supports pagination.
*   `POST /api/contacts/`
    *   Description: Create a new contact.
    *   Request Body: `{"first_name": "...", "last_name": "...", "email": "...", "phone": "...", "address": "...", "contact_type": "IND" or "ORG"}`
*   `GET /api/contacts/{id}/`
    *   Description: Retrieve a specific contact.
*   `PUT /api/contacts/{id}/`
    *   Description: Update a specific contact (full update).
*   `PATCH /api/contacts/{id}/`
    *   Description: Partially update a specific contact.
*   `DELETE /api/contacts/{id}/`
    *   Description: Delete a specific contact. (Note: May be protected if linked to donations).
*   Custom Actions on Contact:
    *   `GET /api/contacts/{contact_id}/notes/`: List notes for a specific contact.
    *   `POST /api/contacts/{contact_id}/add_note/`: Add a note to a specific contact. Request Body: `{"note_text": "..."}`

**3. Contact Notes (`/api/contact-notes/`)** (Standalone management, less common for creation)

*   `GET /api/contact-notes/`
    *   Description: List all contact notes.
*   `POST /api/contact-notes/`
    *   Description: Create a new contact note (requires `contact` ID in payload).
    *   Request Body: `{"contact": contact_id, "note_text": "..."}`
*   `GET /api/contact-notes/{id}/`
    *   Description: Retrieve a specific contact note.
*   `PUT /api/contact-notes/{id}/`, `PATCH /api/contact-notes/{id}/`, `DELETE /api/contact-notes/{id}/`

---

**4. Volunteers (`/api/volunteers/`)**

*   `GET /api/volunteers/`
    *   Description: List all volunteers.
*   `POST /api/volunteers/`
    *   Description: Create a new volunteer (includes creating/linking a Contact).
    *   Request Body: `{"contact_data": {"first_name": ..., ...}, "skills": "...", "availability": "...", ...}`
*   `GET /api/volunteers/{contact_id}/`
    *   Description: Retrieve a specific volunteer (uses Contact ID as PK).
*   `PUT /api/volunteers/{contact_id}/`, `PATCH /api/volunteers/{contact_id}/`
    *   Description: Update a volunteer. Can update `contact_data` and/or volunteer-specific fields.
*   `DELETE /api/volunteers/{contact_id}/`
    *   Description: Delete a volunteer. (Note: Current behavior in tests shows Contact might not be deleted as expected by docs, needs review).

---

**5. Projects (`/api/projects/`)**

*   `GET /api/projects/`
    *   Description: List all projects.
*   `POST /api/projects/`
    *   Description: Create a new project. `created_by` is set automatically.
    *   Request Body: `{"name": "...", "description": "...", "status": "PLA", ...}`
*   `GET /api/projects/{id}/`
    *   Description: Retrieve a specific project.
*   `PUT /api/projects/{id}/`, `PATCH /api/projects/{id}/`, `DELETE /api/projects/{id}/`
*   Custom Actions on Project:
    *   `GET, POST /api/projects/{project_id}/tasks/`: List or create tasks for a project.
    *   `GET, POST /api/projects/{project_id}/volunteer-assignments/`: List or assign volunteers to a project.
    *   `GET, POST /api/projects/{project_id}/hours-log/`: List or log volunteer hours for a project.

**6. Project Tasks (`/api/tasks/`)** (Standalone management)

*   `GET /api/tasks/`, `POST /api/tasks/` (requires `project` ID in payload), `GET /api/tasks/{id}/`, `PUT/PATCH/DELETE /api/tasks/{id}/`

**7. Project Volunteer Assignments (`/api/volunteer-assignments/`)** (Standalone)

*   `GET /api/volunteer-assignments/`, `POST /api/volunteer-assignments/` (requires `project` & `volunteer_id`), etc.

**8. Volunteer Hours Logs (`/api/volunteer-hours/`)** (Standalone)

*   `GET /api/volunteer-hours/`, `POST /api/volunteer-hours/` (requires `volunteer_id`, `project` (optional), `date`, `hours_worked`), etc.

---

**9. Donations (`/api/donations/`)**

*   `GET /api/donations/`
    *   Description: List all donations.
*   `POST /api/donations/`
    *   Description: Create a new donation (monetary or in-kind). `received_by` set automatically.
    *   Request Body (Monetary): `{"donor_contact_id": ..., "donation_date": ..., "donation_type": "MON", "amount": ..., "payment_method": ...}`
    *   Request Body (In-Kind): `{"donor_contact_id": ..., "donation_date": ..., "donation_type": "INK", "in_kind_details": {"item_name": ..., "quantity": ...}}`
*   `GET /api/donations/{id}/`, `PUT /api/donations/{id}/`, `PATCH /api/donations/{id}/`, `DELETE /api/donations/{id}/` (Note: Deleting Contact linked here is protected).

**10. In-Kind Donation Details (`/api/inkind-details/`)** (Primarily managed via nested data in Donations)

*   `GET /api/inkind-details/{donation_id}/`, `PUT/PATCH/DELETE /api/inkind-details/{donation_id}/`

---

**11. Fundraising Campaigns (`/api/campaigns/`)**

*   `GET /api/campaigns/`
    *   Description: List all campaigns.
*   `POST /api/campaigns/`
    *   Description: Create a new campaign. `managed_by` set automatically.
    *   Request Body: `{"name": "...", "goal_amount": ..., "start_date": ..., ...}`
*   `GET /api/campaigns/{id}/`, `PUT /api/campaigns/{id}/`, `PATCH /api/campaigns/{id}/`, `DELETE /api/campaigns/{id}/`
*   Custom Actions on Campaign:
    *   `GET /api/campaigns/{campaign_id}/donations/`: List donations for a specific campaign.

---

**12. Inventory Categories (`/api/inventory-categories/`)**

*   Standard CRUD: `GET`, `POST`, `GET /api/inventory-categories/{id}/`, `PUT/PATCH/DELETE /api/inventory-categories/{id}/`

**13. Inventory Items (`/api/inventory-items/`)**

*   `GET /api/inventory-items/`
    *   Description: List all inventory items.
*   `POST /api/inventory-items/`
    *   Description: Create a new inventory item. `quantity_on_hand` is not set directly here (use transactions).
    *   Request Body: `{"name": "...", "category": category_id, ...}`
*   `GET /api/inventory-items/{id}/`, `PUT /api/inventory-items/{id}/`, `PATCH /api/inventory-items/{id}/`, `DELETE /api/inventory-items/{id}/`
*   Custom Actions on Inventory Item:
    *   `POST /api/inventory-items/{item_id}/adjust-stock/`: Adjust stock for an item. Request Body: `{"transaction_type": "ADJ", "quantity": delta_value, "notes": "..."}`.
    *   `GET /api/inventory-items/{item_id}/transactions/`: List transactions for a specific item.

**14. Inventory Transactions (`/api/inventory-transactions/`)** (Standalone management)

*   `GET /api/inventory-transactions/`
    *   Description: List all inventory transactions.
*   `POST /api/inventory-transactions/`
    *   Description: Create an inventory transaction (updates item stock automatically). `user` set automatically.
    *   Request Body: `{"item": item_id, "transaction_type": "IN" or "OUT" or "ADJ", "quantity": ..., "notes": "..."}`
*   `GET /api/inventory-transactions/{id}/`, `PUT/PATCH/DELETE /api/inventory-transactions/{id}/` (Note: Update/delete do not currently auto-adjust stock levels; requires care or further logic).

---

**15. Reports (`/api/reports/`)**

*   `GET /api/reports/summary/dashboard/`
    *   Description: Provides a summary of key metrics for a dashboard (e.g., total contacts, active volunteers, donation totals, etc.).

---

This list can be used as a starting point for more detailed API documentation, for example, by generating an OpenAPI/Swagger specification using tools like `drf-spectacular`.
