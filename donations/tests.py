from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from contacts.models import Contact, ContactType
from fundraising.models import Campaign
from .models import Donation, DonationType, PaymentMethod, InKindDonationDetail, InKindDonationItemCondition
import datetime
from decimal import Decimal

class DonationModelTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='donation_user', password='password')
        self.donor_contact = Contact.objects.create(
            first_name="Generous", last_name="Donor", email="donor@example.com", contact_type=ContactType.INDIVIDUAL
        )
        self.campaign = Campaign.objects.create(
            name="Winter Appeal", goal_amount=Decimal("10000.00"), start_date=datetime.date.today()
        )

    def test_create_monetary_donation(self):
        donation = Donation.objects.create(
            donor_contact=self.donor_contact,
            campaign=self.campaign,
            donation_date=datetime.date.today(),
            amount=Decimal("100.00"),
            donation_type=DonationType.MONETARY,
            payment_method=PaymentMethod.CARD,
            received_by=self.user
        )
        self.assertEqual(str(donation), f"Donation from {self.donor_contact} on {datetime.date.today().isoformat()} (Monetary)")
        self.assertEqual(donation.amount, Decimal("100.00"))

    def test_create_in_kind_donation_with_detail(self):
        donation = Donation.objects.create(
            donor_contact=self.donor_contact,
            donation_date=datetime.date.today(),
            donation_type=DonationType.IN_KIND,
            received_by=self.user
        )
        in_kind_detail = InKindDonationDetail.objects.create(
            donation=donation,
            item_name="Blankets",
            description="Warm wool blankets",
            estimated_value=Decimal("50.00"),
            quantity=10,
            condition=InKindDonationItemCondition.NEW
        )
        self.assertEqual(str(donation), f"Donation from {self.donor_contact} on {datetime.date.today().isoformat()} (In-Kind)")
        self.assertIsNone(donation.amount)
        self.assertEqual(in_kind_detail.item_name, "Blankets")
        self.assertEqual(in_kind_detail.donation, donation)


class DonationAPITests(APITestCase):
    def setUp(self):
        self.api_user = User.objects.create_user(username='api_testuser_d', password='testpassword123')
        self.token = Token.objects.create(user=self.api_user)
        self.client = APIClient()
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.token.key)

        self.donor_contact = Contact.objects.create(
            first_name="ApiDonor", last_name="Contact", email="apidonor@example.com", contact_type=ContactType.INDIVIDUAL
        )
        self.campaign = Campaign.objects.create(
            name="Food Drive Campaign", goal_amount=Decimal("5000.00"), start_date=datetime.date.today()
        )

        self.monetary_donation1 = Donation.objects.create(
            donor_contact=self.donor_contact, campaign=self.campaign, donation_date=datetime.date.today(),
            amount=Decimal("75.00"), donation_type=DonationType.MONETARY, payment_method=PaymentMethod.ONLINE,
            received_by=self.api_user
        )

    def test_create_monetary_donation_api(self):
        url = reverse('donation-list')
        data = {
            "donor_contact_id": self.donor_contact.pk,
            "campaign_id": self.campaign.pk,
            "donation_date": datetime.date.today().isoformat(),
            "amount": "150.00",
            "donation_type": DonationType.MONETARY,
            "payment_method": PaymentMethod.BANK_TRANSFER,
            "notes": "Monthly contribution"
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(response.data['amount'], "150.00")
        self.assertEqual(response.data['donation_type'], DonationType.MONETARY)
        self.assertEqual(response.data['received_by']['id'], self.api_user.pk)

    def test_create_in_kind_donation_api(self):
        url = reverse('donation-list')
        data = {
            "donor_contact_id": self.donor_contact.pk,
            "donation_date": datetime.date.today().isoformat(),
            "donation_type": DonationType.IN_KIND,
            "notes": "Collection of canned goods",
            "in_kind_details": {
                "item_name": "Canned Beans",
                "description": "24 cans of pinto beans",
                "estimated_value": "25.00",
                "quantity": 24,
                "condition": InKindDonationItemCondition.GOOD
            }
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(response.data['donation_type'], DonationType.IN_KIND)
        self.assertIsNotNone(response.data['in_kind_details'])
        self.assertEqual(response.data['in_kind_details']['item_name'], "Canned Beans")

        donation_id = response.data['id']
        self.assertTrue(InKindDonationDetail.objects.filter(donation_id=donation_id, item_name="Canned Beans").exists())

    def test_create_monetary_donation_missing_amount(self):
        url = reverse('donation-list')
        data = {
            "donor_contact_id": self.donor_contact.pk,
            "donation_date": datetime.date.today().isoformat(),
            "donation_type": DonationType.MONETARY,
            "payment_method": PaymentMethod.CASH
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue("amount" in response.data)

    def test_create_in_kind_donation_missing_details_allowed(self):
        # DonationSerializer validate method allows INK donation without details at creation.
        url = reverse('donation-list')
        data = {
            "donor_contact_id": self.donor_contact.pk,
            "donation_date": datetime.date.today().isoformat(),
            "donation_type": DonationType.IN_KIND
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertIsNone(response.data.get('in_kind_details')) # Or check if 'in_kind_details' key is absent


    def test_get_donations_list(self):
        url = reverse('donation-list')
        contact2 = Contact.objects.create(email="donor2@example.com", first_name="Donor", last_name="Two")
        Donation.objects.create(
            donor_contact=contact2, donation_date=datetime.date.today(), amount=Decimal("20.00"),
            donation_type=DonationType.MONETARY, payment_method=PaymentMethod.CASH, received_by=self.api_user
        )
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data if not isinstance(response.data, dict) or 'results' not in response.data else response.data['results']
        self.assertEqual(len(results), 2)

    def test_get_single_donation(self):
        url = reverse('donation-detail', kwargs={'pk': self.monetary_donation1.pk})
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['amount'], "75.00")
        self.assertEqual(response.data['donor_contact']['id'], self.donor_contact.pk)
