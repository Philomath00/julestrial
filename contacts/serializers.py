from rest_framework import serializers
from .models import Contact, ContactNote
from django.contrib.auth.models import User

class UserSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name']

class ContactNoteSerializer(serializers.ModelSerializer):
    created_by = UserSimpleSerializer(read_only=True)
    created_by_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='created_by', write_only=True, required=False, allow_null=True
    )

    class Meta:
        model = ContactNote
        fields = ['id', 'contact', 'note_text', 'created_by', 'created_by_id', 'created_at']
        read_only_fields = ['contact', 'created_at'] # Contact is set by view context typically

class ContactSerializer(serializers.ModelSerializer):
    notes = ContactNoteSerializer(many=True, read_only=True)
    contact_type_display = serializers.CharField(source='get_contact_type_display', read_only=True)

    class Meta:
        model = Contact
        fields = [
            'id', 'first_name', 'last_name', 'email', 'phone', 'address',
            'contact_type', 'contact_type_display', 'created_at', 'updated_at', 'notes'
        ]

    def validate(self, data):
        contact_type = data.get('contact_type')
        first_name = data.get('first_name')
        last_name = data.get('last_name')

        if contact_type == 'ORG' and not first_name:
            raise serializers.ValidationError({"first_name": "First name (organization name) is required for organizations."})
        if contact_type == 'IND' and not first_name:
            raise serializers.ValidationError({"first_name": "First name is required for individuals."})
        # Optionally, ensure last_name is blank for ORG if that's a strict rule
        # if contact_type == 'ORG' and last_name:
        #     raise serializers.ValidationError({"last_name": "Last name should be blank for organizations."})
        return data
