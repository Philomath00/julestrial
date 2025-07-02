from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Volunteer, VolunteerStatus
from contacts.models import Contact
from contacts.serializers import ContactSerializer
from .serializers import VolunteerSerializer

class VolunteerViewSet(viewsets.ModelViewSet):
    queryset = Volunteer.objects.select_related('contact').all()
    serializer_class = VolunteerSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        contact_payload = request.data.get('contact_data')
        if not contact_payload:
            return Response(
                {"contact_data": "Contact data is required to create a volunteer."},
                status=status.HTTP_400_BAD_REQUEST
            )

        contact_serializer = ContactSerializer(data=contact_payload)
        if contact_serializer.is_valid():
            contact = contact_serializer.save() # Step 1: Create Contact

            # Step 2: Prepare data for VolunteerSerializer
            volunteer_data_from_request = {
                'skills': request.data.get('skills', ''),
                'availability': request.data.get('availability', ''),
                'emergency_contact_name': request.data.get('emergency_contact_name', ''),
                'emergency_contact_phone': request.data.get('emergency_contact_phone', ''),
                'status': request.data.get('status', VolunteerStatus.PENDING_APPROVAL),
            }

            # Add the created contact's PK to the data for VolunteerSerializer
            # The 'contact' field in VolunteerSerializer is now a writable PrimaryKeyRelatedField.
            payload_for_volunteer_serializer = {
                "contact": contact.pk,
                **volunteer_data_from_request
            }

            volunteer_serializer = self.get_serializer(data=payload_for_volunteer_serializer)
            if volunteer_serializer.is_valid():
                volunteer_serializer.save() # This will create the Volunteer instance
                return Response(volunteer_serializer.data, status=status.HTTP_201_CREATED)
            else:
                # If volunteer creation fails, roll back contact creation
                contact.delete()
                return Response(volunteer_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response(contact_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object() # This is a Volunteer instance

        contact_payload = request.data.get('contact_data')
        if contact_payload:
            contact_instance = instance.contact # Get the related Contact instance
            # Use partial=True for contact_data if the main request is PATCH
            contact_serializer = ContactSerializer(contact_instance, data=contact_payload, partial=partial)
            if contact_serializer.is_valid(raise_exception=True):
                contact_serializer.save()
            # No else needed due to raise_exception=True on is_valid

        # Prepare data for VolunteerSerializer (fields specific to Volunteer model)
        # Exclude 'contact_data' and also 'contact' (the PK) as PKs are not usually updated.
        volunteer_data_for_serializer = {
            key: value for key, value in request.data.items()
            if key != 'contact_data' and key != 'contact'
        }

        # If volunteer_data_for_serializer is empty (e.g., only contact_data was sent),
        # we might not need to call volunteer_serializer.save() unless status/other fields have defaults.
        # However, DRF handles empty data for PATCH correctly.

        serializer = self.get_serializer(instance, data=volunteer_data_for_serializer, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer) # This calls serializer.save()

        if getattr(instance, '_prefetched_objects_cache', None):
            # If any relationships were prefetched, clear them
            # to ensure fresh data is fetched upon next access.
            instance._prefetched_objects_cache = {}

        # The serializer for the response will re-fetch data, including updated contact info
        response_serializer = self.get_serializer(instance)
        return Response(response_serializer.data)
