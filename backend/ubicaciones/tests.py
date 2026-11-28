from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Direccion, TipoUbicacion, Ubicacion

Usuario = get_user_model()


class UbicacionAPITests(APITestCase):

    def setUp(self):
        self.url = reverse('ubicacion-list')
        self.honduras = Ubicacion.objects.get(nombre='Honduras')

    def test_migracion_cargo_honduras(self):
        self.assertEqual(self.honduras.hijos.count(), 18)
        self.assertTrue(Ubicacion.objects.filter(nombre='Distrito Central').exists())

    def test_lista_publica_de_paises(self):
        respuesta = self.client.get(self.url, {'padre__isnull': 'true'})

        self.assertEqual(respuesta.status_code, status.HTTP_200_OK)
        self.assertEqual(len(respuesta.data), 1)
        self.assertEqual(respuesta.data[0]['nombre'], 'Honduras')

    def test_departamentos_de_honduras(self):
        respuesta = self.client.get(self.url, {'padre': self.honduras.id})

        self.assertEqual(len(respuesta.data), 18)
        self.assertTrue(all(d['tiene_hijos'] for d in respuesta.data))
        self.assertTrue(all(d['tipo'] == 'Departamento' for d in respuesta.data))

    def test_municipios_no_tienen_hijos(self):
        morazan = Ubicacion.objects.get(nombre='Francisco Morazán')
        respuesta = self.client.get(self.url, {'padre': morazan.id})

        self.assertEqual(respuesta.data[0]['nombre'], 'Distrito Central')
        self.assertFalse(respuesta.data[0]['tiene_hijos'])

    def test_solo_lectura(self):
        respuesta = self.client.post(self.url, {'nombre': 'Marte'}, format='json')
        self.assertEqual(respuesta.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_no_se_puede_duplicar_la_raiz(self):
        pais = TipoUbicacion.objects.get(nombre='País')
        with self.assertRaises(IntegrityError), transaction.atomic():
            Ubicacion.objects.create(tipo=pais, nombre='Honduras', padre=None)

    def test_no_se_puede_duplicar_hijo_bajo_el_mismo_padre(self):
        morazan = Ubicacion.objects.get(nombre='Francisco Morazán')
        municipio = TipoUbicacion.objects.get(nombre='Municipio')
        with self.assertRaises(IntegrityError), transaction.atomic():
            Ubicacion.objects.create(
                tipo=municipio, nombre='Distrito Central', padre=morazan
            )


class DireccionAPITests(APITestCase):

    def setUp(self):
        self.url = reverse('direccion-list')
        self.ana = self.crear_usuario('ana@nexus.com', '0801199900701')
        self.luis = self.crear_usuario('luis@nexus.com', '0801199900702')
        self.distrito = Ubicacion.objects.get(nombre='Distrito Central')
        self.sps = Ubicacion.objects.get(nombre='San Pedro Sula')
        self.client.force_authenticate(user=self.ana)

    def crear_usuario(self, email, identificacion):
        return Usuario.objects.create_user(
            email=email, password='Drones-2026!', no_identificacion=identificacion,
            first_name='Prueba', last_name='Dirección',
        )

    def crear(self, **cambios):
        datos = {
            'ubicacion': self.distrito.id,
            'linea_direccion1': 'Col. Kennedy, casa 12',
            'tipo_direccion': 'casa',
            **cambios,
        }
        return self.client.post(self.url, datos, format='json')

    def detalle(self, direccion_id):
        return reverse('direccion-detail', args=[direccion_id])

    def test_requiere_sesion(self):
        self.client.force_authenticate(user=None)
        self.assertEqual(self.crear().status_code, status.HTTP_401_UNAUTHORIZED)

    def test_primera_direccion_es_principal(self):
        respuesta = self.crear()

        self.assertEqual(respuesta.status_code, status.HTTP_201_CREATED)
        self.assertTrue(respuesta.data['es_principal'])
        self.assertIn('Francisco Morazán', respuesta.data['ubicacion_texto'])

    def test_segunda_direccion_no_es_principal(self):
        self.crear()
        respuesta = self.crear(linea_direccion1='Res. Las Uvas')

        self.assertFalse(respuesta.data['es_principal'])

    def test_ubicacion_es_opcional(self):
        respuesta = self.client.post(
            self.url,
            {'linea_direccion1': 'Referencia sin municipio', 'tipo_direccion': 'otro'},
            format='json',
        )

        self.assertEqual(respuesta.status_code, status.HTTP_201_CREATED)
        self.assertIsNone(respuesta.data['ubicacion'])
        self.assertIsNone(respuesta.data['ubicacion_texto'])
        self.assertTrue(respuesta.data['es_principal'])

    def test_no_se_puede_crear_para_otro_usuario(self):
        respuesta = self.crear(usuario=self.luis.id)

        self.assertEqual(respuesta.status_code, status.HTTP_201_CREATED)
        direccion = Direccion.objects.get(pk=respuesta.data['id'])
        self.assertEqual(direccion.usuario, self.ana)

    def test_ubicacion_debe_ser_municipio(self):
        cortes = Ubicacion.objects.get(nombre='Cortés')
        respuesta = self.crear(ubicacion=cortes.id)

        self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('ubicacion', respuesta.data)

    def test_campos_obligatorios(self):
        respuesta = self.client.post(self.url, {}, format='json')

        self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('linea_direccion1', respuesta.data)
        self.assertNotIn('ubicacion', respuesta.data)

    def test_marcar_otra_como_principal_desmarca_la_anterior(self):
        primera = self.crear().data['id']
        segunda = self.crear(ubicacion=self.sps.id, es_principal=True).data['id']

        self.assertTrue(Direccion.objects.get(pk=segunda).es_principal)
        self.assertFalse(Direccion.objects.get(pk=primera).es_principal)
        self.assertEqual(self.ana.direcciones.filter(es_principal=True).count(), 1)

    def test_hacer_principal_con_patch(self):
        primera = self.crear().data['id']
        segunda = self.crear(ubicacion=self.sps.id).data['id']

        respuesta = self.client.patch(self.detalle(segunda), {'es_principal': True}, format='json')

        self.assertEqual(respuesta.status_code, status.HTTP_200_OK)
        self.assertTrue(Direccion.objects.get(pk=segunda).es_principal)
        self.assertFalse(Direccion.objects.get(pk=primera).es_principal)

    def test_quitar_principal_promueve_la_siguiente(self):
        primera = self.crear().data['id']
        segunda = self.crear(ubicacion=self.sps.id).data['id']

        respuesta = self.client.patch(self.detalle(primera), {'es_principal': False}, format='json')

        self.assertEqual(respuesta.status_code, status.HTTP_200_OK)
        self.assertFalse(Direccion.objects.get(pk=primera).es_principal)
        self.assertTrue(Direccion.objects.get(pk=segunda).es_principal)

    def test_no_se_puede_quitar_principal_si_es_la_unica(self):
        primera = self.crear().data['id']

        respuesta = self.client.patch(self.detalle(primera), {'es_principal': False}, format='json')

        self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('es_principal', respuesta.data)
        self.assertTrue(Direccion.objects.get(pk=primera).es_principal)

    def test_borrar_principal_pasa_a_la_siguiente(self):
        primera = self.crear().data['id']
        segunda = self.crear(ubicacion=self.sps.id).data['id']

        respuesta = self.client.delete(self.detalle(primera))

        self.assertEqual(respuesta.status_code, status.HTTP_204_NO_CONTENT)
        self.assertTrue(Direccion.objects.get(pk=segunda).es_principal)

    def test_base_de_datos_impide_dos_principales(self):
        Direccion.objects.create(
            usuario=self.ana, ubicacion=self.distrito, linea_direccion1='A', es_principal=True
        )
        with self.assertRaises(IntegrityError), transaction.atomic():
            Direccion.objects.create(
                usuario=self.ana, ubicacion=self.sps, linea_direccion1='B', es_principal=True
            )

    def test_solo_ve_sus_direcciones(self):
        self.crear()
        Direccion.objects.create(usuario=self.luis, ubicacion=self.sps, linea_direccion1='De Luis')

        respuesta = self.client.get(self.url)

        self.assertEqual(len(respuesta.data), 1)
        self.assertEqual(respuesta.data[0]['linea_direccion1'], 'Col. Kennedy, casa 12')

    def test_no_puede_ver_editar_ni_borrar_las_de_otro(self):
        ajena = Direccion.objects.create(
            usuario=self.luis, ubicacion=self.sps, linea_direccion1='De Luis'
        )
        url = self.detalle(ajena.id)

        self.assertEqual(self.client.get(url).status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(
            self.client.patch(url, {'linea_direccion1': 'Hackeada'}, format='json').status_code,
            status.HTTP_404_NOT_FOUND,
        )
        self.assertEqual(self.client.delete(url).status_code, status.HTTP_404_NOT_FOUND)

        ajena.refresh_from_db()
        self.assertEqual(ajena.linea_direccion1, 'De Luis')

    def test_put_no_permitido(self):
        direccion = self.crear().data['id']
        respuesta = self.client.put(self.detalle(direccion), {}, format='json')
        self.assertEqual(respuesta.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)