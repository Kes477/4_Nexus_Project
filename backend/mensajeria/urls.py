from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ChatRequestViewSet, ChatRoomViewSet, MessageViewSet

router = DefaultRouter()
router.register('requests', ChatRequestViewSet, basename='chat-request')
router.register('rooms', ChatRoomViewSet, basename='chat-room')
router.register('messages', MessageViewSet, basename='message')

urlpatterns = [
    path('', include(router.urls)),
]