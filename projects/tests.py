from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from contacts.models import Contact, ContactType
from volunteers.models import Volunteer # Import Volunteer model
from .models import Project, ProjectStatus, ProjectTask, TaskStatus, TaskPriority, ProjectVolunteerAssignment, VolunteerHoursLog
import datetime

class ProjectModelTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='project_user', password='password')
        # Create a Contact instance for the Volunteer
        self.contact_for_volunteer_model_test = Contact.objects.create(
            first_name="VolContact",
            last_name="ForModel",
            email="volcontact.model@example.com",
            contact_type=ContactType.INDIVIDUAL
        )
        self.volunteer = Volunteer.objects.create(contact=self.contact_for_volunteer_model_test, skills="Planning")


    def test_create_project(self):
        project = Project.objects.create(
            name="Community Garden Initiative",
            description="Establish a community garden.",
            status=ProjectStatus.PLANNING,
            created_by=self.user
        )
        self.assertEqual(str(project), "Community Garden Initiative")
        self.assertEqual(project.status, ProjectStatus.PLANNING)

    def test_create_project_task(self):
        project = Project.objects.create(name="Test Project Task", created_by=self.user)
        task = ProjectTask.objects.create(
            project=project,
            title="Initial Task Planning",
            status=TaskStatus.TODO,
            priority=TaskPriority.HIGH
        )
        self.assertEqual(str(task), f"Initial Task Planning (Project: {project.name})")
        self.assertEqual(task.priority, TaskPriority.HIGH)

    def test_create_project_volunteer_assignment(self):
        project = Project.objects.create(name="Vol Assign Project", created_by=self.user)
        assignment = ProjectVolunteerAssignment.objects.create(
            project=project,
            volunteer=self.volunteer,
            role="Lead Coordinator"
        )
        self.assertEqual(str(assignment), f"{self.volunteer} assigned to {project} as Lead Coordinator")

    def test_create_volunteer_hours_log(self):
        project = Project.objects.create(name="Hours Log Project", created_by=self.user)
        log = VolunteerHoursLog.objects.create(
            volunteer=self.volunteer,
            project=project,
            date=datetime.date.today(),
            hours_worked=Decimal('5.50') # Use Decimal for DecimalField
        )
        # Format hours_worked to match string representation if it includes .0 for whole numbers
        self.assertEqual(str(log), f"{Decimal('5.50')} hours by {self.volunteer} on {datetime.date.today().isoformat()}")


class ProjectAPITests(APITestCase):
    def setUp(self):
        self.api_user = User.objects.create_user(username='api_testuser_p', password='testpassword123')
        self.token = Token.objects.create(user=self.api_user)
        self.client = APIClient()
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.token.key)

        self.project1_data = {
            "name": "Summer Festival Prep",
            "description": "Planning and execution of the annual summer festival.",
            "status": ProjectStatus.IN_PROGRESS
        }
        self.project1 = Project.objects.create(name=self.project1_data["name"], description=self.project1_data["description"], status=self.project1_data["status"], created_by=self.api_user)

        # Setup volunteer for task assignment tests
        self.contact_for_api_volunteer = Contact.objects.create(email="vol_for_proj_api@example.com", first_name="ApiVol")
        self.volunteer_for_task = Volunteer.objects.create(contact=self.contact_for_api_volunteer)


    def test_create_project(self):
        url = reverse('project-list')
        data = {
            "name": "New Library Wing",
            "description": "Fundraising and construction of a new library wing.",
            "status": ProjectStatus.PLANNING,
            "budget": "50000.00", # Send as string for DecimalField via JSON
            "start_date": datetime.date.today().isoformat(),
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(Project.objects.count(), 2)
        self.assertEqual(response.data['name'], "New Library Wing")
        self.assertEqual(response.data['created_by']['id'], self.api_user.pk)

    def test_get_projects_list(self):
        url = reverse('project-list')
        Project.objects.create(name="Tree Planting Day", created_by=self.api_user, status=ProjectStatus.COMPLETED)

        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data if not isinstance(response.data, dict) or 'results' not in response.data else response.data['results']
        self.assertEqual(len(results), 2)

    def test_get_single_project(self):
        url = reverse('project-detail', kwargs={'pk': self.project1.pk})
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], self.project1_data['name'])
        # Check for annotated field if ProjectSerializer has it and view provides it
        # self.assertEqual(response.data.get('tasks_count'), 0) # Example

    def test_create_task_for_project_action(self):
        url = reverse('project-tasks-list-create', kwargs={'pk': self.project1.pk})
        data = {
            "title": "Secure Venue for Festival",
            "description": "Sign contract with city park.",
            "status": TaskStatus.TODO,
            "priority": TaskPriority.HIGH,
            "due_date": (datetime.date.today() + datetime.timedelta(days=30)).isoformat(),
            "assigned_to_volunteer_id": self.volunteer_for_task.pk
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(response.data['title'], "Secure Venue for Festival")
        self.assertTrue(ProjectTask.objects.filter(project=self.project1, title="Secure Venue for Festival").exists())
        self.assertEqual(response.data['assigned_to_volunteer']['contact_id'], self.volunteer_for_task.pk)

    def test_list_tasks_for_project_action(self):
        ProjectTask.objects.create(project=self.project1, title="Task 1 for Project 1", status=TaskStatus.DONE)
        ProjectTask.objects.create(project=self.project1, title="Task 2 for Project 1", status=TaskStatus.IN_PROGRESS)

        url = reverse('project-tasks-list-create', kwargs={'pk': self.project1.pk})
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data if not isinstance(response.data, dict) or 'results' not in response.data else response.data['results']
        self.assertEqual(len(results), 2)


class ProjectTaskAPITests(APITestCase): # Standalone Task ViewSet tests
    def setUp(self):
        self.user = User.objects.create_user(username='task_user_standalone', password='password')
        self.token = Token.objects.create(user=self.user)
        self.client = APIClient() # Create a new client for this test class
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.token.key)
        self.project = Project.objects.create(name="Standalone Task Project Main", created_by=self.user)

    def test_create_task_via_standalone_endpoint(self):
        url = reverse('projecttask-list')
        data = {
            "project": self.project.pk,
            "title": "Standalone Task Test",
            "status": TaskStatus.TODO
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(response.data['title'], "Standalone Task Test")
        self.assertTrue(ProjectTask.objects.filter(title="Standalone Task Test", project=self.project).exists())
        self.assertEqual(response.data['project'], self.project.pk)

# Need to import Decimal for VolunteerHoursLog
from decimal import Decimal
