from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CampaignViewSet #, FundraisingEventViewSet (if using)

router = DefaultRouter()
router.register(r'campaigns', CampaignViewSet, basename='campaign')
# if FundraisingEventViewSet:
#     router.register(r'fundraising-events', FundraisingEventViewSet, basename='fundraisingevent')

# Custom actions on CampaignViewSet (like /campaigns/{pk}/donations/) are auto-routed.

urlpatterns = [
    path('', include(router.urls)),
]
