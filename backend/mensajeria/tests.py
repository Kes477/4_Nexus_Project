from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.utils import timezone
from datetime import timedelta
from usuarios.models import Usuario
from .models import ChatRequest, ChatRoom, Message


class MensajeriaAPITests(APITestCase):

    def setUp(self):
        self.user1 = Usuario.objects.create_user(
            email='user1@test.com', 
            password='password123', 
            first_name='User', 
            last_name='One',
            no_identificacion='11111111'
        )
        self.user2 = Usuario.objects.create_user(
            email='user2@test.com', 
            password='password123', 
            first_name='User', 
            last_name='Two',
            no_identificacion='22222222'
        )
        self.user3 = Usuario.objects.create_user(
            email='user3@test.com', 
            password='password123', 
            first_name='User', 
            last_name='Three',
            no_identificacion='33333333'
        )

        # URLs
        self.url_requests = reverse('chat-request-list')
        self.url_rooms = reverse('chat-room-list')
        self.url_messages = reverse('message-list')

        self.client.force_authenticate(user=self.user1)

    def test_crear_solicitud_chat_exitosa(self):
        data = {'receiver_email': self.user2.email}
        response = self.client.post(self.url_requests, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ChatRequest.objects.count(), 1)
        self.assertEqual(ChatRequest.objects.first().sender, self.user1)

    def test_no_puede_enviarse_solicitud_a_si_mismo(self):
        data = {'receiver_email': self.user1.email}
        response = self.client.post(self.url_requests, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_aceptar_solicitud_crea_sala(self):
        # User2 envía solicitud a User1
        req = ChatRequest.objects.create(sender=self.user2, receiver=self.user1)
        
        # User1 acepta
        url_accept = reverse('chat-request-accept', args=[req.id])
        response = self.client.post(url_accept)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(ChatRoom.objects.count(), 1)
        req.refresh_from_db() 
        self.assertEqual(req.status, ChatRequest.Status.ACCEPTED)

    def test_enviar_mensaje_en_sala_propia(self):
        room = ChatRoom.objects.create(user1=self.user1, user2=self.user2)
        data = {'room': room.id, 'content': 'Hola mundo'}
        
        response = self.client.post(self.url_messages, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Message.objects.count(), 1)

    def test_no_puede_enviar_mensaje_en_sala_ajena(self):
        # Sala entre user2 y user3
        room_ajena = ChatRoom.objects.create(user1=self.user2, user2=self.user3)
        data = {'room': room_ajena.id, 'content': 'Intento de hackeo'}
        
        # user1 intenta enviar mensaje
        response = self.client.post(self.url_messages, data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(Message.objects.count(), 0)

    def test_no_puede_leer_mensajes_de_sala_ajena(self):
        # Sala entre user2 y user3
        room_ajena = ChatRoom.objects.create(user1=self.user2, user2=self.user3)
        Message.objects.create(room=room_ajena, sender=self.user2, content='Secreto')
        
        # user1 intenta leer
        response = self.client.get(f"{self.url_messages}?room={room_ajena.id}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    def test_editar_mensaje_dentro_del_tiempo(self):
        room = ChatRoom.objects.create(user1=self.user1, user2=self.user2)
        msg = Message.objects.create(room=room, sender=self.user1, content='Original')
        
        url_edit = reverse('message-detail', args=[msg.id])
        response = self.client.patch(url_edit, {'content': 'Editado'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        msg.refresh_from_db()
        self.assertEqual(msg.content, 'Editado')

    def test_no_puede_editar_mensaje_fuera_del_tiempo(self):
        room = ChatRoom.objects.create(user1=self.user1, user2=self.user2)
        msg = Message.objects.create(room=room, sender=self.user1, content='Original')
        
        # Simulamos que pasaron 6 minutos
        Message.objects.filter(id=msg.id).update(timestamp=timezone.now() - timedelta(minutes=6))
        
        url_edit = reverse('message-detail', args=[msg.id])
        response = self.client.patch(url_edit, {'content': 'Editado tarde'})
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        msg.refresh_from_db()
        self.assertEqual(msg.content, 'Original')