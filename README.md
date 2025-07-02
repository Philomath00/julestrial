# NGO CRM Platform

A comprehensive Customer Relationship Management (CRM) platform tailored for Non-Governmental Organizations (NGOs) to manage volunteers, donations, inventory, projects, fundraising campaigns, and contacts efficiently.

## Project Overview

This platform is being built with a Python/Django backend providing a RESTful API, and a React frontend for the user interface. The goal is to provide a robust, user-friendly system to help NGOs streamline their operations and better engage with their communities.

**Current Development Status:**
*   Backend API for all core modules is functional.
*   Basic token-based authentication is implemented.
*   Initial backend unit tests (Phase 1) are in place.
*   Frontend React application scaffolded with basic CRUD UIs for all main modules.
*   SQLite is used for development (planned migration to PostgreSQL for production).

## Core Modules & Features

The CRM is organized into the following core modules:

1.  **Contacts Management:**
    *   Manage individuals and organizations.
    *   Store contact details (email, phone, address).
    *   Record notes specific to contacts.
    *   API Endpoints: `/api/contacts/`, `/api/contact-notes/`

2.  **Volunteer Management:**
    *   Register volunteers (links to a Contact record).
    *   Track volunteer skills, availability, status.
    *   Manage emergency contact information.
    *   Log volunteer hours (associated with projects).
    *   API Endpoints: `/api/volunteers/`, (hours logs often managed via project context)

3.  **Donation Management:**
    *   Record monetary and in-kind donations.
    *   Link donations to donor contacts and fundraising campaigns.
    *   Track payment methods, donation dates, and notes.
    *   For in-kind donations, manage item details (name, value, quantity, condition).
    *   API Endpoints: `/api/donations/`, `/api/inkind-details/`

4.  **Inventory Management:**
    *   Manage inventory items and categories.
    *   Track item details (unit of measure, quantity on hand, reorder level).
    *   Record inventory transactions (Stock In, Stock Out, Adjustments) which automatically update item quantities.
    *   API Endpoints: `/api/inventory-categories/`, `/api/inventory-items/`, `/api/inventory-transactions/`

5.  **Project Management:**
    *   Define and manage projects (name, description, status, budget, dates, location).
    *   Manage project tasks (assign to volunteers, track status, priority, due dates).
    *   Assign volunteers to projects with specific roles.
    *   Log volunteer hours against projects.
    *   API Endpoints: `/api/projects/`, `/api/tasks/`, `/api/volunteer-assignments/`, `/api/volunteer-hours/`

6.  **Fundraising Management (Campaigns):**
    *   Create and manage fundraising campaigns (name, goal amount, start/end dates, status).
    *   Link donations to campaigns to track progress.
    *   API Endpoints: `/api/campaigns/`

7.  **User Management & Authentication:**
    *   User registration, login (token-based), logout.
    *   API Endpoints: `/api/users/`

8.  **Reporting (Basic Foundations):**
    *   A summary endpoint providing key dashboard statistics.
    *   API Endpoint: `/api/reports/summary/dashboard/`

## Technology Stack

*   **Backend:** Python, Django, Django REST Framework
*   **Database:** SQLite (for development), PostgreSQL (planned for production)
*   **Frontend:** JavaScript, React, React Router
    *   (Planned: Axios for API calls, potentially a UI library and state management)
*   **API Documentation:** Initial notes in `API_DOCUMENTATION_NOTES.md`. (Planned: drf-spectacular for OpenAPI/Swagger)

## Getting Started

### Prerequisites

*   Python (3.8+ recommended)
*   Pip (Python package installer)
*   Node.js and npm (for frontend development)
*   Git

### Backend Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <repository-name>
    ```

2.  **Create and activate a virtual environment:**
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```

3.  **Install backend dependencies:**
    ```bash
    pip install -r requirements.txt
    # Note: requirements.txt may need to be generated if not present:
    # pip install django djangorestframework psycopg2-binary (or relevant DB driver)
    # pip freeze > requirements.txt
    ```
    Currently used key dependencies: `django`, `djangorestframework`, `psycopg2-binary` (even if using SQLite for now, it's in install list).

4.  **Database Migrations:**
    The project is currently configured to use SQLite (`db.sqlite3` will be created).
    ```bash
    python manage.py makemigrations
    python manage.py migrate
    ```

5.  **Create a superuser (optional, for Django Admin):**
    ```bash
    python manage.py createsuperuser
    ```

6.  **Run the Django development server:**
    ```bash
    python manage.py runserver
    ```
    The backend API will typically be available at `http://localhost:8000/api/`.

### Frontend Setup

1.  **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```

2.  **Install frontend dependencies:**
    ```bash
    npm install
    ```
    *Note: There have been intermittent issues with `npm install` in some sandbox environments, particularly with `@testing-library/user-event`. If you encounter E404 errors, try deleting `node_modules` and `package-lock.json` and running `npm install` again, or check your npm registry configuration and network.*
    Required dependencies include `react`, `react-dom`, `react-scripts`, `react-router-dom`, `axios`, `date-fns`.

3.  **Run the React development server:**
    ```bash
    npm start
    ```
    The frontend will typically be available at `http://localhost:3000`. It's configured with a proxy to the Django backend at `http://localhost:8000/api/`.

## API Usage

*   Refer to `API_DOCUMENTATION_NOTES.md` for a list of available endpoints and basic usage.
*   Most API endpoints require Token authentication.
    *   Register a user via `POST /api/users/register/`.
    *   Obtain a token via `POST /api/users/login/`.
    *   Include the token in the `Authorization` header for subsequent requests: `Authorization: Token <your_token_here>`.

## Running Tests

*   **Backend Tests:**
    ```bash
    python manage.py test <app_name>  # e.g., python manage.py test contacts
    python manage.py test             # To run all tests
    ```
*   **Frontend Tests:**
    ```bash
    cd frontend
    npm test
    ```

## Future Development & Contributions

This project is under active development. Key areas for future work include:
*   **Enhanced Frontend UX/UI:** Implementing a UI library, improving form controls (e.g., dynamic searchable dropdowns for foreign key selections), and overall styling.
*   **Advanced Features:** Building out more detailed functionalities within each module (e.g., task management within projects, advanced inventory tracking, detailed reporting views).
*   **User Roles & Permissions:** Implementing a robust role-based access control system.
*   **Reporting & Analytics:** Developing a full-fledged reporting module with customizable reports and data visualizations.
*   **Comprehensive Testing:** Expanding test coverage for both backend and frontend.
*   **Production Deployment:** Migrating to PostgreSQL, configuring for a production environment, and deploying to a hosting service.
*   **Full API Documentation:** Generating OpenAPI/Swagger documentation.

Contributions are welcome! Please refer to contribution guidelines (to be created).

## Known Issues / Areas for Investigation

*   **Volunteer Delete Cascade:** Deleting a `Volunteer` object currently does not delete the associated `Contact` object, which is contrary to expectations based on Django documentation for `OneToOneField(primary_key=True)`. This is noted in `volunteers/tests.py` and requires further investigation.
*   **(Local Environment) `npm install` issues:** Some users/environments might experience issues with `npm install` (specifically E404 for `@testing_library/user-event`). Standard npm troubleshooting (clearing cache, checking registry) is advised.
*   **Database:** Currently using SQLite for ease of development setup. Production deployment will target PostgreSQL.

---

This README provides a snapshot of the project. For more detailed information on specific modules or API endpoints, please refer to the relevant source code and the `API_DOCUMENTATION_NOTES.md` file.
