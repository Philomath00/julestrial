from django.db import models
from django.contrib.auth.models import User
# from contacts.models import Contact # If a campaign has a primary contact/manager from Contacts

class CampaignStatus(models.TextChoices):
    PLANNING = 'PLA', 'Planning'
    ACTIVE = 'ACT', 'Active'
    COMPLETED = 'COM', 'Completed'
    CANCELLED = 'CAN', 'Cancelled'
    ON_HOLD = 'HLD', 'On Hold'

class Campaign(models.Model):
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True)
    goal_amount = models.DecimalField(max_digits=12, decimal_places=2)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    status = models.CharField(
        max_length=3,
        choices=CampaignStatus.choices,
        default=CampaignStatus.PLANNING,
    )
    # campaign_type = models.CharField(max_length=100, blank=True, help_text="E.g., 'Annual Gala', 'Emergency Relief Fund'")
    managed_by = models.ForeignKey(User, related_name='campaigns_managed', on_delete=models.SET_NULL, null=True, blank=True, help_text="Staff member responsible for the campaign")
    # primary_contact = models.ForeignKey(Contact, related_name='campaigns_contacted_for', on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-start_date', 'name']
        verbose_name = "Fundraising Campaign"
        verbose_name_plural = "Fundraising Campaigns"

    def __str__(self):
        return self.name

    # Example property to calculate total raised, though this is better done with annotations in querysets
    # def total_raised(self):
    #     from donations.models import Donation # Avoid circular import at module level
    #     return self.donations.filter(donation_type=Donation.DonationType.MONETARY).aggregate(total=models.Sum('amount'))['total'] or 0

    # def progress_percentage(self):
    #     if self.goal_amount > 0:
    #         return (self.total_raised() / self.goal_amount) * 100
    #     return 0

# If you want to track specific fundraising events within a campaign:
# class FundraisingEvent(models.Model):
#     campaign = models.ForeignKey(Campaign, related_name='events', on_delete=models.CASCADE)
#     name = models.CharField(max_length=255)
#     event_date = models.DateTimeField()
#     location = models.CharField(max_length=255, blank=True)
#     description = models.TextField(blank=True)
#     target_attendees = models.PositiveIntegerField(null=True, blank=True)
#     actual_attendees = models.PositiveIntegerField(null=True, blank=True)
#     revenue_generated = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
#     created_at = models.DateTimeField(auto_now_add=True)
#     updated_at = models.DateTimeField(auto_now=True)

#     def __str__(self):
#         return f"{self.name} ({self.campaign.name})"
