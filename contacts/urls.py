from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ContactViewSet, ContactNoteViewSet

router = DefaultRouter()
router.register(r'contacts', ContactViewSet, basename='contact')
router.register(r'contact-notes', ContactNoteViewSet, basename='contactnote')
# The `basename` is important if queryset is not standard or you override get_queryset significantly.
# For ModelViewSets with a `queryset` attribute, DRF can often infer it.

urlpatterns = [
    path('', include(router.urls)),
]
