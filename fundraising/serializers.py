from rest_framework import serializers
from .models import Campaign #, FundraisingEvent (if using)
from contacts.serializers import UserSimpleSerializer # For managed_by
from django.contrib.auth.models import User
# To avoid circular import with DonationSerializer, DonationSerializer should use a basic Campaign serializer
# or only Campaign ID for writing. This CampaignSerializer can provide more detail.

class CampaignSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    managed_by = UserSimpleSerializer(read_only=True)
    managed_by_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='managed_by', write_only=True, required=False, allow_null=True
    )
    # To show total raised, you'd typically add this via an annotated queryset in the view
    # and declare it as read-only here.
    # total_raised = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    # donations_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Campaign
        fields = [
            'id', 'name', 'description', 'goal_amount', 'start_date', 'end_date',
            'status', 'status_display', 'managed_by', 'managed_by_id',
            'created_at', 'updated_at',
            # 'total_raised', 'donations_count' # Add if providing these annotations
        ]

# If using FundraisingEvent model:
# class FundraisingEventSerializer(serializers.ModelSerializer):
#     campaign_name = serializers.CharField(source='campaign.name', read_only=True)
#
#     class Meta:
#         model = FundraisingEvent
#         fields = [
#             'id', 'campaign', 'campaign_name', 'name', 'event_date', 'location',
#             'description', 'target_attendees', 'actual_attendees', 'revenue_generated',
#             'created_at', 'updated_at'
#         ]
#         read_only_fields = ['campaign'] # Campaign set by context/URL usually


# This is the CampaignBasicSerializer that DonationSerializer might use to avoid circular deps
# It's defined here for clarity but could be in donations.serializers if preferred,
# or DonationSerializer could just use PrimaryKeyRelatedField for campaign_id.
class CampaignBasicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Campaign
        fields = ['id', 'name']
