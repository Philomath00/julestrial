from rest_framework import serializers
from .models import Project, ProjectTask, ProjectVolunteerAssignment, VolunteerHoursLog
from volunteers.models import Volunteer # Import the Volunteer model
from volunteers.serializers import VolunteerBasicSerializer # For displaying volunteer info
from contacts.serializers import UserSimpleSerializer # For created_by etc.
from django.contrib.auth.models import User

class ProjectSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    created_by = UserSimpleSerializer(read_only=True)
    created_by_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='created_by', write_only=True, required=False, allow_null=True
    )
    # tasks_count = serializers.IntegerField(read_only=True) # Example: if you add annotation in queryset
    # total_hours_logged = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True) # Example

    class Meta:
        model = Project
        fields = [
            'id', 'name', 'description', 'start_date', 'end_date', 'status', 'status_display',
            'budget', 'location', 'created_by', 'created_by_id', 'created_at', 'updated_at',
            # 'tasks_count', 'total_hours_logged'
        ]

class ProjectTaskSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    assigned_to_volunteer = VolunteerBasicSerializer(read_only=True)
    assigned_to_volunteer_id = serializers.PrimaryKeyRelatedField(
        queryset=Volunteer.objects.all(), source='assigned_to_volunteer', write_only=True, required=False, allow_null=True
    )
    project_name = serializers.CharField(source='project.name', read_only=True)

    class Meta:
        model = ProjectTask
        fields = [
            'id', 'project', 'project_name', 'title', 'description', 'due_date',
            'assigned_to_volunteer', 'assigned_to_volunteer_id',
            'status', 'status_display', 'priority', 'priority_display',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['project'] # Project is typically set by context or URL

class ProjectVolunteerAssignmentSerializer(serializers.ModelSerializer):
    volunteer = VolunteerBasicSerializer(read_only=True)
    volunteer_id = serializers.PrimaryKeyRelatedField(queryset=Volunteer.objects.all(), source='volunteer', write_only=True)
    project_name = serializers.CharField(source='project.name', read_only=True)

    class Meta:
        model = ProjectVolunteerAssignment
        fields = [
            'id', 'project', 'project_name', 'volunteer', 'volunteer_id', 'role', 'date_assigned'
        ]
        read_only_fields = ['project'] # Project is typically set by context or URL

class VolunteerHoursLogSerializer(serializers.ModelSerializer):
    volunteer = VolunteerBasicSerializer(read_only=True)
    volunteer_id = serializers.PrimaryKeyRelatedField(queryset=Volunteer.objects.all(), source='volunteer', write_only=True)
    project_name = serializers.CharField(source='project.name', read_only=True, allow_null=True)
    # approved_by = UserSimpleSerializer(read_only=True)
    # approved_by_id = serializers.PrimaryKeyRelatedField(
    #     queryset=User.objects.all(), source='approved_by', write_only=True, required=False, allow_null=True
    # )

    class Meta:
        model = VolunteerHoursLog
        fields = [
            'id', 'volunteer', 'volunteer_id', 'project', 'project_name', 'date', 'hours_worked',
            'description', # 'approved_by', 'approved_by_id', 'approval_status',
            'created_at', 'updated_at'
        ]
        # `project` can be null, so it's writable.
        # `volunteer` is required.
