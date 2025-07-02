from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DonationViewSet, InKindDonationDetailViewSet

router = DefaultRouter()
router.register(r'donations', DonationViewSet, basename='donation')
router.register(r'inkind-details', InKindDonationDetailViewSet, basename='inkinddonationdetail')
# The InKindDonationDetailViewSet uses the Donation's PK as its own PK because of the OneToOneField.
# So, URLs like /inkind-details/{donation_pk}/ will work.

urlpatterns = [
    path('', include(router.urls)),
]
