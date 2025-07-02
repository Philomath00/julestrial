from django.urls import path
from .views import DashboardSummaryReportAPIView

urlpatterns = [
    path('summary/dashboard/', DashboardSummaryReportAPIView.as_view(), name='report-dashboard-summary'),
]
