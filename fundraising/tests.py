from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from contacts.models import Contact, ContactType
from donations.models import Donation, DonationType, PaymentMethod
from .models import Campaign, CampaignStatus
import datetime
from decimal import Decimal

class CampaignModelTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='campaign_user', password='password')

    def test_create_campaign(self):
        campaign = Campaign.objects.create(
            name="Spring Fundraiser 2024",
            description="Annual spring fundraising drive.",
            goal_amount=Decimal("25000.00"),
            start_date=datetime.date(2024, 3, 1),
            end_date=datetime.date(2024, 5, 31),
            status=CampaignStatus.ACTIVE,
            managed_by=self.user
        )
        self.assertEqual(str(campaign), "Spring Fundraiser 2024")
        self.assertEqual(campaign.status, CampaignStatus.ACTIVE)
        self.assertEqual(campaign.goal_amount, Decimal("25000.00"))

class CampaignAPITests(APITestCase):
    def setUp(self):
        self.api_user = User.objects.create_user(username='api_testuser_f', password='testpassword123')
        self.token = Token.objects.create(user=self.api_user)
        self.client = APIClient()
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.token.key)

        self.campaign1_data = {
            "name": "Emergency Relief Fund",
            "goal_amount": Decimal("50000.00"),
            "start_date": datetime.date.today(),
            "status": CampaignStatus.ACTIVE,
        }
        self.campaign1 = Campaign.objects.create(**self.campaign1_data, managed_by=self.api_user)

        self.donor_contact = Contact.objects.create(email="donor_for_campaign_test@example.com", first_name="Donor")
        self.donation1 = Donation.objects.create(
            donor_contact=self.donor_contact,
            campaign=self.campaign1,
            donation_date=datetime.date.today(),
            amount=Decimal("100.00"),
            donation_type=DonationType.MONETARY,
            payment_method=PaymentMethod.ONLINE,
            received_by=self.api_user
        )

    def test_create_campaign_api(self):
        url = reverse('campaign-list')
        data = {
            "name": "Youth Program Expansion",
            "description": "Funds for expanding youth educational programs.",
            "goal_amount": "75000.00",
            "start_date": (datetime.date.today() + datetime.timedelta(days=10)).isoformat(),
            "end_date": (datetime.date.today() + datetime.timedelta(days=100)).isoformat(),
            "status": CampaignStatus.PLANNING
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(response.data['name'], "Youth Program Expansion")
        self.assertEqual(response.data['goal_amount'], "75000.00")
        self.assertEqual(response.data['managed_by']['id'], self.api_user.pk)

    def test_get_campaigns_list_api(self):
        url = reverse('campaign-list')
        Campaign.objects.create(
            name="Holiday Toy Drive", goal_amount=Decimal("5000.00"),
            start_date=datetime.date.today(), status=CampaignStatus.COMPLETED, managed_by=self.api_user
        )
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data if not isinstance(response.data, dict) or 'results' not in response.data else response.data['results']
        self.assertEqual(len(results), 2)

    def test_get_single_campaign_api(self):
        url = reverse('campaign-detail', kwargs={'pk': self.campaign1.pk})
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], self.campaign1_data['name'])
        # Note: CampaignViewSet get_queryset has annotations commented out.
        # If activated, CampaignSerializer would need 'total_raised', 'donations_count' fields.
        # For example:
        # self.assertEqual(Decimal(response.data['total_raised']), Decimal("100.00"))
        # self.assertEqual(response.data['donations_count'], 1)


    def test_list_campaign_donations_action_api(self):
        Donation.objects.create(
            donor_contact=self.donor_contact, campaign=self.campaign1, donation_date=datetime.date.today(),
            amount=Decimal("50.00"), donation_type=DonationType.MONETARY, payment_method=PaymentMethod.CASH,
            received_by=self.api_user
        )
        other_campaign = Campaign.objects.create(name="Other Campaign", goal_amount=100, start_date=datetime.date.today(), managed_by=self.api_user)
        Donation.objects.create(donor_contact=self.donor_contact, campaign=other_campaign, donation_date=datetime.date.today(), amount=Decimal("200.00"), donation_type=DonationType.MONETARY, received_by=self.api_user)

        url = reverse('campaign-list-campaign-donations', kwargs={'pk': self.campaign1.pk})
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)

        results = response.data if not isinstance(response.data, dict) or 'results' not in response.data else response.data['results']
        self.assertEqual(len(results), 2)
        amounts = sorted([Decimal(item['amount']) for item in results])
        self.assertEqual(amounts, [Decimal("50.00"), Decimal("100.00")])
