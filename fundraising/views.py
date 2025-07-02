from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, Count
from .models import Campaign #, FundraisingEvent
from .serializers import CampaignSerializer #, FundraisingEventSerializer
from donations.models import Donation # For fetching related donations if needed
from donations.serializers import DonationSerializer # For listing donations for a campaign

class CampaignViewSet(viewsets.ModelViewSet):
    queryset = Campaign.objects.all()
    serializer_class = CampaignSerializer
    permission_classes = [permissions.IsAuthenticated] # Adjust

    def get_queryset(self):
        queryset = super().get_queryset().select_related('managed_by')
        # Annotate with total raised and number of donations
        # Note: 'donations' is the related_name from Donation.campaign
        # Donation.amount is the field to sum.
        # Ensure that only monetary donations are summed if that's the requirement.
        # This example sums all 'amount' fields from related donations.
        # If you need to filter by donation_type='MON', it's more complex here.
        # A simpler way for monetary only: filter donations by type then sum.
        # For now, this sums 'amount' of all linked donations.
        # queryset = queryset.annotate(
        #     total_raised=Sum('donations__amount'), # Sums amount from all related donations
        #     donations_count=Count('donations')
        # )
        # The CampaignSerializer has these fields commented out. If uncommented, these annotations would populate them.
        return queryset

    def perform_create(self, serializer):
        serializer.save(managed_by=self.request.user if self.request.user.is_authenticated else None)

    @action(detail=True, methods=['get'], url_path='donations', serializer_class=DonationSerializer)
    def list_campaign_donations(self, request, pk=None):
        campaign = self.get_object()
        # Donations related to this campaign
        # Make sure Donation model's 'campaign' field has related_name='donations' or access via campaign.donation_set.all()
        # In Donation model: campaign = ForeignKey('fundraising.Campaign', related_name='donations', ...) -> Correct.
        donations = campaign.donations.select_related(
            'donor_contact', 'received_by', 'in_kind_details'
        ).all()

        page = self.paginate_queryset(donations)
        if page is not None:
            serializer = DonationSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)

        serializer = DonationSerializer(donations, many=True, context={'request': request})
        return Response(serializer.data)

    # If using FundraisingEvent model:
    # @action(detail=True, methods=['get', 'post'], url_path='events', serializer_class=FundraisingEventSerializer)
    # def fundraising_events_list_create(self, request, pk=None):
    #     campaign = self.get_object()
    #     if request.method == 'GET':
    #         events = FundraisingEvent.objects.filter(campaign=campaign)
    #         page = self.paginate_queryset(events)
    #         if page is not None:
    #             serializer = FundraisingEventSerializer(page, many=True, context={'request': request})
    #             return self.get_paginated_response(serializer.data)
    #         serializer = FundraisingEventSerializer(events, many=True, context={'request': request})
    #         return Response(serializer.data)

    #     elif request.method == 'POST':
    #         serializer = FundraisingEventSerializer(data=request.data, context={'request': request})
    #         if serializer.is_valid():
    #             serializer.save(campaign=campaign)
    #             return Response(serializer.data, status=status.HTTP_201_CREATED)
    #         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# If using FundraisingEvent model and want a standalone ViewSet for it:
# class FundraisingEventViewSet(viewsets.ModelViewSet):
#     queryset = FundraisingEvent.objects.select_related('campaign').all()
#     serializer_class = FundraisingEventSerializer
#     permission_classes = [permissions.IsAuthenticated]

#     def perform_create(self, serializer):
#         # Expects 'campaign' (PK) in the request data.
#         # Serializer should have 'campaign' as a writable PrimaryKeyRelatedField.
#         serializer.save()

# Note on CampaignSerializer:
# - `managed_by_id`: Writable PK to User.
# - `total_raised`, `donations_count`: Commented out in serializer. If uncommented, the
#   `get_queryset` annotation here would populate them. These are read-only.
# The `list_campaign_donations` action is a good way to get donations for a specific campaign.Tool output for `overwrite_file_with_block`:
