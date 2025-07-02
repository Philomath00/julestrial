from django.db import models
from django.contrib.auth.models import User
from volunteers.models import Volunteer # Corrected import path
from contacts.models import Contact # Assuming a project might have a primary contact person/org

class ProjectStatus(models.TextChoices):
    PLANNING = 'PLA', 'Planning'
    IN_PROGRESS = 'PRO', 'In Progress'
    COMPLETED = 'COM', 'Completed'
    ON_HOLD = 'HLD', 'On Hold'
    CANCELLED = 'CAN', 'Cancelled'

class TaskStatus(models.TextChoices):
    TODO = 'TD', 'To Do'
    IN_PROGRESS = 'PRO', 'In Progress'
    DONE = 'DN', 'Done'
    BLOCKED = 'BLK', 'Blocked'

class TaskPriority(models.TextChoices):
    LOW = 'L', 'Low'
    MEDIUM = 'M', 'Medium'
    HIGH = 'H', 'High'

class Project(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    status = models.CharField(
        max_length=3,
        choices=ProjectStatus.choices,
        default=ProjectStatus.PLANNING,
    )
    budget = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    location = models.CharField(max_length=255, blank=True)
    # primary_contact = models.ForeignKey(Contact, on_delete=models.SET_NULL, null=True, blank=True, related_name='projects_as_primary_contact')
    created_by = models.ForeignKey(User, related_name='projects_created', on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    # assigned_volunteers = models.ManyToManyField(Volunteer, through='ProjectVolunteerAssignment', related_name='projects')


    class Meta:
        ordering = ['-created_at', 'name']

    def __str__(self):
        return self.name

class ProjectTask(models.Model):
    project = models.ForeignKey(Project, related_name='tasks', on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    due_date = models.DateField(null=True, blank=True)
    assigned_to_volunteer = models.ForeignKey(Volunteer, related_name='assigned_tasks', on_delete=models.SET_NULL, null=True, blank=True)
    # assigned_to_user = models.ForeignKey(User, related_name='assigned_tasks', on_delete=models.SET_NULL, null=True, blank=True) # If staff can be assigned
    status = models.CharField(
        max_length=3,
        choices=TaskStatus.choices,
        default=TaskStatus.TODO,
    )
    priority = models.CharField(
        max_length=1,
        choices=TaskPriority.choices,
        default=TaskPriority.MEDIUM,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['project', 'priority', 'due_date', 'title']

    def __str__(self):
        return f"{self.title} (Project: {self.project.name})"

class ProjectVolunteerAssignment(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="volunteer_assignments")
    volunteer = models.ForeignKey(Volunteer, on_delete=models.CASCADE, related_name="project_assignments")
    role = models.CharField(max_length=100, blank=True, help_text="Role of the volunteer in this project")
    date_assigned = models.DateField(auto_now_add=True)
    # hours_expected = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)

    class Meta:
        unique_together = ('project', 'volunteer') # A volunteer can be assigned to a project only once
        ordering = ['project', 'volunteer']

    def __str__(self):
        return f"{self.volunteer} assigned to {self.project} as {self.role or 'Volunteer'}"


class VolunteerHoursLog(models.Model):
    volunteer = models.ForeignKey(Volunteer, related_name='hours_logged', on_delete=models.CASCADE)
    project = models.ForeignKey(Project, related_name='volunteer_hours', on_delete=models.SET_NULL, null=True, blank=True) # Hours can be logged not specific to a project
    date = models.DateField()
    hours_worked = models.DecimalField(max_digits=5, decimal_places=2)
    description = models.TextField(blank=True, help_text="Details of the work done")
    # approved_by = models.ForeignKey(User, related_name='approved_volunteer_hours', on_delete=models.SET_NULL, null=True, blank=True)
    # approval_status = models.CharField(max_length=3, choices=[('PEN','Pending'),('APP','Approved'),('REJ','Rejected')], default='PEN')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date', 'volunteer']
        verbose_name = "Volunteer Hours Log"
        verbose_name_plural = "Volunteer Hours Logs"

    def __str__(self):
        return f"{self.hours_worked} hours by {self.volunteer} on {self.date}"
