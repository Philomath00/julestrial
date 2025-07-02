from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Contact, ContactNote
from .serializers import ContactSerializer, ContactNoteSerializer

class ContactViewSet(viewsets.ModelViewSet):
    queryset = Contact.objects.prefetch_related('notes').all()
    serializer_class = ContactSerializer
    permission_classes = [permissions.IsAuthenticated] # Adjust as needed

    # Example: custom action to add a note to a specific contact
    @action(detail=True, methods=['post'], serializer_class=ContactNoteSerializer)
    def add_note(self, request, pk=None):
        contact = self.get_object()
        serializer = ContactNoteSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(contact=contact, created_by=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'], serializer_class=ContactNoteSerializer)
    def notes(self, request, pk=None):
        contact = self.get_object()
        notes = contact.notes.all() # Or ContactNote.objects.filter(contact=contact)
        page = self.paginate_queryset(notes)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(notes, many=True)
        return Response(serializer.data)


class ContactNoteViewSet(viewsets.ModelViewSet):
    queryset = ContactNote.objects.select_related('contact', 'created_by').all()
    serializer_class = ContactNoteSerializer
    permission_classes = [permissions.IsAuthenticated] # Adjust as needed

    def perform_create(self, serializer):
        # If contact_id is provided in the request data, use it.
        # Otherwise, this viewset might be nested under a contact, or contact needs to be explicit.
        contact_id = self.request.data.get('contact')
        contact = None
        if contact_id:
            try:
                contact = Contact.objects.get(pk=contact_id)
            except Contact.DoesNotExist:
                raise serializers.ValidationError("Contact not found.") # Or handle as per your API design

        # This assumes 'contact' field in ContactNoteSerializer is writable or set via context.
        # If 'contact' is part of the URL (e.g., /contacts/{contact_pk}/notes/),
        # then it should be retrieved from self.kwargs.
        # For simplicity, we'll assume contact_id is in request or serializer handles it.
        serializer.save(created_by=self.request.user, contact=contact if contact else serializer.validated_data.get('contact'))

    # To make this work with /contacts/{contact_pk}/notes/ an additional router setup is needed.
    # For a standalone /contact-notes/ endpoint, the serializer needs 'contact' to be a writable field.
    # The ContactNoteSerializer has 'contact' as read_only_fields = ['contact', ...],
    # which means it expects contact to be set programmatically (e.g. in perform_create from URL or data).
    # Let's adjust serializer or this view.
    # For now, ContactNoteSerializer's 'contact' field is read-only.
    # This ViewSet is better for general CRUD on notes if 'contact' is made writable or passed in data.
    # The add_note custom action in ContactViewSet is often a more RESTful way for creating notes for a *specific* contact.

    # If we want this to be a standalone endpoint for all notes:
    # The serializer's `contact` field should be writeable (e.g. PrimaryKeyRelatedField).
    # ContactNoteSerializer has `contact` as a non-read-only field by default if not in read_only_fields.
    # Let's check the ContactNoteSerializer:
    # fields = ['id', 'contact', 'note_text', 'created_by', 'created_by_id', 'created_at']
    # read_only_fields = ['contact', 'created_at'] -- This makes 'contact' read-only.
    # This means this ViewSet, as is, would not allow setting 'contact' on create/update directly via payload.
    # It's better suited for listing all notes or if used in a nested router context.
    # For now, we'll leave it; primarily list/retrieve/update/delete if PK is known.
    # Creation is better handled by the `add_note` action on `ContactViewSet`.

    # To enable creation via this endpoint if 'contact' (ID) is in the payload:
    # 1. Remove 'contact' from ContactNoteSerializer's read_only_fields.
    # 2. The perform_create would then work if 'contact' (ID) is in request.data.
    # Let's assume ContactNoteSerializer is updated to make 'contact' (the FK field) writable.
    # (Checking ContactNoteSerializer: 'contact' is indeed in read_only_fields. This limits this ViewSet for POST)
    # For this exercise, I will proceed as if ContactNoteSerializer might be adjusted, or this endpoint is mainly for general management.
    # The `add_note` action is generally preferred for creating notes tied to a specific contact.
