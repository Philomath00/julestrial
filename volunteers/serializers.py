from rest_framework import serializers
from .models import Volunteer
from contacts.models import Contact # Import Contact model
from contacts.serializers import ContactSerializer # For potential future use (e.g. full nested display)

class VolunteerSerializer(serializers.ModelSerializer):
    # 'contact' is the OneToOneField primary key to the Contact model.
    # For writing, we expect the PK of an existing Contact.
    contact = serializers.PrimaryKeyRelatedField(
        queryset=Contact.objects.all(),
        # pk_field='id' # This is default
    )

    # Read-only fields for displaying contact details easily
    contact_first_name = serializers.CharField(source='contact.first_name', read_only=True)
    contact_last_name = serializers.CharField(source='contact.last_name', read_only=True)
    contact_email = serializers.EmailField(source='contact.email', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Volunteer
        # 'contact' field here refers to the PrimaryKeyRelatedField defined above.
        # This will be used for the PK of the Volunteer instance itself.
        fields = [
            'contact', # This is the PK, and it's now writable
            'contact_first_name',
            'contact_last_name',
            'contact_email',
            'skills',
            'availability',
            'emergency_contact_name',
            'emergency_contact_phone',
            'status',
            'status_display',
            'joined_date',
        ]
        # joined_date is auto_now_add in model, so it's typically read-only unless overridden.
        read_only_fields = ['joined_date']


    # No custom create/update needed here if VoluntunteerViewSet.create handles Contact creation separately
    # and then passes the created contact's PK to this serializer.
    # If this serializer were to handle nested 'contact_data' itself, then create/update would be needed.
    # The current plan is for the ViewSet to manage the two-step (Contact then Volunteer).

class VolunteerBasicSerializer(serializers.ModelSerializer):
    """
    A more basic serializer for use in related fields, e.g., in ProjectTaskSerializer.
    """
    # Since 'contact' is the PK of Volunteer model, 'pk' or 'id' can be used to refer to it.
    # Or directly source from contact.id if that's clearer.
    # Let's use 'pk' for the volunteer's own ID (which is the contact_id).
    pk = serializers.IntegerField(read_only=True) # Volunteer's own PK
    full_name = serializers.SerializerMethodField()
    contact_email = serializers.EmailField(source='contact.email', read_only=True)

    class Meta:
        model = Volunteer
        fields = ['pk', 'full_name', 'contact_email']

    def get_full_name(self, obj):
        # obj is a Volunteer instance. obj.contact is the related Contact instance.
        return f"{obj.contact.first_name} {obj.contact.last_name}".strip()
