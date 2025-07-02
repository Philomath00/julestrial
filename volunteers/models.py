from django.db import models
from django.contrib.auth.models import User
from contacts.models import Contact

class VolunteerStatus(models.TextChoices):
    ACTIVE = 'ACT', 'Active'
    INACTIVE = 'INA', 'Inactive'
    PENDING_APPROVAL = 'PEN', 'Pending Approval'
    # Add more statuses as needed, e.g., 'ON_HOLD', 'REJECTED'

class Volunteer(models.Model):
    contact = models.OneToOneField(Contact, on_delete=models.CASCADE, primary_key=True)
    # skills can be a JSONField (PostgreSQL specific) or a ManyToManyField to a Skill model
    # For simplicity with basic Django, using TextField. Consider a separate Skill model for better querying.
    skills = models.TextField(blank=True, help_text="Comma-separated list of skills")
    # availability can also be more complex, e.g. JSONField or related models for time slots
    availability = models.TextField(blank=True, help_text="General availability, e.g., 'Weekends', 'Mon-Fri evenings'")
    emergency_contact_name = models.CharField(max_length=200, blank=True)
    emergency_contact_phone = models.CharField(max_length=20, blank=True)
    status = models.CharField(
        max_length=3,
        choices=VolunteerStatus.choices,
        default=VolunteerStatus.PENDING_APPROVAL,
    )
    joined_date = models.DateField(auto_now_add=True) # Or allow manual setting if importing old data
    # supervisor = models.ForeignKey(User, related_name='supervised_volunteers', on_delete=models.SET_NULL, null=True, blank=True) # Example

    class Meta:
        ordering = ['contact__first_name', 'contact__last_name']

    def __str__(self):
        return f"Volunteer: {self.contact}"

# VolunteerHoursLog will be defined in the 'projects' app or a dedicated 'tracking' app
# as it links Volunteers to Projects.
# If you need it here, ensure Project model is defined or use a string reference:
# project = models.ForeignKey('projects.Project', on_delete=models.SET_NULL, null=True, blank=True)
# For now, we'll assume VolunteerHoursLog is part of the projects app or a future app.
