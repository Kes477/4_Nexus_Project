from rest_framework import viewsets, mixins, permissions, status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from django.db.models import Q
from django.utils import timezone
from datetime import timedelta
from .models import ChatRequest, ChatRoom, Message
from .serializers import ChatRequestSerializer, MessageSerializer, ChatRoomSerializer
from usuarios.models import Usuario


class ChatRequestViewSet(mixins.CreateModelMixin, mixins.ListModelMixin, viewsets.GenericViewSet):
    serializer_class = ChatRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ChatRequest.objects.filter(
            Q(sender=self.request.user) | Q(receiver=self.request.user)
        ).order_by('-created_at')

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        receiver_email = serializer.validated_data.get('receiver_email')
        receiver = Usuario.objects.get(email=receiver_email)
        sender = request.user

        existing_room = ChatRoom.objects.filter(
            (Q(user1=sender) & Q(user2=receiver)) |
            (Q(user1=receiver) & Q(user2=sender))
        ).first()

        if existing_room:
            return Response({
                "detail": "Ya tienes un chat activo con este usuario.",
                "room_id": existing_room.id,
                "status": "exists"
            }, status=status.HTTP_200_OK)

        pending = ChatRequest.objects.filter(sender=sender, receiver=receiver, status='PENDING').first()
        if pending:
            return Response({
                "detail": "Ya enviaste una solicitud pendiente a este usuario.",
                "status": "pending"
            }, status=status.HTTP_200_OK)

        return super().create(request, *args, **kwargs)

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        chat_request = self.get_object()
        if chat_request.receiver != request.user:
            return Response({'detail': 'No autorizado'}, status=status.HTTP_403_FORBIDDEN)

        chat_request.status = ChatRequest.Status.ACCEPTED
        chat_request.save()

        room = ChatRoom.objects.filter(
            (Q(user1=chat_request.sender) & Q(user2=chat_request.receiver)) |
            (Q(user1=chat_request.receiver) & Q(user2=chat_request.sender))
        ).first()
        if not room:
            room = ChatRoom.objects.create(user1=chat_request.sender, user2=chat_request.receiver)

        return Response({'status': 'accepted', 'room_id': room.id})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        chat_request = self.get_object()
        if chat_request.receiver != request.user:
            return Response({'detail': 'No autorizado'}, status=status.HTTP_403_FORBIDDEN)

        chat_request.status = ChatRequest.Status.REJECTED
        chat_request.save()
        return Response({'status': 'rejected'})


class ChatRoomViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    serializer_class = ChatRoomSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ChatRoom.objects.filter(Q(user1=self.request.user) | Q(user2=self.request.user)).order_by('-created_at')


class MessageViewSet(mixins.CreateModelMixin, mixins.ListModelMixin, mixins.UpdateModelMixin, viewsets.GenericViewSet):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        base_qs = Message.objects.filter(Q(room__user1=user) | Q(room__user2=user))
        if self.action == 'list':
            room_id = self.request.query_params.get('room')
            if not room_id or not str(room_id).isdigit():
                return Message.objects.none()
            qs = base_qs.filter(room_id=room_id)
            qs.filter(is_read=False).exclude(sender=user).update(is_read=True)
            return qs.order_by('timestamp')
        elif self.action in ['update', 'partial_update']:
            return base_qs
        return Message.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        room = serializer.validated_data.get('room')
        if not room or (room.user1_id != user.id and room.user2_id != user.id):
            raise PermissionDenied("No perteneces a esta sala.")
        serializer.save(sender=user)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.sender != request.user:
            return Response({"detail": "No autorizado"}, status=status.HTTP_403_FORBIDDEN)
        if (timezone.now() - instance.timestamp) > timedelta(minutes=5):
            return Response({"detail": "El tiempo para editar ha expirado."}, status=status.HTTP_400_BAD_REQUEST)
        return super().update(request, *args, **kwargs)