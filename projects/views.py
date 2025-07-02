from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Sum, Avg
from .models import Project, ProjectTask, ProjectVolunteerAssignment, VolunteerHoursLog
from .serializers import (
    ProjectSerializer, ProjectTaskSerializer,
    ProjectVolunteerAssignmentSerializer, VolunteerHoursLogSerializer
)
from volunteers.models import Volunteer # For type hinting or specific queries if needed

class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all() # Base queryset
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated] # Adjust as needed

    def get_queryset(self):
        # Example of annotating queryset
        queryset = super().get_queryset().annotate(
            tasks_count=Count('tasks', distinct=True),
            # total_hours_logged=Sum('volunteer_hours__hours_worked') # Be careful with Sum on potentially null relations
        )
        # For total_hours_logged, ensure 'volunteer_hours' is the related_name from VolunteerHoursLog to Project
        # In VolunteerHoursLog model: project = models.ForeignKey(Project, related_name='volunteer_hours', ...) - Correct.
        # So, this annotation should work.
        # queryset = queryset.annotate(total_hours_logged=Sum('volunteer_hours__hours_worked'))
        return queryset

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    # Nested ViewSet actions for tasks related to a project
    @action(detail=True, methods=['get', 'post'], url_path='tasks', serializer_class=ProjectTaskSerializer)
    def tasks_list_create(self, request, pk=None):
        project = self.get_object()
        if request.method == 'GET':
            tasks = ProjectTask.objects.filter(project=project)
            page = self.paginate_queryset(tasks)
            if page is not None:
                serializer = ProjectTaskSerializer(page, many=True, context={'request': request})
                return self.get_paginated_response(serializer.data)
            serializer = ProjectTaskSerializer(tasks, many=True, context={'request': request})
            return Response(serializer.data)

        elif request.method == 'POST':
            serializer = ProjectTaskSerializer(data=request.data, context={'request': request})
            if serializer.is_valid():
                serializer.save(project=project) # Assign project automatically
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # Similar nested actions for ProjectVolunteerAssignment and VolunteerHoursLog
    @action(detail=True, methods=['get', 'post'], url_path='volunteer-assignments', serializer_class=ProjectVolunteerAssignmentSerializer)
    def volunteer_assignments_list_create(self, request, pk=None):
        project = self.get_object()
        if request.method == 'GET':
            assignments = ProjectVolunteerAssignment.objects.filter(project=project).select_related('volunteer__contact')
            page = self.paginate_queryset(assignments)
            if page is not None:
                serializer = ProjectVolunteerAssignmentSerializer(page, many=True, context={'request': request})
                return self.get_paginated_response(serializer.data)
            serializer = ProjectVolunteerAssignmentSerializer(assignments, many=True, context={'request': request})
            return Response(serializer.data)

        elif request.method == 'POST':
            serializer = ProjectVolunteerAssignmentSerializer(data=request.data, context={'request': request})
            if serializer.is_valid():
                # Check for duplicate assignment if your model has unique_together constraint
                # The serializer or model's save method should ideally handle this.
                # ProjectVolunteerAssignment.Meta has unique_together = ('project', 'volunteer')
                if ProjectVolunteerAssignment.objects.filter(project=project, volunteer=serializer.validated_data['volunteer']).exists():
                    return Response({"detail": "This volunteer is already assigned to this project."}, status=status.HTTP_400_BAD_REQUEST)
                serializer.save(project=project)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get', 'post'], url_path='hours-log', serializer_class=VolunteerHoursLogSerializer)
    def hours_log_list_create(self, request, pk=None):
        project = self.get_object()
        if request.method == 'GET':
            logs = VolunteerHoursLog.objects.filter(project=project).select_related('volunteer__contact') #, 'approved_by')
            page = self.paginate_queryset(logs)
            if page is not None:
                serializer = VolunteerHoursLogSerializer(page, many=True, context={'request': request})
                return self.get_paginated_response(serializer.data)
            serializer = VolunteerHoursLogSerializer(logs, many=True, context={'request': request})
            return Response(serializer.data)

        elif request.method == 'POST':
            serializer = VolunteerHoursLogSerializer(data=request.data, context={'request': request})
            if serializer.is_valid():
                # `project` is already part of validated_data if sent in payload,
                # but we ensure it's for *this* project from the URL.
                serializer.save(project=project) #, approved_by=request.user if auto-approve or based on role)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProjectTaskViewSet(viewsets.ModelViewSet):
    queryset = ProjectTask.objects.select_related('project', 'assigned_to_volunteer__contact').all()
    serializer_class = ProjectTaskSerializer
    permission_classes = [permissions.IsAuthenticated] # Adjust

    def perform_create(self, serializer):
        # Project should be specified in the request data if this is a standalone endpoint.
        # If nested under /projects/{project_pk}/tasks/, project is set from URL.
        # This ViewSet is for general /tasks/ endpoint.
        # The ProjectTaskSerializer requires 'project' (PK) to be writable.
        project_id = serializer.validated_data.get('project').id if serializer.validated_data.get('project') else None
        if not project_id and 'project' in self.request.data: # if project pk is sent directly
             project_id = self.request.data.get('project')

        if not project_id:
            raise serializers.ValidationError({"project": "Project must be specified."})
        try:
            project = Project.objects.get(pk=project_id)
            serializer.save(project=project)
        except Project.DoesNotExist:
            raise serializers.ValidationError({"project": "Invalid Project ID."})
        # Note: serializer.save() will pass all validated_data. If 'project' is already a Project instance
        # from validated_data (e.g. from PrimaryKeyRelatedField), then explicit project=project is redundant.

    # If you want to allow updating project or assigned_to_volunteer, ensure serializer handles it.

class ProjectVolunteerAssignmentViewSet(viewsets.ModelViewSet):
    queryset = ProjectVolunteerAssignment.objects.select_related('project', 'volunteer__contact').all()
    serializer_class = ProjectVolunteerAssignmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        # Similar to ProjectTaskViewSet, ensure 'project' and 'volunteer' are correctly handled.
        # Serializer fields 'project' and 'volunteer_id' should be writable.
        # The unique_together constraint on model will prevent duplicates.
        # serializer.save() should work if project and volunteer_id are in validated_data.
        # No need for explicit assignment here if serializer is set up correctly.
        serializer.save()


class VolunteerHoursLogViewSet(viewsets.ModelViewSet):
    queryset = VolunteerHoursLog.objects.select_related('volunteer__contact', 'project').all() #, 'approved_by').all()
    serializer_class = VolunteerHoursLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        # 'volunteer' is required. 'project' can be null.
        # 'approved_by' could be set here based on permissions or workflow.
        # serializer.save(approved_by=request.user if ...)
        serializer.save()

# Note: The nested actions in ProjectViewSet provide a RESTful way to manage child resources
# (Tasks, Assignments, Hours) in the context of a specific Project.
# The standalone ViewSets (ProjectTaskViewSet, etc.) are useful for managing these resources
# globally, e.g., listing all tasks across all projects, or if the parent project is not
# initially known or needs to be changed.
# For create operations via standalone ViewSets, the parent ID (e.g., project_id) must be part of the payload.
# The serializers are set up with `project_id` or `volunteer_id` as writable PrimaryKeyRelatedFields.
# (e.g. ProjectTaskSerializer has `project` as a writable field, which is a PK to Project model).
# (e.g. VolunteerHoursLogSerializer has `volunteer_id` and `project` as writable PKs).
# This seems fine.Tool output for `overwrite_file_with_block`:
