from rest_framework import serializers
from .models import ChatRequest, ChatRoom, Message
from usuarios.models import Usuario
from django.utils import timezone
from datetime import timedelta

class ChatRequestSerializer(serializers.ModelSerializer):
    sender_email = serializers.EmailField(source='sender.email', read_only=True)
    sender_name = serializers.SerializerMethodField()
    receiver_email = serializers.EmailField(write_only=True)

    class Meta:
        model = ChatRequest
        fields = ['id', 'sender_email', 'sender_name', 'receiver_email', 'status', 'created_at']

    def get_sender_name(self, obj):
        nombre = f"{obj.sender.first_name} {obj.sender.last_name}".strip()
        return nombre if nombre else obj.sender.email

    def validate_receiver_email(self, value):
        if value == self.context['request'].user.email:
            raise serializers.ValidationError("No puedes enviarte una solicitud a ti mismo.")
        try:
            Usuario.objects.get(email=value)
        except Usuario.DoesNotExist:
            raise serializers.ValidationError("El correo ingresado no pertenece a ningún usuario registrado.")
        return value

    def create(self, validated_data):
        receiver = Usuario.objects.get(email=validated_data.pop('receiver_email'))
        sender = self.context['request'].user
        return ChatRequest.objects.create(sender=sender, receiver=receiver, **validated_data)

class ChatRoomSerializer(serializers.ModelSerializer):
    other_user_email = serializers.SerializerMethodField()
    other_user_name = serializers.SerializerMethodField()
    other_user_avatar = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = ChatRoom
        fields = ['id', 'other_user_email', 'other_user_name', 'other_user_avatar', 'unread_count']

    def get_other_user_email(self, obj):
        request = self.context.get('request')
        other = obj.user2 if obj.user1 == request.user else obj.user1
        return other.email

    def get_other_user_name(self, obj):
        request = self.context.get('request')
        other = obj.user2 if obj.user1 == request.user else obj.user1
        nombre = f"{other.first_name} {other.last_name}".strip()
        return nombre if nombre else other.email

    def get_other_user_avatar(self, obj):
        request = self.context.get('request')
        other = obj.user2 if obj.user1 == request.user else obj.user1
        if other.foto_perfil:
            if request:
                return request.build_absolute_uri(other.foto_perfil.url)
            return other.foto_perfil.url
        return None

    def get_unread_count(self, obj):
        request = self.context.get('request')
        if not request:
            return 0
        return obj.messages.filter(is_read=False).exclude(sender=request.user).count()

class MessageSerializer(serializers.ModelSerializer):
    sender_email = serializers.EmailField(source='sender.email', read_only=True)
    sender_name = serializers.SerializerMethodField()
    sender_avatar = serializers.SerializerMethodField()
    is_editable = serializers.SerializerMethodField()
    
    class Meta:
        model = Message
        fields = ['id', 'room', 'sender_email', 'sender_name', 'sender_avatar', 'content', 'timestamp', 'is_read', 'is_editable']
        read_only_fields = ['sender']

    def get_sender_name(self, obj):
        nombre = f"{obj.sender.first_name} {obj.sender.last_name}".strip()
        return nombre if nombre else obj.sender.email

    def get_sender_avatar(self, obj):
        request = self.context.get('request')
        if obj.sender.foto_perfil:
            if request:
                return request.build_absolute_uri(obj.sender.foto_perfil.url)
            return obj.sender.foto_perfil.url
        return None

    def get_is_editable(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        if obj.sender != request.user:
            return False
        return (timezone.now() - obj.timestamp) < timedelta(minutes=5)

    def validate_content(self, value):
        if len(value) > 160:
            raise serializers.ValidationError("El mensaje no puede superar los 160 caracteres.")
        return value