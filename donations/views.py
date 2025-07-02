from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from django.db import transaction
from .models import Donation, InKindDonationDetail
from .serializers import DonationSerializer, InKindDonationDetailSerializer
from contacts.models import Contact
from fundraising.models import Campaign as FundraisingCampaign # Explicit import

class DonationViewSet(viewsets.ModelViewSet):
    queryset = Donation.objects.select_related(
        'donor_contact', 'campaign', 'received_by', 'in_kind_details'
    ).all()
    serializer_class = DonationSerializer
    permission_classes = [permissions.IsAuthenticated] # Adjust

    def perform_create(self, serializer):
        # The serializer's create method handles creating Donation and InKindDonationDetail
        # if 'in_kind_details' data is present in the validated_data.
        # We might want to set received_by user here automatically.
        serializer.save(received_by=self.request.user if self.request.user.is_authenticated else None)

    def perform_update(self, serializer):
        # Serializer's update method handles Donation and InKindDonationDetail.
        # Ensure received_by is not accidentally wiped if not provided in partial update,
        # or set it if it's being changed.
        # For now, default serializer behavior is fine.
        # If 'received_by_id' is in validated_data, it will be updated.
        # If not, it remains unchanged for partial updates.
        serializer.save()

class InKindDonationDetailViewSet(viewsets.ModelViewSet):
    """
    This ViewSet is primarily for managing InKindDonationDetail records directly,
    though typically they are created/updated as part of a Donation record of type 'INK'.
    A Donation of type 'INK' should have one corresponding InKindDonationDetail.
    The InKindDonationDetail model has `donation` as its OneToOneField PK.
    """
    queryset = InKindDonationDetail.objects.select_related('donation__donor_contact').all()
    serializer_class = InKindDonationDetailSerializer
    permission_classes = [permissions.IsAuthenticated] # Adjust

    # Creating an InKindDonationDetail directly here is unusual because it must be linked
    # to an existing Donation of type 'INK'. The Donation itself should be the primary entry point.
    # If a POST is made here, it would imply a Donation of type 'INK' with that PK already exists.

    def create(self, request, *args, **kwargs):
        # Expects 'donation' (PK of an existing 'INK' type Donation) in the request data.
        donation_id = request.data.get('donation')
        if not donation_id:
            return Response({"donation": "Donation ID is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            donation_instance = Donation.objects.get(pk=donation_id)
            if donation_instance.donation_type != 'INK':
                return Response(
                    {"donation": f"Donation {donation_id} is not of type 'In-Kind'."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if hasattr(donation_instance, 'in_kind_details'): # Check if details already exist
                 return Response(
                    {"donation": f"In-kind details for Donation {donation_id} already exist. Use PUT/PATCH to update."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except Donation.DoesNotExist:
            return Response({"donation": f"Donation {donation_id} not found."}, status=status.HTTP_400_BAD_REQUEST)

        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            # The serializer's 'donation' field is the PK for InKindDonationDetail.
            # It should be automatically handled by serializer.save() if 'donation' is in validated_data.
            # serializer.save(donation=donation_instance) # Or ensure donation_instance is what serializer expects for 'donation' field.
            # The InKindDonationDetailSerializer has 'donation' as its first field, which is the PK.
            # So, validated_data['donation'] should be the Donation instance or its PK.
            # Since 'donation' is the PK, it should be directly assigned.
            serializer.save() # This should work if `donation` (PK) is correctly in validated_data.
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # Update (PUT/PATCH) and Destroy (DELETE) for InKindDonationDetail would work as standard
    # using the 'donation' (PK) in the URL.
    # e.g., /inkind-details/{donation_pk}/

# Note on serializers and models:
# DonationSerializer:
#   - `donor_contact_id`: Writable PK to Contact.
#   - `campaign_id`: Writable PK to Campaign (FundraisingCampaign).
#   - `received_by_id`: Writable PK to User.
#   - `in_kind_details`: Nested serializer for InKindDonationDetail.
#     - On create: if donation_type='INK' and in_kind_details data provided, creates InKindDonationDetail.
#     - On update: if donation_type='INK', updates/creates InKindDonationDetail. If type changes from 'INK', deletes existing details.
# This seems robust for handling donations and their conditional in-kind parts.

# InKindDonationDetailSerializer:
#   - `donation`: This field represents the OneToOne PK to Donation. It should be writable for create.
#     In the serializer, it's just listed: `fields = ['donation', ...]`. DRF handles PKs by default.
# The `create` method in `InKindDonationDetailViewSet` adds checks, which are good.Tool output for `overwrite_file_with_block`:
