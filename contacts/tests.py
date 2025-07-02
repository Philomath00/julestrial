from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from django.contrib.auth.models import User
from .models import Contact, ContactNote, ContactType
from rest_framework.authtoken.models import Token

class ContactModelTests(APITestCase):
    def test_create_individual_contact(self):
        contact = Contact.objects.create(
            first_name="John",
            last_name="Doe",
            email="john.doe@example.com",
            contact_type=ContactType.INDIVIDUAL
        )
        self.assertEqual(str(contact), "John Doe")
        self.assertEqual(contact.contact_type, ContactType.INDIVIDUAL)

    def test_create_organization_contact(self):
        contact = Contact.objects.create(
            first_name="Example Corp",
            email="contact@examplecorp.com",
            contact_type=ContactType.ORGANIZATION
        )
        self.assertEqual(str(contact), "Example Corp")
        self.assertEqual(contact.contact_type, ContactType.ORGANIZATION)


class ContactAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpassword123')
        self.token = Token.objects.create(user=self.user)
        self.client = APIClient()
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.token.key)

        self.contact1_data = {
            'first_name': 'Alice',
            'last_name': 'Smith',
            'email': 'alice.smith@example.com',
            'contact_type': ContactType.INDIVIDUAL
        }
        self.contact1 = Contact.objects.create(**self.contact1_data)

    def test_create_contact_individual(self):
        url = reverse('contact-list')
        data = {
            'first_name': 'Bob',
            'last_name': 'Brown',
            'email': 'bob.brown@example.com',
            'contact_type': ContactType.INDIVIDUAL,
            'phone': '1234567890'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Contact.objects.count(), 2)
        self.assertEqual(response.data['email'], 'bob.brown@example.com')

    def test_create_contact_organization(self):
        url = reverse('contact-list')
        data = {
            'first_name': 'GreenTech Solutions',
            'email': 'info@greentech.com',
            'contact_type': ContactType.ORGANIZATION
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['first_name'], 'GreenTech Solutions')
        self.assertEqual(response.data['contact_type'], ContactType.ORGANIZATION)


    def test_get_contacts_list(self):
        url = reverse('contact-list')
        Contact.objects.create(first_name='Charlie', last_name='Davis', email='charlie@example.com', contact_type=ContactType.INDIVIDUAL)

        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Assuming no pagination for small number of items or checking 'count' if paginated
        results = response.data if not isinstance(response.data, dict) or 'results' not in response.data else response.data['results']
        self.assertEqual(len(results), 2)


    def test_get_single_contact(self):
        url = reverse('contact-detail', kwargs={'pk': self.contact1.pk})
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['first_name'], self.contact1_data['first_name'])
        self.assertEqual(response.data['email'], self.contact1_data['email'])

    def test_update_contact(self):
        url = reverse('contact-detail', kwargs={'pk': self.contact1.pk})
        updated_data = {
            'first_name': 'Alicia',
            'last_name': 'Smithy',
            'email': 'alicia.smithy@example.com',
            'contact_type': ContactType.INDIVIDUAL,
            'phone': '0987654321'
        }
        response = self.client.put(url, updated_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.contact1.refresh_from_db()
        self.assertEqual(self.contact1.first_name, 'Alicia')
        self.assertEqual(self.contact1.email, 'alicia.smithy@example.com')

    def test_delete_contact(self):
        contact_to_delete = Contact.objects.create(first_name='Delete', last_name='Me', email='delete@example.com')
        url = reverse('contact-detail', kwargs={'pk': contact_to_delete.pk})
        response = self.client.delete(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Contact.objects.filter(pk=contact_to_delete.pk).exists())

class ContactNoteAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser_notes', password='password123')
        self.token = Token.objects.create(user=self.user)
        self.client = APIClient()
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.token.key)

        self.contact = Contact.objects.create(first_name="Notable", last_name="Person", email="notable@example.com")
        # Make ContactNoteSerializer's 'contact' field writable for direct POST tests
        # This is a common adjustment for testing direct POST to such ViewSets.
        # For the purpose of this test, we assume the ViewSet's perform_create correctly handles it.
        # from contacts.serializers import ContactNoteSerializer
        # if 'contact' in ContactNoteSerializer.Meta.read_only_fields:
        #    ContactNoteSerializer.Meta.read_only_fields = tuple(f for f in ContactNoteSerializer.Meta.read_only_fields if f != 'contact')


    def test_add_note_to_contact_action(self):
        url = reverse('contact-add-note', kwargs={'pk': self.contact.pk})
        data = {'note_text': 'This is an important note.'}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['note_text'], 'This is an important note.')
        self.assertEqual(response.data['created_by']['id'], self.user.id)
        self.assertTrue(ContactNote.objects.filter(contact=self.contact, note_text='This is an important note.').exists())

    def test_list_notes_for_contact_action(self):
        ContactNote.objects.create(contact=self.contact, note_text="First note", created_by=self.user)
        ContactNote.objects.create(contact=self.contact, note_text="Second note", created_by=self.user)

        url = reverse('contact-notes', kwargs={'pk': self.contact.pk})
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data if not isinstance(response.data, dict) or 'results' not in response.data else response.data['results']
        self.assertEqual(len(results), 2)


    def test_create_contact_note_via_direct_endpoint(self):
        url = reverse('contactnote-list')
        data = {
            'contact': self.contact.pk,
            'note_text': 'A direct note created via notes endpoint.'
        }
        # Temporarily make 'contact' field writable in serializer for this test path if it was read-only
        # This is a common testing pattern: either ensure serializer supports it, or the view handles it.
        # The ContactNoteViewSet.perform_create is designed to extract 'contact' from request.data
        # and pass it to serializer.save(), which should work even if serializer marks 'contact' as read-only
        # for general payload processing, as perform_create explicitly passes it to save().

        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['note_text'], 'A direct note created via notes endpoint.')
        self.assertTrue(ContactNote.objects.filter(contact=self.contact, note_text='A direct note created via notes endpoint.').exists())
        self.assertEqual(response.data['contact'], self.contact.pk) # Check if contact FK is correctly set
        self.assertEqual(response.data['created_by']['id'], self.user.id)
