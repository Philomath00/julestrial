from django.db import models
from django.contrib.auth.models import User
# from projects.models import Project # For linking transactions to projects

class InventoryCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    # parent_category = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='subcategories')

    class Meta:
        verbose_name = "Inventory Category"
        verbose_name_plural = "Inventory Categories"
        ordering = ['name']

    def __str__(self):
        return self.name

class InventoryItem(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    category = models.ForeignKey(InventoryCategory, related_name='items', on_delete=models.SET_NULL, null=True, blank=True)
    unit_of_measure = models.CharField(max_length=50, blank=True, help_text="e.g., 'pieces', 'kg', 'liters', 'boxes'")
    quantity_on_hand = models.DecimalField(max_digits=10, decimal_places=2, default=0.00) # Use Decimal for items like kg, liters
    # quantity_on_hand = models.PositiveIntegerField(default=0) # Use PositiveIntegerField for countable items
    reorder_level = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, help_text="Quantity at which to reorder")
    # reorder_level = models.PositiveIntegerField(default=0)
    # supplier = models.ForeignKey('contacts.Contact', on_delete=models.SET_NULL, null=True, blank=True, limit_choices_to={'contact_type': 'ORG'}) # Example if tracking suppliers
    # average_cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    last_stocktake_date = models.DateField(null=True, blank=True)
    # location_in_storage = models.CharField(max_length=100, blank=True, help_text="E.g. Shelf A, Room 101")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['category', 'name']
        verbose_name = "Inventory Item"
        verbose_name_plural = "Inventory Items"

    def __str__(self):
        return f"{self.name} ({self.quantity_on_hand} {self.unit_of_measure or 'units'})"

class InventoryTransactionType(models.TextChoices):
    IN = 'IN', 'Stock In'          # Receiving new stock, donations, returns
    OUT = 'OUT', 'Stock Out'        # Using stock for a project, distribution
    ADJUSTMENT = 'ADJ', 'Adjustment'  # Stocktake adjustments, spoilage, loss
    # TRANSFER = 'TRN', 'Transfer'    # Moving stock between locations (if multi-location)

class InventoryTransaction(models.Model):
    item = models.ForeignKey(InventoryItem, related_name='transactions', on_delete=models.PROTECT) # Protect item with history
    transaction_type = models.CharField(
        max_length=3,
        choices=InventoryTransactionType.choices,
    )
    quantity = models.DecimalField(max_digits=10, decimal_places=2, help_text="Positive for IN/ADJ+, Negative for OUT/ADJ- if you prefer, or always positive and type dictates logic")
    transaction_date = models.DateTimeField(auto_now_add=True) # Or make it a DateField if time is not important
    # project = models.ForeignKey('projects.Project', related_name='inventory_transactions', on_delete=models.SET_NULL, null=True, blank=True)
    user = models.ForeignKey(User, related_name='inventory_transactions_recorded', on_delete=models.SET_NULL, null=True, blank=True, help_text="User who recorded the transaction")
    notes = models.TextField(blank=True)
    # related_donation = models.ForeignKey('donations.InKindDonationDetail', on_delete=models.SET_NULL, null=True, blank=True, help_text="If stock came from an in-kind donation")

    class Meta:
        ordering = ['-transaction_date', 'item']
        verbose_name = "Inventory Transaction"
        verbose_name_plural = "Inventory Transactions"

    def __str__(self):
        return f"{self.get_transaction_type_display()} of {self.quantity} {self.item.unit_of_measure or 'units'} for {self.item.name} on {self.transaction_date.strftime('%Y-%m-%d')}"

    def save(self, *args, **kwargs):
        # Basic logic to update quantity_on_hand. More complex logic (e.g. atomicity) might be needed.
        # This is a simplified version. Consider using signals or overriding manager methods for robustness.
        # For this example, we assume quantity in transaction is always positive, and type dictates operation.

        # Get current state of item before this save (if it's an update to transaction)
        # This part is tricky if transaction itself is updated. Usually transactions are immutable.
        # For simplicity, this current logic assumes a new transaction.

        super().save(*args, **kwargs) # Save first to get an ID, if new.

        # Recalculate item quantity (less robust, better to do atomically or with signals)
        # This is a naive implementation for demonstration.
        # A more robust way is to fetch the item, update its quantity, and save it,
        # ideally within a database transaction.

        # For this step, we'll skip live quantity updates in the model's save method
        # as it can lead to race conditions and is better handled at the view/service layer
        # or via signals after the transaction is successfully committed.
        # The primary goal here is to define the model structure.
        pass

# Example of a more robust way to handle stock updates (typically in a signal or view)
# from django.db.models.signals import post_save
# from django.dispatch import receiver
# from django.db import transaction

# @receiver(post_save, sender=InventoryTransaction)
# def update_stock_on_transaction(sender, instance, created, **kwargs):
#     if created: # Only run when a new transaction is created
#         with transaction.atomic():
#             item = InventoryItem.objects.select_for_update().get(pk=instance.item.pk)
#             if instance.transaction_type == InventoryTransactionType.IN:
#                 item.quantity_on_hand += instance.quantity
#             elif instance.transaction_type == InventoryTransactionType.OUT:
#                 item.quantity_on_hand -= instance.quantity
#             elif instance.transaction_type == InventoryTransactionType.ADJUSTMENT:
#                 # For adjustments, quantity could be positive or negative,
#                 # or you might have a separate field for 'new_quantity_on_hand'
#                 # This example assumes quantity is the change amount.
#                 item.quantity_on_hand += instance.quantity # if quantity is signed
#                 # Or: item.quantity_on_hand = instance.quantity # if quantity is the new total
#             item.save()
