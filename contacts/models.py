from django.db import models
from django.contrib.auth.models import User

class ContactType(models.TextChoices):
    INDIVIDUAL = 'IND', 'Individual'
    ORGANIZATION = 'ORG', 'Organization'

class Contact(models.Model):
    first_name = models.CharField(max_length=100) # For individual's first name or organization's name
    last_name = models.CharField(max_length=100, blank=True) # For individual's last name, blank for organizations
    email = models.EmailField(unique=True, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    contact_type = models.CharField(
        max_length=3,
        choices=ContactType.choices,
        default=ContactType.INDIVIDUAL,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['first_name', 'last_name']

    def __str__(self):
        if self.contact_type == ContactType.ORGANIZATION:
            return self.first_name
        return f"{self.first_name} {self.last_name}".strip()

class ContactNote(models.Model):
    contact = models.ForeignKey(Contact, related_name='notes', on_delete=models.CASCADE)
    note_text = models.TextField()
    # Assuming you have a User model for staff/volunteers who create notes
    created_by = models.ForeignKey(User, related_name='contact_notes_created', on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Note for {self.contact} by {self.created_by or 'System'} on {self.created_at.strftime('%Y-%m-%d')}"
