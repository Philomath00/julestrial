from django.urls import path, include
from rest_framework.routers import DefaultRouter
# For nested routers, if desired, use drf-nested-routers library or manual URL patterns.
# from rest_framework_nested import routers as nested_routers

from .views import (
    ProjectViewSet, ProjectTaskViewSet,
    ProjectVolunteerAssignmentViewSet, VolunteerHoursLogViewSet
)

router = DefaultRouter()
router.register(r'projects', ProjectViewSet, basename='project')
router.register(r'tasks', ProjectTaskViewSet, basename='projecttask') # Standalone tasks endpoint
router.register(r'volunteer-assignments', ProjectVolunteerAssignmentViewSet, basename='projectvolunteerassignment') # Standalone assignments
router.register(r'volunteer-hours', VolunteerHoursLogViewSet, basename='volunteerhourslog') # Standalone hours logs

# The custom actions in ProjectViewSet (e.g., /projects/{pk}/tasks/) are automatically
# routed by DefaultRouter. So, no explicit URL patterns are needed here for those.

# Example for nested routing if you wanted /projects/{project_pk}/tasks/{task_pk}/
# This is more complex and usually requires a library like drf-nested-routers or careful manual setup.
# For now, we are using custom actions on the ProjectViewSet for project-specific sub-resources,
# and standalone ViewSets for global management of those sub-resources.

# project_router = nested_routers.NestedDefaultRouter(router, r'projects', lookup='project')
# project_router.register(r'tasks', ProjectTaskViewSet, basename='project-tasks')
# # This would create URLs like /projects/{project_pk}/tasks/ and /projects/{project_pk}/tasks/{pk}/
# # This requires ProjectTaskViewSet to be written to handle the nested context (e.g., getting project_pk from URL).

urlpatterns = [
    path('', include(router.urls)),
    # If using nested_router:
    # path('', include(project_router.urls)),
]
