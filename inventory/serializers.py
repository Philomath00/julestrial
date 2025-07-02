from rest_framework import serializers
from .models import InventoryCategory, InventoryItem, InventoryTransaction, InventoryTransactionType # Added InventoryTransactionType
from contacts.serializers import UserSimpleSerializer # For user who recorded transaction
# from projects.serializers import ProjectBasicSerializer # If linking to projects
from django.contrib.auth.models import User
from django.db import transaction
from decimal import Decimal, InvalidOperation # Import InvalidOperation for robust conversion

class InventoryCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = InventoryCategory
        fields = ['id', 'name', 'description']

class InventoryItemSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True, allow_null=True)
    # transactions_count = serializers.IntegerField(read_only=True) # Example for annotation

    class Meta:
        model = InventoryItem
        fields = [
            'id', 'name', 'description', 'category', 'category_name', 'unit_of_measure',
            'quantity_on_hand', 'reorder_level', 'last_stocktake_date',
            'created_at', 'updated_at', # 'transactions_count'
        ]
        read_only_fields = ['quantity_on_hand'] # Quantity on hand is managed by transactions

class InventoryTransactionSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source='item.name', read_only=True)
    item_unit_of_measure = serializers.CharField(source='item.unit_of_measure', read_only=True)
    transaction_type_display = serializers.CharField(source='get_transaction_type_display', read_only=True)
    user = UserSimpleSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='user', write_only=True, required=False, allow_null=True
    )
    # Explicitly define quantity to ensure no unexpected default validators
    # However, this was tried with validators=[] and didn't solve the "Quantity must be positive"
    # Let's remove it for now and rely on ModelSerializer's default field creation,
    # and ensure our validate method is the one catching things.
    # quantity = serializers.DecimalField(max_digits=10, decimal_places=2)


    class Meta:
        model = InventoryTransaction
        fields = [
            'id', 'item', 'item_name', 'item_unit_of_measure',
            'transaction_type', 'transaction_type_display',
            'quantity', 'transaction_date',
            'user', 'user_id', 'notes'
        ]


    def validate(self, data):
        transaction_type = data.get('transaction_type')
        quantity_input = data.get('quantity') # Raw input, could be string

        if quantity_input is None:
            raise serializers.ValidationError({"quantity": "Quantity is required."})

        try:
            quantity = Decimal(str(quantity_input)) # Ensure it's a Decimal for comparison
        except InvalidOperation:
            raise serializers.ValidationError({"quantity": "Invalid number format for quantity."})

        # Ensure transaction_type is valid (it should be if choices are enforced by serializer field)
        valid_transaction_types = [InventoryTransactionType.ADJUSTMENT, InventoryTransactionType.IN, InventoryTransactionType.OUT]
        if transaction_type not in valid_transaction_types:
            raise serializers.ValidationError({"transaction_type": "Invalid transaction type provided."})

        if transaction_type == InventoryTransactionType.ADJUSTMENT:
            # For ADJ, quantity is the delta (can be positive or negative).
            # Check if a negative adjustment would result in negative stock.
            if quantity < 0:
                item = data.get('item') # item instance from validated_data
                if item and item.quantity_on_hand < abs(quantity):
                    raise serializers.ValidationError({
                        "quantity": f"Adjustment by {quantity} units for item '{item.name}' results in negative stock. Current stock: {item.quantity_on_hand}."
                    })
            # Positive ADJ is fine, stock will increase. No specific check beyond that here.
        else: # For IN or OUT transactions
            if quantity <= 0: # Must be positive
                raise serializers.ValidationError({
                    "quantity": f"Quantity for {transaction_type.label} transaction must be positive."
                })
            if transaction_type == InventoryTransactionType.OUT:
                item = data.get('item')
                if item and item.quantity_on_hand < quantity:
                    raise serializers.ValidationError({
                        "quantity": f"Not enough stock for OUT transaction for item '{item.name}'. Available: {item.quantity_on_hand}, Requested: {quantity}."
                    })

        # After all specific checks, put the (potentially type-casted) quantity back into data
        # This is important if the initial quantity was a string and got converted to Decimal.
        data['quantity'] = quantity
        return data

    def create(self, validated_data):
        item = validated_data['item']
        quantity = validated_data['quantity'] # Should be Decimal from validate method
        transaction_type = validated_data['transaction_type']

        with transaction.atomic():
            inventory_item = InventoryItem.objects.select_for_update().get(pk=item.pk)

            original_qoh = inventory_item.quantity_on_hand

            if transaction_type == InventoryTransactionType.IN:
                inventory_item.quantity_on_hand += quantity
            elif transaction_type == InventoryTransactionType.OUT:
                # Sufficient stock check already done in validate method
                inventory_item.quantity_on_hand -= quantity
            elif transaction_type == InventoryTransactionType.ADJUSTMENT:
                # Delta (positive or negative) already checked for not causing negative total stock in validate method
                inventory_item.quantity_on_hand += quantity

            inventory_item.save()

            # Log for debugging stock updates
            # print(f"Item: {inventory_item.name}, Old QOH: {original_qoh}, Change: {quantity if transaction_type != 'ADJ' else quantity}, New QOH: {inventory_item.quantity_on_hand}, Type: {transaction_type}")

            return InventoryTransaction.objects.create(**validated_data)
