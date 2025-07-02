from django.db import models
from django.contrib.auth.models import User
from contacts.models import Contact
# from fundraising.models import Campaign # Forward reference or direct import if no circularity

class DonationType(models.TextChoices):
    MONETARY = 'MON', 'Monetary'
    IN_KIND = 'INK', 'In-Kind'
    # Add other types like 'SERVICE', 'GRANT' if needed

class PaymentMethod(models.TextChoices):
    CASH = 'CSH', 'Cash'
    CARD = 'CRD', 'Credit/Debit Card'
    BANK_TRANSFER = 'BNK', 'Bank Transfer'
    CHECK = 'CHK', 'Check' # Added Check
    ONLINE = 'ONL', 'Online Platform' # e.g. PayPal, Stripe
    OTHER = 'OTH', 'Other'

class Donation(models.Model):
    donor_contact = models.ForeignKey(Contact, related_name='donations_made', on_delete=models.PROTECT, help_text="Contact record of the donor") # PROTECT to prevent accidental deletion of donor with history
    campaign = models.ForeignKey('fundraising.Campaign', related_name='donations', on_delete=models.SET_NULL, null=True, blank=True, help_text="Associated fundraising campaign, if any")
    donation_date = models.DateField()
    amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text="Amount for monetary donations")
    donation_type = models.CharField(
        max_length=3,
        choices=DonationType.choices,
        default=DonationType.MONETARY,
    )
    payment_method = models.CharField(
        max_length=3,
        choices=PaymentMethod.choices,
        blank=True, # Can be blank for in-kind donations
        null=True,
    )
    notes = models.TextField(blank=True)
    received_by = models.ForeignKey(User, related_name='donations_received', on_delete=models.SET_NULL, null=True, blank=True, help_text="Staff member who recorded the donation")
    is_anonymous = models.BooleanField(default=False, help_text="Check if the donor wishes to remain anonymous publicly")
    # acknowledgement_sent = models.BooleanField(default=False)
    # acknowledgement_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-donation_date', '-created_at']

    def __str__(self):
        return f"Donation from {self.donor_contact} on {self.donation_date} ({self.get_donation_type_display()})"

class InKindDonationItemCondition(models.TextChoices):
    NEW = 'NEW', 'New'
    GOOD = 'GOD', 'Good'
    FAIR = 'FAR', 'Fair'
    POOR = 'POR', 'Poor'

class InKindDonationDetail(models.Model):
    donation = models.OneToOneField(Donation, on_delete=models.CASCADE, related_name='in_kind_details', primary_key=True, help_text="Links to the main donation record of type 'In-Kind'")
    item_name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    estimated_value = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    quantity = models.PositiveIntegerField(default=1)
    condition = models.CharField(
        max_length=3,
        choices=InKindDonationItemCondition.choices,
        default=InKindDonationItemCondition.GOOD,
        blank=True,
        null=True
    )
    # received_location = models.CharField(max_length=255, blank=True) # If tracking where it was received
    # project_allocation = models.ForeignKey('projects.Project', on_delete=models.SET_NULL, null=True, blank=True) # If directly allocated to a project

    class Meta:
        verbose_name = "In-Kind Donation Detail"
        verbose_name_plural = "In-Kind Donation Details"

    def __str__(self):
        return f"{self.quantity} x {self.item_name} (Value: {self.estimated_value or 'N/A'}) for Donation ID: {self.donation.id}"
