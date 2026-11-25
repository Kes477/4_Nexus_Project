from django.test import SimpleTestCase, TestCase
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase
from datetime import timedelta

from usuarios.models import Piloto
from .models import Mision

Usuario = get_user_model()

# PRUEBAS DEL MODELO (VALIDACIÓN DE FECHAS)
class MisionModeloTests(SimpleTestCase):

    def test_mision_abierta_sin_fecha_cierre(self):
        mision = Mision(estado=Mision.Estado.PENDIENTE, fecha_cierre=None)
        mision.clean() # No debe lanzar error

    def test_mision_cerrada_sin_fecha_cierre(self):
        mision = Mision(estado=Mision.Estado.COMPLETADA, fecha_cierre=None)
        with self.assertRaises(ValidationError):
            mision.clean()

    def test_mision_cerrada_con_fecha_cierre(self):
        mision = Mision(
            estado=Mision.Estado.COMPLETADA, 
            fecha_cierre=timezone.now()
        )
        mision.clean()

    def test_mision_abierta_con_fecha_cierre(self):
        mision = Mision(
            estado=Mision.Estado.EN_CURSO, 
            fecha_cierre=timezone.now()
        )
        with self.assertRaises(ValidationError):
            mision.clean()


#  PRUEBAS DE TRANSICIONES DE ESTADO
class TransicionesEstadoTests(SimpleTestCase):

    def test_transiciones_permitidas(self):
        casos = [
            ('PENDIENTE', 'ACEPTADA'),
            ('PENDIENTE', 'RECHAZADA'),
            ('PENDIENTE', 'CANCELADA'),
            ('ACEPTADA', 'EN_CURSO'),
            ('ACEPTADA', 'CANCELADA'),
            ('EN_CURSO', 'COMPLETADA'),
            ('EN_CURSO', 'CANCELADA')
        ]

        for estado_actual, nuevo_estado in casos:
            with self.subTest(actual=estado_actual, nuevo=nuevo_estado):
                mision = Mision(estado=estado_actual)
                self.assertTrue(mision.puede_cambiar_a(nuevo_estado))

    def test_transiciones_prohibidas(self):
        casos = [
            ('PENDIENTE', 'EN_CURSO'),
            ('PENDIENTE', 'COMPLETADA'),
            ('ACEPTADA', 'COMPLETADA'),
            ('EN_CURSO', 'PENDIENTE'),
            ('COMPLETADA', 'EN_CURSO'),
            ('RECHAZADA', 'PENDIENTE')
        ]

        for estado_actual, nuevo_estado in casos:
            with self.subTest(actual=estado_actual, nuevo=nuevo_estado):
                mision = Mision(estado=estado_actual)
                self.assertFalse(mision.puede_cambiar_a(nuevo_estado))


# PRUEBAS DE LA API (VIEWS)
class MisionAPITests(APITestCase):

    def setUp(self):
        # Creamos dos usuarios pilotos
        user_piloto1 = Usuario.objects.create_user(
            email='piloto1@example.com', password='pass', 
            no_identificacion='111', first_name='Carlos', last_name='Sosa'
        )
        self.piloto1 = Piloto.objects.create(
            usuario=user_piloto1, numero_licencia_aeronautica='LIC-111'
        )

        user_piloto2 = Usuario.objects.create_user(
            email='piloto2@example.com', password='pass', 
            no_identificacion='222', first_name='Juan', last_name='Perez'
        )
        self.piloto2 = Piloto.objects.create(
            usuario=user_piloto2, numero_licencia_aeronautica='LIC-222'
        )

        # Creamos un usuario administrador
        self.admin = Usuario.objects.create_superuser(
            email='admin@example.com', password='pass', no_identificacion='333'
        )

        # Creamos misiones
        self.mision1 = Mision.objects.create(
            piloto=self.piloto1,
            tipo_mision=Mision.TipoMision.PERSONAL,
            categoria="fotografia",
            ubicacion="Lago de Yojoa",
            fecha_programada=timezone.now().date(),
            dron_asignado="Mavic 3",
            estado=Mision.Estado.PENDIENTE
        )

        self.mision2 = Mision.objects.create(
            piloto=self.piloto2,
            tipo_mision=Mision.TipoMision.TERCEROS,
            categoria="fumigacion",
            ubicacion="San Manuel",
            fecha_programada=timezone.now().date(),
            dron_asignado="Agras T40",
            estado=Mision.Estado.PENDIENTE
        )

        self.url_lista = reverse('mision-piloto-list')
        self.url_cambiar_estado1 = reverse('mision-piloto-cambiar-estado', kwargs={'pk': self.mision1.pk})

    def test_usuario_no_autenticado_no_puede_ver_misiones(self):
        respuesta = self.client.get(self.url_lista)
        self.assertEqual(respuesta.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_piloto_solo_ve_sus_misiones(self):
        self.client.force_authenticate(user=self.piloto1.usuario)
        respuesta = self.client.get(self.url_lista)

        self.assertEqual(respuesta.status_code, status.HTTP_200_OK)
        
        # Solo debe haber 1 registro (mision1)
        self.assertEqual(len(respuesta.data), 1)
        self.assertEqual(respuesta.data[0]['id'], self.mision1.id)

    def test_filtro_por_tipo_mision(self):
        self.client.force_authenticate(user=self.admin)
        
        # El admin ve todas, pero pedimos filtrar solo las PERSONALES
        respuesta = self.client.get(f"{self.url_lista}?tipo_mision=PERSONAL")
        
        self.assertEqual(len(respuesta.data), 1)
        self.assertEqual(respuesta.data[0]['id'], self.mision1.id)

    def test_piloto_no_autorizado_cambiar_estado(self):
        # El piloto 2 intenta cambiar el estado de la misión del piloto 1
        self.client.force_authenticate(user=self.piloto2.usuario)
        
        respuesta = self.client.patch(
            self.url_cambiar_estado1,
            {'estado': 'ACEPTADA'},
            format='json'
        )

        self.assertEqual(respuesta.status_code, status.HTTP_404_NOT_FOUND)
        
        self.mision1.refresh_from_db()
        self.assertEqual(self.mision1.estado, Mision.Estado.PENDIENTE)

    def test_piloto_asignado_cambia_estado_correctamente(self):
        self.client.force_authenticate(user=self.piloto1.usuario)
        
        # 1. Aceptar misión
        respuesta = self.client.patch(
            self.url_cambiar_estado1,
            {'estado': 'ACEPTADA'},
            format='json'
        )
        self.assertEqual(respuesta.status_code, status.HTTP_200_OK)
        self.mision1.refresh_from_db()
        self.assertEqual(self.mision1.estado, Mision.Estado.ACEPTADA)

        # 2. Poner en curso
        respuesta = self.client.patch(
            self.url_cambiar_estado1,
            {'estado': 'EN_CURSO'},
            format='json'
        )
        self.assertEqual(respuesta.status_code, status.HTTP_200_OK)

        # 3. Completar (aquí debe generarse la fecha_cierre)
        respuesta = self.client.patch(
            self.url_cambiar_estado1,
            {'estado': 'COMPLETADA'},
            format='json'
        )
        self.assertEqual(respuesta.status_code, status.HTTP_200_OK)
        
        self.mision1.refresh_from_db()
        self.assertEqual(self.mision1.estado, Mision.Estado.COMPLETADA)
        self.assertIsNotNone(self.mision1.fecha_cierre)

    def test_no_se_pueden_saltar_estados(self):
        self.client.force_authenticate(user=self.piloto1.usuario)
        
        # Intentar pasar de PENDIENTE a COMPLETADA directamente
        respuesta = self.client.patch(
            self.url_cambiar_estado1,
            {'estado': 'COMPLETADA'},
            format='json'
        )

        self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('detail', respuesta.data)

    def test_administrador_puede_cambiar_estado(self):
        self.client.force_authenticate(user=self.admin)
        
        # El admin puede cambiar el estado de la misión del piloto 1
        respuesta = self.client.patch(
            self.url_cambiar_estado1,
            {'estado': 'CANCELADA'},
            format='json'
        )
        
        self.assertEqual(respuesta.status_code, status.HTTP_200_OK)
        self.mision1.refresh_from_db()
        self.assertEqual(self.mision1.estado, Mision.Estado.CANCELADA)
        self.assertIsNotNone(self.mision1.fecha_cierre)