from django.test import SimpleTestCase, TestCase
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase
from unittest.mock import patch
from django.db.models.query import QuerySet

from usuarios.models import Piloto
from .models import Mision

Usuario = get_user_model()


# PRUEBAS DEL MODELO (VALIDACIÓN DE FECHAS)
class MisionModeloTests(SimpleTestCase):

    def test_mision_abierta_sin_fecha_cierre(self):
        mision = Mision(estado=Mision.Estado.PENDIENTE, fecha_cierre=None)
        mision.clean()

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


# PRUEBAS DE TRANSICIONES DE ESTADO
class TransicionesEstadoTests(SimpleTestCase):

    def test_transiciones_permitidas(self):
        casos = [
            ('PENDIENTE', 'ACEPTADA'),
            ('PENDIENTE', 'RECHAZADA'),
            ('PENDIENTE', 'CANCELADA'),
            ('ACEPTADA', 'EN_CURSO'),
            ('ACEPTADA', 'CANCELADA'),
            ('EN_CURSO', 'COMPLETADA'),
            ('EN_CURSO', 'CANCELADA'),
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
            ('RECHAZADA', 'PENDIENTE'),
        ]

        for estado_actual, nuevo_estado in casos:
            with self.subTest(actual=estado_actual, nuevo=nuevo_estado):
                mision = Mision(estado=estado_actual)
                self.assertFalse(mision.puede_cambiar_a(nuevo_estado))


# PRUEBAS DE LA API (VIEWS)
class MisionAPITests(APITestCase):

    def setUp(self):
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

        self.admin = Usuario.objects.create_superuser(
            email='admin@example.com', password='pass', no_identificacion='333'
        )

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

    def _crear_mision_libre(self):
        return Mision.objects.create(
            piloto=None,
            tipo_mision=Mision.TipoMision.TERCEROS,
            categoria="fotografia",
            ubicacion="Misión Libre",
            fecha_programada=timezone.now().date(),
            dron_asignado="Mavic 3",
            estado=Mision.Estado.PENDIENTE,
        )

    def test_usuario_no_autenticado_no_puede_ver_misiones(self):
        respuesta = self.client.get(self.url_lista)
        self.assertEqual(respuesta.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_piloto_solo_ve_sus_misiones(self):
        self.client.force_authenticate(user=self.piloto1.usuario)
        respuesta = self.client.get(self.url_lista)

        self.assertEqual(respuesta.status_code, status.HTTP_200_OK)
        self.assertEqual(len(respuesta.data), 1)
        self.assertEqual(respuesta.data[0]['id'], self.mision1.id)

    def test_piloto_ve_misiones_libres_terceros_pendientes(self):
        mision_libre = self._crear_mision_libre()
        self.client.force_authenticate(user=self.piloto1.usuario)

        respuesta = self.client.get(self.url_lista)
        ids = {m['id'] for m in respuesta.data}

        self.assertIn(mision_libre.id, ids)
        self.assertIn(self.mision1.id, ids)

    def test_filtro_por_tipo_mision(self):
        self.client.force_authenticate(user=self.admin)
        respuesta = self.client.get(f"{self.url_lista}?tipo_mision=PERSONAL")

        self.assertEqual(len(respuesta.data), 1)
        self.assertEqual(respuesta.data[0]['id'], self.mision1.id)

    def test_piloto_no_autorizado_cambiar_estado(self):
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

        respuesta = self.client.patch(
            self.url_cambiar_estado1,
            {'estado': 'ACEPTADA'},
            format='json'
        )
        self.assertEqual(respuesta.status_code, status.HTTP_200_OK)
        self.mision1.refresh_from_db()
        self.assertEqual(self.mision1.estado, Mision.Estado.ACEPTADA)

        respuesta = self.client.patch(
            self.url_cambiar_estado1,
            {'estado': 'EN_CURSO'},
            format='json'
        )
        self.assertEqual(respuesta.status_code, status.HTTP_200_OK)

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

        respuesta = self.client.patch(
            self.url_cambiar_estado1,
            {'estado': 'COMPLETADA'},
            format='json'
        )

        self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('detail', respuesta.data)

    def test_administrador_puede_cambiar_estado(self):
        self.client.force_authenticate(user=self.admin)

        respuesta = self.client.patch(
            self.url_cambiar_estado1,
            {'estado': 'CANCELADA'},
            format='json'
        )

        self.assertEqual(respuesta.status_code, status.HTTP_200_OK)
        self.mision1.refresh_from_db()
        self.assertEqual(self.mision1.estado, Mision.Estado.CANCELADA)
        self.assertIsNotNone(self.mision1.fecha_cierre)

    def test_piloto_acepta_mision_libre_se_asigna_automaticamente(self):
        mision_libre = self._crear_mision_libre()
        self.client.force_authenticate(user=self.piloto1.usuario)
        url = reverse('mision-piloto-cambiar-estado', kwargs={'pk': mision_libre.pk})

        respuesta = self.client.patch(url, {'estado': 'ACEPTADA'}, format='json')

        self.assertEqual(respuesta.status_code, status.HTTP_200_OK)
        mision_libre.refresh_from_db()
        self.assertEqual(mision_libre.piloto_id, self.piloto1.pk)
        self.assertEqual(mision_libre.estado, Mision.Estado.ACEPTADA)

    def test_conflicto_cuando_mision_libre_ya_fue_asignada(self):
        mision_libre = self._crear_mision_libre()
        self.client.force_authenticate(user=self.piloto1.usuario)
        url = reverse('mision-piloto-cambiar-estado', kwargs={'pk': mision_libre.pk})

        original_update = QuerySet.update

        def update_sin_match(qs, **kwargs):
            if qs.model is Mision and 'piloto' in kwargs:
                return 0
            return original_update(qs, **kwargs)

        with patch.object(QuerySet, 'update', update_sin_match):
            respuesta = self.client.patch(url, {'estado': 'ACEPTADA'}, format='json')

        self.assertEqual(respuesta.status_code, status.HTTP_409_CONFLICT)
        mision_libre.refresh_from_db()
        self.assertIsNone(mision_libre.piloto_id)
        self.assertEqual(mision_libre.estado, Mision.Estado.PENDIENTE)

    def test_piloto_crea_mision_personal_se_autoasigna(self):
        self.client.force_authenticate(user=self.piloto1.usuario)
        payload = {
            'tipo_mision': 'PERSONAL',
            'categoria': 'fotografia',
            'ubicacion': 'Nueva ubicación',
            'fecha_programada': str(timezone.now().date()),
            'dron_asignado': 'Mavic 3',
        }

        respuesta = self.client.post(self.url_lista, payload, format='json')

        self.assertEqual(respuesta.status_code, status.HTTP_201_CREATED)
        mision_creada = Mision.objects.get(pk=respuesta.data['id'])
        self.assertEqual(mision_creada.piloto_id, self.piloto1.pk)
        self.assertEqual(mision_creada.tipo_mision, Mision.TipoMision.PERSONAL)
        self.assertEqual(mision_creada.estado, Mision.Estado.PENDIENTE)

    def test_usuario_sin_perfil_no_crea_mision_personal(self):
        self.client.force_authenticate(user=self.admin)
        payload = {
            'tipo_mision': 'PERSONAL',
            'categoria': 'fotografia',
            'ubicacion': 'Ubicación admin',
            'fecha_programada': str(timezone.now().date()),
            'dron_asignado': 'Mavic 3',
        }

        respuesta = self.client.post(self.url_lista, payload, format='json')

        self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)


# PRUEBAS DE REGRESIÓN PARA EL SEED
class MisionSeedTests(TestCase):

    def test_seed_crea_completadas_con_fecha_cierre(self):
        usuario = Usuario.objects.create_user(
            email='seed@example.com', password='pass',
            no_identificacion='SEED', first_name='Seed', last_name='Pilot'
        )
        Piloto.objects.create(usuario=usuario, numero_licencia_aeronautica='LIC-SEED')

        from pilotos.seed import poblar_misiones
        poblar_misiones()

        self.assertEqual(Mision.objects.count(), 8)

        completadas = Mision.objects.filter(estado=Mision.Estado.COMPLETADA)
        self.assertEqual(completadas.count(), 5)
        for mision in completadas:
            self.assertIsNotNone(mision.fecha_cierre)