from rest_framework import serializers
from .models import Donation, InKindDonationDetail
from contacts.models import Contact # Import the Contact model
from contacts.serializers import ContactSerializer, UserSimpleSerializer # Assuming UserSimpleSerializer is in contacts.serializers
# from fundraising.serializers import CampaignSerializer # Avoid direct import if it creates circularity
from fundraising.models import Campaign as FundraisingCampaign # Import Campaign model directly
from django.contrib.auth.models import User


class CampaignBasicSerializer(serializers.ModelSerializer): # Simpler version for nesting
    class Meta:
        model = FundraisingCampaign # Use the imported Campaign model
        fields = ['id', 'name']


class InKindDonationDetailSerializer(serializers.ModelSerializer):
    donation = serializers.PrimaryKeyRelatedField(read_only=True) # Marked as read_only
    condition_display = serializers.CharField(source='get_condition_display', read_only=True, required=False)

    class Meta:
        model = InKindDonationDetail
        fields = [
            'donation',
            'item_name', 'description', 'estimated_value', 'quantity', 'condition', 'condition_display'
        ]

class DonationSerializer(serializers.ModelSerializer):
    donor_contact = ContactSerializer(read_only=True)
    donor_contact_id = serializers.PrimaryKeyRelatedField(
        queryset=Contact.objects.all(), source='donor_contact', write_only=True
    )
    campaign = CampaignBasicSerializer(read_only=True, required=False, allow_null=True)
    campaign_id = serializers.PrimaryKeyRelatedField(
        queryset=FundraisingCampaign.objects.all(),
        source='campaign', write_only=True, required=False, allow_null=True
    )
    # Ensure UserSimpleSerializer is correctly defined and imported
    # Assuming it's in contacts.serializers for now. If not, adjust import.
    received_by = UserSimpleSerializer(read_only=True, required=False, allow_null=True)
    received_by_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='received_by', write_only=True, required=False, allow_null=True
    )
    donation_type_display = serializers.CharField(source='get_donation_type_display', read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True, allow_null=True, required=False)

    in_kind_details = InKindDonationDetailSerializer(required=False, allow_null=True)

    class Meta:
        model = Donation
        fields = [
            'id', 'donor_contact', 'donor_contact_id', 'campaign', 'campaign_id',
            'donation_date', 'amount', 'donation_type', 'donation_type_display',
            'payment_method', 'payment_method_display', 'notes', 'received_by', 'received_by_id',
            'is_anonymous', 'created_at', 'updated_at', 'in_kind_details'
        ]

    def validate(self, data):
        donation_type = data.get('donation_type')
        amount = data.get('amount')
        payment_method = data.get('payment_method')
        in_kind_details_data = data.get('in_kind_details')

        if donation_type == 'MON' and amount is None:
            raise serializers.ValidationError({"amount": "Amount is required for monetary donations."})
        if donation_type == 'MON' and not payment_method:
            raise serializers.ValidationError({"payment_method": "Payment method is required for monetary donations."})

        if donation_type == 'INK' and not in_kind_details_data:
            # Allow INK donation to be created without details initially, details can be added later.
            # Or enforce if business rule dictates:
            # raise serializers.ValidationError({"in_kind_details": "In-kind details are required for in-kind donations at creation."})
            pass
        if donation_type == 'INK' and amount is not None:
            raise serializers.ValidationError({"amount": "Amount should be null for in-kind donations; use estimated_value in in_kind_details instead."})

        if donation_type == 'MON' and in_kind_details_data:
            raise serializers.ValidationError({"in_kind_details": "In-kind details are not applicable for monetary donations."})

        return data

    def create(self, validated_data):
        in_kind_details_data = validated_data.pop('in_kind_details', None)
        donation = Donation.objects.create(**validated_data)

        if donation.donation_type == 'INK' and in_kind_details_data:
            InKindDonationDetail.objects.create(donation=donation, **in_kind_details_data)
        return donation

    def update(self, instance, validated_data):
        in_kind_details_data = validated_data.pop('in_kind_details', None)

        original_donation_type = instance.donation_type

        # Update Donation instance fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        # If donation_type is being changed
        new_donation_type = validated_data.get('donation_type', instance.donation_type)

        if new_donation_type == 'INK':
            if in_kind_details_data:
                in_kind_detail, created = InKindDonationDetail.objects.update_or_create(
                    donation=instance, defaults=in_kind_details_data
                )
            # If it was MON and changed to INK, and no details provided, existing amount should be nulled by validator or here.
            if original_donation_type == 'MON':
                 instance.amount = None # Ensure amount is cleared if type changes to INK

        elif new_donation_type == 'MON':
            # If type changed from INK to MON, remove any existing in-kind details
            if hasattr(instance, 'in_kind_details'):
                instance.in_kind_details.delete()
            # Ensure in_kind_details_data is not processed if type is MON
            if in_kind_details_data: # Should have been caught by validate, but as a safeguard
                pass


        instance.save() # Save changes to the Donation instance

        return instance
