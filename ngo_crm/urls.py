"""
URL configuration for ngo_crm project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),
    # API URLs
    # Each app's urls.py uses a router that registers paths like 'contacts/', 'volunteers/', etc.
    # So, including them under "api/" prefix here will result in:
    # /api/contacts/
    # /api/volunteers/
    # etc.
    path("api/", include([
        path("", include("contacts.urls")), # e.g. /api/contacts/, /api/contact-notes/
        path("", include("volunteers.urls")), # e.g. /api/volunteers/
        path("", include("projects.urls")), # e.g. /api/projects/, /api/tasks/, etc.
        path("", include("donations.urls")), # e.g. /api/donations/, /api/inkind-details/
        path("", include("fundraising.urls")), # e.g. /api/campaigns/
        path("", include("inventory.urls")), # e.g. /api/inventory-items/, etc.
        path("users/", include("users.urls")), # Added user auth urls
        path("reports/", include("reports.urls")), # Added reports urls
    ])),
    # Placeholder for DRF's built-in auth views if needed later for browsable API login
    path('api-auth/', include('rest_framework.urls', namespace='rest_framework'))
]
