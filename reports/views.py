from django.utils import timezone
from django.db.models import Sum, Count, Avg, F, ExpressionWrapper, fields
from django.db.models.functions import Coalesce
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions

from contacts.models import Contact, ContactType
from volunteers.models import Volunteer, VolunteerStatus
from projects.models import Project, ProjectStatus, VolunteerHoursLog
from donations.models import Donation, DonationType
from fundraising.models import Campaign, CampaignStatus
from inventory.models import InventoryItem
from decimal import Decimal

class DashboardSummaryReportAPIView(APIView):
    """
    Provides a summary of key metrics for the CRM dashboard.
    """
    permission_classes = [permissions.IsAuthenticated] # Or more specific permission

    def get(self, request, *args, **kwargs):
        now = timezone.now()
        current_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        current_year_start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)

        # Contact Stats
        total_contacts = Contact.objects.count()
        individual_contacts = Contact.objects.filter(contact_type=ContactType.INDIVIDUAL).count()
        organization_contacts = Contact.objects.filter(contact_type=ContactType.ORGANIZATION).count()

        # Volunteer Stats
        total_volunteers = Volunteer.objects.count()
        active_volunteers = Volunteer.objects.filter(status=VolunteerStatus.ACTIVE).count()

        total_volunteer_hours_all_time = VolunteerHoursLog.objects.aggregate(total_hours=Coalesce(Sum('hours_worked'), Decimal(0)))['total_hours']
        total_volunteer_hours_this_month = VolunteerHoursLog.objects.filter(date__gte=current_month_start).aggregate(total_hours=Coalesce(Sum('hours_worked'), Decimal(0)))['total_hours']

        # Project Stats
        total_projects = Project.objects.count()
        ongoing_projects = Project.objects.filter(status=ProjectStatus.IN_PROGRESS).count()
        completed_projects = Project.objects.filter(status=ProjectStatus.COMPLETED).count()

        # Donation Stats
        total_donations_this_month_amount = Donation.objects.filter(
            donation_date__gte=current_month_start, donation_type=DonationType.MONETARY
        ).aggregate(total=Coalesce(Sum('amount'), Decimal(0)))['total']

        total_donations_this_year_amount = Donation.objects.filter(
            donation_date__gte=current_year_start, donation_type=DonationType.MONETARY
        ).aggregate(total=Coalesce(Sum('amount'), Decimal(0)))['total']

        total_donations_all_time_count = Donation.objects.count()

        # Fundraising Stats
        active_campaigns_count = Campaign.objects.filter(status=CampaignStatus.ACTIVE).count()

        # Aggregate funds raised vs goals for active campaigns
        # This is more complex if done in one query; can be simplified or done per campaign
        active_campaigns_summary = []
        for campaign in Campaign.objects.filter(status=CampaignStatus.ACTIVE):
            raised = campaign.donations.filter(donation_type=DonationType.MONETARY).aggregate(total=Coalesce(Sum('amount'), Decimal(0)))['total']
            active_campaigns_summary.append({
                "name": campaign.name,
                "goal": campaign.goal_amount,
                "raised": raised,
                "progress_percent": (raised / campaign.goal_amount * 100) if campaign.goal_amount > 0 else 0
            })

        # Inventory Stats
        distinct_inventory_items = InventoryItem.objects.count()
        # total_inventory_value = InventoryItem.objects.annotate(
        #     item_value=ExpressionWrapper(F('quantity_on_hand') * F('average_cost'), output_field=fields.DecimalField()) # Assuming average_cost field exists
        # ).aggregate(total_value=Coalesce(Sum('item_value'), Decimal(0)))['total_value']
        # Assuming no average_cost for now, so total_inventory_value is omitted or simplified

        summary_data = {
            "contacts": {
                "total": total_contacts,
                "individuals": individual_contacts,
                "organizations": organization_contacts,
            },
            "volunteers": {
                "total": total_volunteers,
                "active": active_volunteers,
                "total_hours_logged_all_time": total_volunteer_hours_all_time,
                "total_hours_logged_this_month": total_volunteer_hours_this_month,
            },
            "projects": {
                "total": total_projects,
                "ongoing": ongoing_projects,
                "completed": completed_projects,
            },
            "donations": {
                "total_monetary_donations_this_month": total_donations_this_month_amount,
                "total_monetary_donations_this_year": total_donations_this_year_amount,
                "total_donation_records_all_time": total_donations_all_time_count,
            },
            "fundraising": {
                "active_campaigns_count": active_campaigns_count,
                "active_campaigns_details": active_campaigns_summary, # List of summaries
            },
            "inventory": {
                "distinct_item_types": distinct_inventory_items,
                # "total_estimated_value": total_inventory_value, # If calculable
            },
            "report_generated_at": now.isoformat(),
        }

        return Response(summary_data)
