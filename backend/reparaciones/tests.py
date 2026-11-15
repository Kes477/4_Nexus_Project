
from django.test import SimpleTestCase
from django.contrib.auth.models import Permission
from reparaciones.models import EquipoCliente


class EquipoClienteTests(SimpleTestCase):

    def test_numero_serie_con_espacios(self):
        equipo = EquipoCliente(
            marca='DJI',
            modelo='Mini 4 Pro',
            numero_serie='  DJI-12345  '
        )

        equipo.clean()

        self.assertEqual(
            equipo.numero_serie,
            'DJI-12345'
        )

    def test_numero_serie_vacio(self):
        equipo = EquipoCliente(
            marca='DJI',
            modelo='Mini 4 Pro',
            numero_serie='   '
        )

        equipo.clean()

        self.assertIsNone(equipo.numero_serie)

    def test_numero_serie_nulo(self):
        equipo = EquipoCliente(
            marca='DJI',
            modelo='Mini 4 Pro',
            numero_serie=None
        )

        equipo.clean()

        self.assertIsNone(equipo.numero_serie)

from datetime import datetime, timezone

from django.core.exceptions import ValidationError

from reparaciones.models import OrdenServicio


class OrdenServicioTests(SimpleTestCase):

    def test_orden_recibida_sin_fecha_cierre(self):
        orden = OrdenServicio(
            estado=OrdenServicio.Estado.RECIBIDA,
            fecha_cierre=None
        )

        orden.clean()

    def test_orden_finalizada_sin_fecha_cierre(self):
        orden = OrdenServicio(
            estado=OrdenServicio.Estado.FINALIZADA,
            fecha_cierre=None
        )

        orden.clean()

    def test_orden_entregada_sin_fecha_cierre(self):
        orden = OrdenServicio(
            estado=OrdenServicio.Estado.ENTREGADA,
            fecha_cierre=None
        )

        with self.assertRaises(ValidationError):
            orden.clean()

    def test_orden_entregada_con_fecha_cierre(self):
        orden = OrdenServicio(
            estado=OrdenServicio.Estado.ENTREGADA,
            fecha_cierre=datetime(
                2026, 11, 13, 10, 0,
                tzinfo=timezone.utc
            )
        )

        orden.clean()

    def test_orden_cancelada_sin_fecha_cierre(self):
        orden = OrdenServicio(
            estado=OrdenServicio.Estado.CANCELADA,
            fecha_cierre=None
        )

        with self.assertRaises(ValidationError):
            orden.clean()

    def test_orden_abierta_con_fecha_cierre(self):
        orden = OrdenServicio(
            estado=OrdenServicio.Estado.EN_REPARACION,
            fecha_cierre=datetime(
                2026, 11, 13, 10, 0,
                tzinfo=timezone.utc
            )
        )

        with self.assertRaises(ValidationError):
            orden.clean()


from django.contrib.auth import get_user_model
from django.test import TestCase

from usuarios.models import PerfilCliente
from reparaciones.models import EquipoCliente


Usuario = get_user_model()


class EquipoClienteIntegracionTests(TestCase):

    def setUp(self):
        self.usuario = Usuario.objects.create_user(
            email='cliente.reparaciones@example.com',
            password='ClavePrueba123!',
            no_identificacion='0801199900090',
            first_name='Carlos',
            last_name='Lopez'
        )

        self.cliente = PerfilCliente.objects.create(
            usuario=self.usuario
        )

    def test_registrar_dron_externo(self):
        equipo = EquipoCliente.objects.create(
            cliente=self.cliente,
            marca='DJI',
            modelo='Mini 4 Pro',
            numero_serie='DJI-EXT-001'
        )

        self.assertIsNone(equipo.articulo)
        self.assertEqual(equipo.cliente, self.cliente)

    def test_cliente_con_varios_drones(self):
        EquipoCliente.objects.create(
            cliente=self.cliente,
            marca='DJI',
            modelo='Mini 4 Pro',
            numero_serie='DJI-EXT-002'
        )

        EquipoCliente.objects.create(
            cliente=self.cliente,
            marca='Autel',
            modelo='EVO II',
            numero_serie='AUTEL-EXT-001'
        )

        self.assertEqual(
            self.cliente.equipos.count(),
            2
        )
        
    def test_equipo_con_varias_ordenes(self):
        equipo = EquipoCliente.objects.create(
            cliente=self.cliente,
            marca='DJI',
            modelo='Mini 4 Pro',
            numero_serie='DJI-HIST-001'
        )

        OrdenServicio.objects.create(
            equipo=equipo,
            descripcion_problema='Problema de batería'
        )

        OrdenServicio.objects.create(
            equipo=equipo,
            descripcion_problema='Problema de cámara'
        )

        self.assertEqual(
            equipo.ordenes_servicio.count(),
            2
        )

from usuarios.models import Tecnico


class AsignacionTecnicoTests(TestCase):

    def setUp(self):
        self.usuario_cliente = Usuario.objects.create_user(
            email='cliente.tecnico@example.com',
            password='ClavePrueba123!',
            no_identificacion='0801199900101',
            first_name='Carlos',
            last_name='Lopez'
        )

        self.cliente = PerfilCliente.objects.create(
            usuario=self.usuario_cliente
        )

        self.usuario_tecnico = Usuario.objects.create_user(
            email='tecnico.reparaciones@example.com',
            password='ClavePrueba123!',
            no_identificacion='0801199900102',
            first_name='Pedro',
            last_name='Martinez'
        )

        self.tecnico = Tecnico.objects.create(
            usuario=self.usuario_tecnico,
            especialidad_tecnica='Reparación de drones',
            certificacion_fabricante='DJI',
            disponible=True
        )

        self.equipo = EquipoCliente.objects.create(
            cliente=self.cliente,
            marca='DJI',
            modelo='Mini 4 Pro',
            numero_serie='DJI-TEC-001'
        )

    def test_tecnico_con_varias_ordenes(self):
        OrdenServicio.objects.create(
            equipo=self.equipo,
            tecnico=self.tecnico,
            descripcion_problema='Falla en la cámara'
        )

        OrdenServicio.objects.create(
            equipo=self.equipo,
            tecnico=self.tecnico,
            descripcion_problema='Problema de batería'
        )

        self.assertEqual(
            self.tecnico.ordenes_asignadas.count(),
            2
        )

from reparaciones.serializers import OrdenServicioSerializer


class OrdenServicioSerializerTests(SimpleTestCase):

    def test_campos_protegidos_son_solo_lectura(self):
        serializer = OrdenServicioSerializer()

        campos_protegidos = [
            'id',
            'tecnico',
            'estado',
            'fecha_recepcion',
            'fecha_cierre'
        ]

        for nombre in campos_protegidos:
            with self.subTest(campo=nombre):
                self.assertTrue(
                    serializer.fields[nombre].read_only
                )


from reparaciones.serializers import EquipoClienteSerializer


class EquipoClienteSerializerTests(TestCase):

    def test_permite_equipo_externo(self):
        datos = {
            'marca': 'DJI',
            'modelo': 'Mini 4 Pro',
            'numero_serie': 'DJI-001'
        }

        serializer = EquipoClienteSerializer(data=datos)

        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertIsNone(serializer.validated_data.get('articulo'))

    def test_numero_serie_elimina_espacios(self):
        datos = {
            'marca': 'DJI',
            'modelo': 'Mini 4 Pro',
            'numero_serie': '  DJI-001  '
        }

        serializer = EquipoClienteSerializer(data=datos)

        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertEqual(
            serializer.validated_data['numero_serie'],
            'DJI-001'
        )

    def test_numero_serie_vacio_se_convierte_en_none(self):
        datos = {
            'marca': 'DJI',
            'modelo': 'Mini 4 Pro',
            'numero_serie': '   '
        }

        serializer = EquipoClienteSerializer(data=datos)

        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertIsNone(
            serializer.validated_data['numero_serie']
        )

    def test_rechaza_equipo_sin_marca(self):
        datos = {
            'modelo': 'Mini 4 Pro'
        }

        serializer = EquipoClienteSerializer(data=datos)

        self.assertFalse(serializer.is_valid())
        self.assertIn('marca', serializer.errors)

    def test_cliente_es_solo_lectura(self):
        serializer = EquipoClienteSerializer()

        self.assertTrue(
            serializer.fields['cliente'].read_only
        )

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase


class EquipoClienteAPITests(APITestCase):

    def setUp(self):
        self.url_equipos = reverse('equipo-lista')

    def test_usuario_no_autenticado_no_puede_consultar_equipos(self):
        respuesta = self.client.get(self.url_equipos)

        self.assertEqual(
            respuesta.status_code,
            status.HTTP_401_UNAUTHORIZED
        )

    def test_cliente_no_puede_consultar_equipos_ajenos(self):
        Usuario = get_user_model()

        usuario_carlos = Usuario.objects.create_user(
            email='carlos.api@example.com',
            password='ClavePrueba123!',
            no_identificacion='0801199900201',
            first_name='Carlos',
            last_name='Lopez'
        )

        usuario_maria = Usuario.objects.create_user(
            email='maria.api@example.com',
            password='ClavePrueba123!',
            no_identificacion='0801199900202',
            first_name='Maria',
            last_name='Perez'
        )

        cliente_carlos = PerfilCliente.objects.create(
            usuario=usuario_carlos
        )

        cliente_maria = PerfilCliente.objects.create(
            usuario=usuario_maria
        )

        equipo_carlos = EquipoCliente.objects.create(
            cliente=cliente_carlos,
            marca='DJI',
            modelo='Mini 4 Pro'
        )

        equipo_maria = EquipoCliente.objects.create(
            cliente=cliente_maria,
            marca='DJI',
            modelo='Air 3'
        )

        self.client.force_authenticate(
            user=usuario_carlos
        )

        respuesta = self.client.get(self.url_equipos)

        self.assertEqual(
            respuesta.status_code,
            status.HTTP_200_OK
        )

        ids_recibidos = [
            equipo['id'] for equipo in respuesta.data
        ]

        self.assertIn(equipo_carlos.id, ids_recibidos)
        self.assertNotIn(equipo_maria.id, ids_recibidos)

        respuesta_detalle = self.client.get(
            reverse(
                'equipo-detalle',
                kwargs={'pk': equipo_maria.id}
            )
        )

        self.assertEqual(
            respuesta_detalle.status_code,
            status.HTTP_404_NOT_FOUND
        )
    
    def test_registro_equipo_asigna_cliente_autenticado(self):
        Usuario = get_user_model()

        usuario_carlos = Usuario.objects.create_user(
            email='carlos.registro@example.com',
            password='ClavePrueba123!',
            no_identificacion='0801199900301',
            first_name='Carlos',
            last_name='Lopez'
        )

        usuario_maria = Usuario.objects.create_user(
            email='maria.registro@example.com',
            password='ClavePrueba123!',
            no_identificacion='0801199900302',
            first_name='Maria',
            last_name='Perez'
        )

        cliente_carlos = PerfilCliente.objects.create(
            usuario=usuario_carlos
        )

        cliente_maria = PerfilCliente.objects.create(
            usuario=usuario_maria
        )

        self.client.force_authenticate(
            user=usuario_carlos
        )

        datos = {
            'cliente': cliente_maria.pk,
            'marca': 'DJI',
            'modelo': 'Mini 4 Pro',
            'numero_serie': 'DJI-API-001'
        }

        respuesta = self.client.post(
            self.url_equipos,
            datos,
            format='json'
        )

        self.assertEqual(
            respuesta.status_code,
            status.HTTP_201_CREATED
        )

        equipo = EquipoCliente.objects.get(
            pk=respuesta.data['id']
        )

        self.assertEqual(
            equipo.cliente_id,
            cliente_carlos.pk
        )

        self.assertNotEqual(
            equipo.cliente_id,
            cliente_maria.pk
        )

    def test_usuario_sin_perfil_cliente_no_puede_registrar_equipo(self):
        Usuario = get_user_model()

        usuario = Usuario.objects.create_user(
            email='empleado.api@example.com',
            password='ClavePrueba123!',
            no_identificacion='0801199900401',
            first_name='Pedro',
            last_name='Martinez'
        )

        self.client.force_authenticate(
            user=usuario
        )

        datos = {
            'marca': 'DJI',
            'modelo': 'Mini 4 Pro',
            'numero_serie': 'DJI-API-002'
        }

        respuesta = self.client.post(
            self.url_equipos,
            datos,
            format='json'
        )

        self.assertEqual(
            respuesta.status_code,
            status.HTTP_403_FORBIDDEN
        )

        self.assertFalse(
            EquipoCliente.objects.filter(
                numero_serie='DJI-API-002'
            ).exists()
        )

class OrdenServicioAPITests(APITestCase):

    def setUp(self):
        self.url_ordenes = reverse('orden-lista')

    def test_usuario_no_autenticado_no_puede_consultar_ordenes(self):
        respuesta = self.client.get(self.url_ordenes)

        self.assertEqual(
            respuesta.status_code,
            status.HTTP_401_UNAUTHORIZED
        )

    def test_cliente_no_puede_consultar_ordenes_ajenas(self):
        Usuario = get_user_model()

        usuario_carlos = Usuario.objects.create_user(
            email='carlos.orden@example.com',
            password='ClavePrueba123!',
            no_identificacion='0801199900501',
            first_name='Carlos',
            last_name='Lopez'
        )

        usuario_maria = Usuario.objects.create_user(
            email='maria.orden@example.com',
            password='ClavePrueba123!',
            no_identificacion='0801199900502',
            first_name='Maria',
            last_name='Perez'
        )

        cliente_carlos = PerfilCliente.objects.create(
            usuario=usuario_carlos
        )

        cliente_maria = PerfilCliente.objects.create(
            usuario=usuario_maria
        )

        equipo_carlos = EquipoCliente.objects.create(
            cliente=cliente_carlos,
            marca='DJI',
            modelo='Mini 4 Pro'
        )

        equipo_maria = EquipoCliente.objects.create(
            cliente=cliente_maria,
            marca='DJI',
            modelo='Air 3'
        )

        orden_carlos = OrdenServicio.objects.create(
            equipo=equipo_carlos,
            descripcion_problema='Falla en la cámara'
        )

        orden_maria = OrdenServicio.objects.create(
            equipo=equipo_maria,
            descripcion_problema='Problema de batería'
        )

        self.client.force_authenticate(
            user=usuario_carlos
        )

        respuesta = self.client.get(self.url_ordenes)

        self.assertEqual(
            respuesta.status_code,
            status.HTTP_200_OK
        )

        ids_recibidos = [
            orden['id'] for orden in respuesta.data
        ]

        self.assertIn(
            orden_carlos.id,
            ids_recibidos
        )

        self.assertNotIn(
            orden_maria.id,
            ids_recibidos
        )

        respuesta_detalle = self.client.get(
            reverse(
                'orden-detalle',
                kwargs={'pk': orden_maria.id}
            )
        )

        self.assertEqual(
            respuesta_detalle.status_code,
            status.HTTP_404_NOT_FOUND
        )
    
    def test_tecnico_solo_consulta_ordenes_asignadas(self):
        Usuario = get_user_model()

        usuario_cliente = Usuario.objects.create_user(
            email='cliente.tecnicos@example.com',
            password='ClavePrueba123!',
            no_identificacion='0801199900601',
            first_name='Carlos',
            last_name='Lopez'
        )

        cliente = PerfilCliente.objects.create(
            usuario=usuario_cliente
        )

        equipo = EquipoCliente.objects.create(
            cliente=cliente,
            marca='DJI',
            modelo='Mini 4 Pro'
        )

        usuario_pedro = Usuario.objects.create_user(
            email='pedro.tecnico@example.com',
            password='ClavePrueba123!',
            no_identificacion='0801199900602',
            first_name='Pedro',
            last_name='Martinez'
        )

        usuario_luis = Usuario.objects.create_user(
            email='luis.tecnico@example.com',
            password='ClavePrueba123!',
            no_identificacion='0801199900603',
            first_name='Luis',
            last_name='Perez'
        )

        tecnico_pedro = Tecnico.objects.create(
            usuario=usuario_pedro,
            especialidad_tecnica='Reparación de drones',
            disponible=True
        )

        tecnico_luis = Tecnico.objects.create(
            usuario=usuario_luis,
            especialidad_tecnica='Reparación de drones',
            disponible=True
        )

        orden_pedro = OrdenServicio.objects.create(
            equipo=equipo,
            tecnico=tecnico_pedro,
            descripcion_problema='Falla en la cámara'
        )

        orden_luis = OrdenServicio.objects.create(
            equipo=equipo,
            tecnico=tecnico_luis,
            descripcion_problema='Problema de batería'
        )

        self.client.force_authenticate(
            user=usuario_pedro
        )

        respuesta = self.client.get(self.url_ordenes)

        self.assertEqual(
            respuesta.status_code,
            status.HTTP_200_OK
        )

        ids_recibidos = [
            orden['id'] for orden in respuesta.data
        ]

        self.assertIn(orden_pedro.id, ids_recibidos)
        self.assertNotIn(orden_luis.id, ids_recibidos)

        respuesta_detalle = self.client.get(
            reverse(
                'orden-detalle',
                kwargs={'pk': orden_luis.id}
            )
        )

        self.assertEqual(
            respuesta_detalle.status_code,
            status.HTTP_404_NOT_FOUND
        )
    
    def test_usuario_sin_perfiles_no_puede_consultar_ordenes(self):
        Usuario = get_user_model()

        usuario = Usuario.objects.create_user(
            email='usuario.sinperfil@example.com',
            password='ClavePrueba123!',
            no_identificacion='0801199900701',
            first_name='Juan',
            last_name='Perez'
        )

        self.client.force_authenticate(
            user=usuario
        )

        respuesta = self.client.get(self.url_ordenes)

        self.assertEqual(
            respuesta.status_code,
            status.HTTP_200_OK
        )

        self.assertEqual(
            list(respuesta.data),
            []
        )

    def test_usuario_sin_permiso_no_puede_crear_orden(self):
        Usuario = get_user_model()

        usuario = Usuario.objects.create_user(
            email='cliente.sinpermiso@example.com',
            password='ClavePrueba123!',
            no_identificacion='0801199900801',
            first_name='Carlos',
            last_name='Lopez'
        )

        cliente = PerfilCliente.objects.create(
            usuario=usuario
        )

        equipo = EquipoCliente.objects.create(
            cliente=cliente,
            marca='DJI',
            modelo='Mini 4 Pro'
        )

        self.client.force_authenticate(
            user=usuario
        )

        datos = {
            'equipo': equipo.id,
            'descripcion_problema': 'Falla en la cámara',
            'observaciones': 'El equipo no enfoca correctamente'
        }

        respuesta = self.client.post(
            self.url_ordenes,
            datos,
            format='json'
        )

        self.assertEqual(
            respuesta.status_code,
            status.HTTP_403_FORBIDDEN
        )

        self.assertEqual(
            OrdenServicio.objects.count(),
            0
        )

    def test_usuario_con_permiso_puede_crear_orden(self):
        Usuario = get_user_model()

        usuario = Usuario.objects.create_user(
            email='empleado.ordenes@example.com',
            password='ClavePrueba123!',
            no_identificacion='0801199900901',
            first_name='Pedro',
            last_name='Martinez'
        )

        permiso = Permission.objects.get(
            content_type__app_label='reparaciones',
            codename='add_ordenservicio'
        )

        usuario.user_permissions.add(permiso)

        usuario_cliente = Usuario.objects.create_user(
            email='cliente.orden@example.com',
            password='ClavePrueba123!',
            no_identificacion='0801199900902',
            first_name='Carlos',
            last_name='Lopez'
        )

        cliente = PerfilCliente.objects.create(
            usuario=usuario_cliente
        )

        equipo = EquipoCliente.objects.create(
            cliente=cliente,
            marca='DJI',
            modelo='Mini 4 Pro'
        )

        self.client.force_authenticate(
            user=usuario
        )

        datos = {
            'equipo': equipo.id,
            'descripcion_problema': 'Falla en la cámara',
            'observaciones': 'El cliente solicita diagnóstico',
            'estado': 'ENTREGADA',
            'fecha_cierre': '2026-11-14T10:00:00Z'
        }

        respuesta = self.client.post(
            self.url_ordenes,
            datos,
            format='json'
        )

        self.assertEqual(
            respuesta.status_code,
            status.HTTP_201_CREATED
        )

        self.assertEqual(
            OrdenServicio.objects.count(),
            1
        )

        orden = OrdenServicio.objects.get()

        self.assertEqual(
            orden.equipo,
            equipo
        )

        self.assertEqual(
            orden.estado,
            OrdenServicio.Estado.RECIBIDA
        )

        self.assertIsNone(
            orden.tecnico
        )

        self.assertIsNone(
            orden.fecha_cierre
        )

        self.assertIsNotNone(
            orden.fecha_recepcion
        )

    def test_usuario_con_permiso_puede_consultar_todas_las_ordenes(self):
        Usuario = get_user_model()

        usuario_empleado = Usuario.objects.create_user(
            email='empleado.consulta@example.com',
            password='ClavePrueba123!',
            no_identificacion='0801199901001',
            first_name='Ana',
            last_name='Martinez'
        )

        permiso = Permission.objects.get(
            content_type__app_label='reparaciones',
            codename='view_ordenservicio'
        )

        usuario_empleado.user_permissions.add(permiso)

        usuario_cliente = Usuario.objects.create_user(
            email='cliente.consulta@example.com',
            password='ClavePrueba123!',
            no_identificacion='0801199901002',
            first_name='Carlos',
            last_name='Lopez'
        )

        cliente = PerfilCliente.objects.create(
            usuario=usuario_cliente
        )

        equipo = EquipoCliente.objects.create(
            cliente=cliente,
            marca='DJI',
            modelo='Mini 4 Pro'
        )

        orden = OrdenServicio.objects.create(
            equipo=equipo,
            descripcion_problema='Falla en la cámara'
        )

        self.client.force_authenticate(
            user=usuario_empleado
        )

        respuesta = self.client.get(self.url_ordenes)

        self.assertEqual(
            respuesta.status_code,
            status.HTTP_200_OK
        )

        ids_recibidos = [
            registro['id'] for registro in respuesta.data
        ]

        self.assertIn(
            orden.id,
            ids_recibidos
        )

        respuesta_detalle = self.client.get(
            reverse(
                'orden-detalle',
                kwargs={'pk': orden.id}
            )
        )

        self.assertEqual(
            respuesta_detalle.status_code,
            status.HTTP_200_OK
        )

    def test_usuario_sin_permiso_no_puede_asignar_tecnico(self):
        Usuario = get_user_model()

        usuario_cliente = Usuario.objects.create_user(
            email='cliente.asignacion@example.com',
            password='ClavePrueba123!',
            no_identificacion='0801199901101',
            first_name='Carlos',
            last_name='Lopez'
        )

        cliente = PerfilCliente.objects.create(
            usuario=usuario_cliente
        )

        equipo = EquipoCliente.objects.create(
            cliente=cliente,
            marca='DJI',
            modelo='Mini 4 Pro'
        )

        orden = OrdenServicio.objects.create(
            equipo=equipo,
            descripcion_problema='Falla en la cámara'
        )

        usuario_tecnico = Usuario.objects.create_user(
            email='tecnico.asignacion@example.com',
            password='ClavePrueba123!',
            no_identificacion='0801199901102',
            first_name='Pedro',
            last_name='Martinez'
        )

        tecnico = Tecnico.objects.create(
            usuario=usuario_tecnico,
            especialidad_tecnica='Reparación de drones',
            disponible=True
        )

        self.client.force_authenticate(
            user=usuario_cliente
        )

        respuesta = self.client.patch(
            reverse(
                'orden-asignar-tecnico',
                kwargs={'pk': orden.id}
            ),
            {'tecnico': tecnico.pk},
            format='json'
        )

        self.assertEqual(
            respuesta.status_code,
            status.HTTP_403_FORBIDDEN
        )

        orden.refresh_from_db()

        self.assertIsNone(orden.tecnico)

    def test_usuario_con_permiso_puede_asignar_tecnico(self):
        Usuario = get_user_model()

        usuario_cliente = Usuario.objects.create_user(
            email='cliente.asignacion.valida@example.com',
            password='ClavePrueba123!',
            no_identificacion='0801199901201',
            first_name='Carlos',
            last_name='Lopez'
        )

        cliente = PerfilCliente.objects.create(
            usuario=usuario_cliente
        )

        equipo = EquipoCliente.objects.create(
            cliente=cliente,
            marca='DJI',
            modelo='Mini 4 Pro'
        )

        orden = OrdenServicio.objects.create(
            equipo=equipo,
            descripcion_problema='Falla en la cámara'
        )

        usuario_tecnico = Usuario.objects.create_user(
            email='tecnico.asignacion.valida@example.com',
            password='ClavePrueba123!',
            no_identificacion='0801199901202',
            first_name='Pedro',
            last_name='Martinez'
        )

        tecnico = Tecnico.objects.create(
            usuario=usuario_tecnico,
            especialidad_tecnica='Reparación de drones',
            disponible=True
        )

        usuario_empleado = Usuario.objects.create_user(
            email='empleado.asignacion@example.com',
            password='ClavePrueba123!',
            no_identificacion='0801199901203',
            first_name='Ana',
            last_name='Garcia'
        )

        permiso = Permission.objects.get(
            content_type__app_label='reparaciones',
            codename='change_ordenservicio'
        )

        usuario_empleado.user_permissions.add(permiso)

        self.client.force_authenticate(
            user=usuario_empleado
        )

        respuesta = self.client.patch(
            reverse(
                'orden-asignar-tecnico',
                kwargs={'pk': orden.id}
            ),
            {
                'tecnico': tecnico.pk
            },
            format='json'
        )

        self.assertEqual(
            respuesta.status_code,
            status.HTTP_200_OK
        )

        orden.refresh_from_db()

        self.assertEqual(
            orden.tecnico,
            tecnico
        )

        self.assertEqual(
            orden.estado,
            OrdenServicio.Estado.RECIBIDA
        )

        self.assertIsNone(
            orden.fecha_cierre
        )

        self.assertEqual(
            respuesta.data['tecnico'],
            tecnico.pk
        )
    
    def test_no_se_puede_asignar_tecnico_no_disponible(self):
        Usuario = get_user_model()

        usuario_cliente = Usuario.objects.create_user(
            email='cliente.no.disponible@example.com',
            password='ClavePrueba123!',
            no_identificacion='0801199901301',
            first_name='Carlos',
            last_name='Lopez'
        )

        cliente = PerfilCliente.objects.create(
            usuario=usuario_cliente
        )

        equipo = EquipoCliente.objects.create(
            cliente=cliente,
            marca='DJI',
            modelo='Mini 4 Pro'
        )

        orden = OrdenServicio.objects.create(
            equipo=equipo,
            descripcion_problema='Falla en el motor'
        )

        usuario_tecnico = Usuario.objects.create_user(
            email='tecnico.no.disponible@example.com',
            password='ClavePrueba123!',
            no_identificacion='0801199901302',
            first_name='Pedro',
            last_name='Martinez'
        )

        tecnico = Tecnico.objects.create(
            usuario=usuario_tecnico,
            especialidad_tecnica='Reparación de drones',
            disponible=False
        )

        usuario_empleado = Usuario.objects.create_user(
            email='empleado.no.disponible@example.com',
            password='ClavePrueba123!',
            no_identificacion='0801199901303',
            first_name='Ana',
            last_name='Garcia'
        )

        permiso = Permission.objects.get(
            content_type__app_label='reparaciones',
            codename='change_ordenservicio'
        )

        usuario_empleado.user_permissions.add(permiso)

        self.client.force_authenticate(
            user=usuario_empleado
        )

        respuesta = self.client.patch(
            reverse(
                'orden-asignar-tecnico',
                kwargs={'pk': orden.id}
            ),
            {'tecnico': tecnico.pk},
            format='json'
        )

        self.assertEqual(
            respuesta.status_code,
            status.HTTP_400_BAD_REQUEST
        )

        orden.refresh_from_db()

        self.assertIsNone(orden.tecnico)

        self.assertEqual(
            orden.estado,
            OrdenServicio.Estado.RECIBIDA
        )

    def test_no_se_puede_asignar_tecnico_a_orden_cerrada(self):
        from django.utils import timezone

        Usuario = get_user_model()

        usuario_cliente = Usuario.objects.create_user(
            email='cliente.orden.cerrada@example.com',
            password='ClavePrueba123!',
            no_identificacion='0801199901401',
            first_name='Carlos',
            last_name='Lopez'
        )

        cliente = PerfilCliente.objects.create(
            usuario=usuario_cliente
        )

        equipo = EquipoCliente.objects.create(
            cliente=cliente,
            marca='DJI',
            modelo='Mini 4 Pro'
        )

        usuario_tecnico = Usuario.objects.create_user(
            email='tecnico.orden.cerrada@example.com',
            password='ClavePrueba123!',
            no_identificacion='0801199901402',
            first_name='Pedro',
            last_name='Martinez'
        )

        tecnico = Tecnico.objects.create(
            usuario=usuario_tecnico,
            especialidad_tecnica='Reparación de drones',
            disponible=True
        )

        usuario_empleado = Usuario.objects.create_user(
            email='empleado.orden.cerrada@example.com',
            password='ClavePrueba123!',
            no_identificacion='0801199901403',
            first_name='Ana',
            last_name='Garcia'
        )

        permiso = Permission.objects.get(
            content_type__app_label='reparaciones',
            codename='change_ordenservicio'
        )

        usuario_empleado.user_permissions.add(permiso)

        self.client.force_authenticate(
            user=usuario_empleado
        )

        estados_cerrados = [
            OrdenServicio.Estado.ENTREGADA,
            OrdenServicio.Estado.CANCELADA
        ]

        for estado in estados_cerrados:
            with self.subTest(estado=estado):

                orden = OrdenServicio.objects.create(
                    equipo=equipo,
                    descripcion_problema='Falla en la cámara',
                    estado=estado,
                    fecha_cierre=timezone.now()
                )

                respuesta = self.client.patch(
                    reverse(
                        'orden-asignar-tecnico',
                        kwargs={'pk': orden.id}
                    ),
                    {'tecnico': tecnico.pk},
                    format='json'
                )

                self.assertEqual(
                    respuesta.status_code,
                    status.HTTP_400_BAD_REQUEST
                )

                orden.refresh_from_db()

                self.assertIsNone(orden.tecnico)

                self.assertEqual(
                    orden.estado,
                    estado
                )

                self.assertIsNotNone(
                    orden.fecha_cierre
                )

    def test_no_se_puede_asignar_tecnico_inexistente(self):
        Usuario = get_user_model()

        usuario_cliente = Usuario.objects.create_user(
            email='cliente.tecnico.inexistente@example.com',
            password='ClavePrueba123!',
            no_identificacion='0801199901501',
            first_name='Carlos',
            last_name='Lopez'
        )

        cliente = PerfilCliente.objects.create(
            usuario=usuario_cliente
        )

        equipo = EquipoCliente.objects.create(
            cliente=cliente,
            marca='DJI',
            modelo='Mini 4 Pro'
        )

        orden = OrdenServicio.objects.create(
            equipo=equipo,
            descripcion_problema='Falla en el motor'
        )

        usuario_empleado = Usuario.objects.create_user(
            email='empleado.tecnico.inexistente@example.com',
            password='ClavePrueba123!',
            no_identificacion='0801199901502',
            first_name='Ana',
            last_name='Garcia'
        )

        permiso = Permission.objects.get(
            content_type__app_label='reparaciones',
            codename='change_ordenservicio'
        )

        usuario_empleado.user_permissions.add(permiso)

        self.client.force_authenticate(
            user=usuario_empleado
        )

        respuesta = self.client.patch(
            reverse(
                'orden-asignar-tecnico',
                kwargs={'pk': orden.id}
            ),
            {'tecnico': 999999},
            format='json'
        )

        self.assertEqual(
            respuesta.status_code,
            status.HTTP_400_BAD_REQUEST
        )

        orden.refresh_from_db()

        self.assertIsNone(orden.tecnico)

        self.assertEqual(
            orden.estado,
            OrdenServicio.Estado.RECIBIDA
        )

class TransicionesEstadoTests(SimpleTestCase):

    def test_transiciones_permitidas(self):
        casos = [
            ('RECIBIDA', 'EN_DIAGNOSTICO'),
            ('RECIBIDA', 'CANCELADA'),
            ('EN_DIAGNOSTICO', 'EN_REPARACION'),
            ('EN_DIAGNOSTICO', 'CANCELADA'),
            ('EN_REPARACION', 'FINALIZADA'),
            ('EN_REPARACION', 'CANCELADA'),
            ('FINALIZADA', 'ENTREGADA'),
            ('FINALIZADA', 'CANCELADA')
        ]

        for estado_actual, nuevo_estado in casos:
            with self.subTest(
                actual=estado_actual,
                nuevo=nuevo_estado
            ):
                orden = OrdenServicio(
                    estado=estado_actual
                )

                self.assertTrue(
                    orden.puede_cambiar_a(nuevo_estado)
                )

    def test_transiciones_prohibidas(self):
        casos = [
            ('RECIBIDA', 'ENTREGADA'),
            ('RECIBIDA', 'FINALIZADA'),
            ('EN_DIAGNOSTICO', 'FINALIZADA'),
            ('EN_REPARACION', 'ENTREGADA'),
            ('FINALIZADA', 'EN_REPARACION'),
            ('ENTREGADA', 'RECIBIDA'),
            ('ENTREGADA', 'CANCELADA'),
            ('CANCELADA', 'RECIBIDA'),
            ('CANCELADA', 'EN_DIAGNOSTICO')
        ]

        for estado_actual, nuevo_estado in casos:
            with self.subTest(
                actual=estado_actual,
                nuevo=nuevo_estado
            ):
                orden = OrdenServicio(
                    estado=estado_actual
                )

                self.assertFalse(
                    orden.puede_cambiar_a(nuevo_estado)
                )

    def test_no_se_permite_repetir_el_mismo_estado(self):
        for estado in OrdenServicio.Estado.values:
            with self.subTest(estado=estado):
                orden = OrdenServicio(
                    estado=estado
                )

                self.assertFalse(
                    orden.puede_cambiar_a(estado)
                )

class CambiarEstadoAPITests(APITestCase):

    def test_usuario_no_autenticado_no_puede_cambiar_estado(self):
        url = reverse(
            'orden-cambiar-estado',
            kwargs={'pk': 1}
        )

        respuesta = self.client.patch(
            url,
            {'estado': 'EN_DIAGNOSTICO'},
            format='json'
        )

        self.assertEqual(
            respuesta.status_code,
            status.HTTP_401_UNAUTHORIZED
        )

    def test_tecnico_no_puede_cambiar_orden_de_otro_tecnico(self):
        Usuario = get_user_model()

        # Crear el cliente propietario del equipo
        usuario_cliente = Usuario.objects.create_user(
            email='cliente.estado@example.com',
            password='ClavePrueba123!',
            no_identificacion='0801199900201',
            first_name='Carlos',
            last_name='Lopez'
        )

        cliente = PerfilCliente.objects.create(
            usuario=usuario_cliente
        )

        # Crear el equipo del cliente
        equipo = EquipoCliente.objects.create(
            cliente=cliente,
            marca='DJI',
            modelo='Mini 4 Pro',
            numero_serie='DJI-ESTADO-001'
        )

        # Crear el técnico responsable
        usuario_tecnico_1 = Usuario.objects.create_user(
            email='tecnico1.estado@example.com',
            password='ClavePrueba123!',
            no_identificacion='0801199900202',
            first_name='Pedro',
            last_name='Martinez'
        )

        tecnico_1 = Tecnico.objects.create(
            usuario=usuario_tecnico_1,
            especialidad_tecnica='Reparación de drones',
            disponible=True
        )

        # Crear un segundo técnico
        usuario_tecnico_2 = Usuario.objects.create_user(
            email='tecnico2.estado@example.com',
            password='ClavePrueba123!',
            no_identificacion='0801199900203',
            first_name='Juan',
            last_name='Perez'
        )

        Tecnico.objects.create(
            usuario=usuario_tecnico_2,
            especialidad_tecnica='Mantenimiento de drones',
            disponible=True
        )

        # La orden pertenece al primer técnico
        orden = OrdenServicio.objects.create(
            equipo=equipo,
            tecnico=tecnico_1,
            descripcion_problema='Falla en la cámara'
        )

        # El segundo técnico intenta cambiar el estado
        self.client.force_authenticate(
            user=usuario_tecnico_2
        )

        url = reverse(
            'orden-cambiar-estado',
            kwargs={'pk': orden.pk}
        )

        respuesta = self.client.patch(
            url,
            {'estado': 'EN_DIAGNOSTICO'},
            format='json'
        )

        # Debe rechazar la operación
        self.assertEqual(
            respuesta.status_code,
            status.HTTP_403_FORBIDDEN
        )

        # El estado debe permanecer sin cambios
        orden.refresh_from_db()

        self.assertEqual(
            orden.estado,
            OrdenServicio.Estado.RECIBIDA
        )

        self.assertIsNone(
            orden.fecha_cierre
        )

    def test_tecnico_asignado_puede_avanzar_orden(self):
        Usuario = get_user_model()

        # Crear cliente
        usuario_cliente = Usuario.objects.create_user(
            email='cliente.flujo@example.com',
            password='ClavePrueba123!',
            no_identificacion='0801199900211',
            first_name='Carlos',
            last_name='Lopez'
        )

        cliente = PerfilCliente.objects.create(
            usuario=usuario_cliente
        )

        # Crear equipo
        equipo = EquipoCliente.objects.create(
            cliente=cliente,
            marca='DJI',
            modelo='Mini 4 Pro',
            numero_serie='DJI-FLUJO-001'
        )

        # Crear técnico
        usuario_tecnico = Usuario.objects.create_user(
            email='tecnico.flujo@example.com',
            password='ClavePrueba123!',
            no_identificacion='0801199900212',
            first_name='Pedro',
            last_name='Martinez'
        )

        tecnico = Tecnico.objects.create(
            usuario=usuario_tecnico,
            especialidad_tecnica='Reparación de drones',
            disponible=True
        )

        # Crear orden asignada
        orden = OrdenServicio.objects.create(
            equipo=equipo,
            tecnico=tecnico,
            descripcion_problema='Falla en la cámara'
        )

        self.client.force_authenticate(
            user=usuario_tecnico
        )

        url = reverse(
            'orden-cambiar-estado',
            kwargs={'pk': orden.pk}
        )

        estados = [
            OrdenServicio.Estado.EN_DIAGNOSTICO,
            OrdenServicio.Estado.EN_REPARACION,
            OrdenServicio.Estado.FINALIZADA
        ]

        for nuevo_estado in estados:
            with self.subTest(estado=nuevo_estado):

                respuesta = self.client.patch(
                    url,
                    {'estado': nuevo_estado},
                    format='json'
                )

                self.assertEqual(
                    respuesta.status_code,
                    status.HTTP_200_OK
                )

                orden.refresh_from_db()

                self.assertEqual(
                    orden.estado,
                    nuevo_estado
                )

                self.assertIsNone(
                    orden.fecha_cierre
                )
    
    def test_personal_autorizado_puede_entregar_orden(self):
        Usuario = get_user_model()

        # Crear cliente
        usuario_cliente = Usuario.objects.create_user(
            email='cliente.entrega@example.com',
            password='ClavePrueba123!',
            no_identificacion='0801199900221',
            first_name='Carlos',
            last_name='Lopez'
        )

        cliente = PerfilCliente.objects.create(
            usuario=usuario_cliente
        )

        # Crear equipo
        equipo = EquipoCliente.objects.create(
            cliente=cliente,
            marca='DJI',
            modelo='Mini 4 Pro',
            numero_serie='DJI-ENTREGA-001'
        )

        # Crear una orden cuya reparación ya terminó
        orden = OrdenServicio.objects.create(
            equipo=equipo,
            descripcion_problema='Falla en la cámara',
            estado=OrdenServicio.Estado.FINALIZADA
        )

        # Crear usuario administrativo
        usuario_admin = Usuario.objects.create_user(
            email='admin.entrega@example.com',
            password='ClavePrueba123!',
            no_identificacion='0801199900222',
            first_name='Ana',
            last_name='Garcia'
        )

        # Conceder permiso para modificar órdenes
        permiso = Permission.objects.get(
            codename='change_ordenservicio',
            content_type__app_label='reparaciones'
        )

        usuario_admin.user_permissions.add(permiso)

        self.client.force_authenticate(
            user=usuario_admin
        )

        url = reverse(
            'orden-cambiar-estado',
            kwargs={'pk': orden.pk}
        )

        # Solicitar entrega del equipo
        respuesta = self.client.patch(
            url,
            {'estado': 'ENTREGADA'},
            format='json'
        )

        self.assertEqual(
            respuesta.status_code,
            status.HTTP_200_OK
        )

        # Verificar cambios guardados
        orden.refresh_from_db()

        self.assertEqual(
            orden.estado,
            OrdenServicio.Estado.ENTREGADA
        )

        # La fecha de cierre debe generarse automáticamente
        self.assertIsNotNone(
            orden.fecha_cierre
        )

    def test_personal_autorizado_puede_cancelar_orden(self):
        Usuario = get_user_model()

        # Crear cliente
        usuario_cliente = Usuario.objects.create_user(
            email='cliente.cancelacion@example.com',
            password='ClavePrueba123!',
            no_identificacion='0801199900231',
            first_name='Carlos',
            last_name='Lopez'
        )

        cliente = PerfilCliente.objects.create(
            usuario=usuario_cliente
        )

        # Crear equipo
        equipo = EquipoCliente.objects.create(
            cliente=cliente,
            marca='DJI',
            modelo='Mini 4 Pro',
            numero_serie='DJI-CANCELACION-001'
        )

        # Crear usuario administrativo
        usuario_admin = Usuario.objects.create_user(
            email='admin.cancelacion@example.com',
            password='ClavePrueba123!',
            no_identificacion='0801199900232',
            first_name='Ana',
            last_name='Garcia'
        )

        permiso = Permission.objects.get(
            codename='change_ordenservicio',
            content_type__app_label='reparaciones'
        )

        usuario_admin.user_permissions.add(permiso)

        self.client.force_authenticate(
            user=usuario_admin
        )

        # Probar la cancelación desde cada estado abierto
        estados_abiertos = [
            OrdenServicio.Estado.RECIBIDA,
            OrdenServicio.Estado.EN_DIAGNOSTICO,
            OrdenServicio.Estado.EN_REPARACION,
            OrdenServicio.Estado.FINALIZADA
        ]

        for estado_inicial in estados_abiertos:
            with self.subTest(estado=estado_inicial):

                orden = OrdenServicio.objects.create(
                    equipo=equipo,
                    descripcion_problema='Falla en la cámara',
                    estado=estado_inicial
                )

                url = reverse(
                    'orden-cambiar-estado',
                    kwargs={'pk': orden.pk}
                )

                respuesta = self.client.patch(
                    url,
                    {'estado': 'CANCELADA'},
                    format='json'
                )

                self.assertEqual(
                    respuesta.status_code,
                    status.HTTP_200_OK
                )

                orden.refresh_from_db()

                self.assertEqual(
                    orden.estado,
                    OrdenServicio.Estado.CANCELADA
                )

                self.assertIsNotNone(
                    orden.fecha_cierre
                )

    def test_usuario_sin_permiso_no_puede_cerrar_ordenes(self):
        Usuario = get_user_model()

        # Crear cliente
        usuario_cliente = Usuario.objects.create_user(
            email='cliente.sinpermiso@example.com',
            password='ClavePrueba123!',
            no_identificacion='0801199900241',
            first_name='Carlos',
            last_name='Lopez'
        )

        cliente = PerfilCliente.objects.create(
            usuario=usuario_cliente
        )

        # Crear equipo
        equipo = EquipoCliente.objects.create(
            cliente=cliente,
            marca='DJI',
            modelo='Mini 4 Pro',
            numero_serie='DJI-SINPERMISO-001'
        )

        # Crear usuario sin permisos administrativos
        usuario_sin_permiso = Usuario.objects.create_user(
            email='usuario.sinpermiso@example.com',
            password='ClavePrueba123!',
            no_identificacion='0801199900242',
            first_name='Juan',
            last_name='Perez'
        )

        self.client.force_authenticate(
            user=usuario_sin_permiso
        )

        # Probar entrega y cancelación
        casos = [
            (
                OrdenServicio.Estado.FINALIZADA,
                OrdenServicio.Estado.ENTREGADA
            ),
            (
                OrdenServicio.Estado.RECIBIDA,
                OrdenServicio.Estado.CANCELADA
            )
        ]

        for estado_inicial, nuevo_estado in casos:
            with self.subTest(
                inicial=estado_inicial,
                nuevo=nuevo_estado
            ):

                orden = OrdenServicio.objects.create(
                    equipo=equipo,
                    descripcion_problema='Falla en la cámara',
                    estado=estado_inicial
                )

                url = reverse(
                    'orden-cambiar-estado',
                    kwargs={'pk': orden.pk}
                )

                respuesta = self.client.patch(
                    url,
                    {'estado': nuevo_estado},
                    format='json'
                )

                # La operación debe rechazarse
                self.assertEqual(
                    respuesta.status_code,
                    status.HTTP_403_FORBIDDEN
                )

                # Comprobar que no hubo modificaciones
                orden.refresh_from_db()

                self.assertEqual(
                    orden.estado,
                    estado_inicial
                )

                self.assertIsNone(
                    orden.fecha_cierre
                )

    def test_ordenes_cerradas_no_pueden_cambiar_estado(self):
        from django.utils import timezone

        Usuario = get_user_model()

        usuario_cliente = Usuario.objects.create_user(
            email='cliente.cerradas@example.com',
            password='ClavePrueba123!',
            no_identificacion='0801199900251',
            first_name='Carlos',
            last_name='Lopez'
        )

        cliente = PerfilCliente.objects.create(
            usuario=usuario_cliente
        )

        equipo = EquipoCliente.objects.create(
            cliente=cliente,
            marca='DJI',
            modelo='Mini 4 Pro',
            numero_serie='DJI-CERRADAS-001'
        )

        usuario_admin = Usuario.objects.create_user(
            email='admin.cerradas@example.com',
            password='ClavePrueba123!',
            no_identificacion='0801199900252',
            first_name='Ana',
            last_name='Garcia'
        )

        permiso = Permission.objects.get(
            codename='change_ordenservicio',
            content_type__app_label='reparaciones'
        )

        usuario_admin.user_permissions.add(permiso)

        self.client.force_authenticate(
            user=usuario_admin
        )

        estados_cerrados = [
            OrdenServicio.Estado.ENTREGADA,
            OrdenServicio.Estado.CANCELADA
        ]

        for estado_inicial in estados_cerrados:
            with self.subTest(estado=estado_inicial):

                fecha_original = timezone.now()

                orden = OrdenServicio.objects.create(
                    equipo=equipo,
                    descripcion_problema='Falla en la cámara',
                    estado=estado_inicial,
                    fecha_cierre=fecha_original
                )

                url = reverse(
                    'orden-cambiar-estado',
                    kwargs={'pk': orden.pk}
                )

                # Intentar cambiar una orden cerrada
                respuesta = self.client.patch(
                    url,
                    {'estado': 'CANCELADA' if estado_inicial == 'ENTREGADA'
                     else 'ENTREGADA'},
                    format='json'
                )

                self.assertEqual(
                    respuesta.status_code,
                    status.HTTP_400_BAD_REQUEST
                )

                orden.refresh_from_db()

                self.assertEqual(
                    orden.estado,
                    estado_inicial
                )

                self.assertEqual(
                    orden.fecha_cierre,
                    fecha_original
                )

    def test_tecnico_no_puede_saltar_etapas(self):
        Usuario = get_user_model()

        usuario_cliente = Usuario.objects.create_user(
            email='cliente.saltos@example.com',
            password='ClavePrueba123!',
            no_identificacion='0801199900261',
            first_name='Carlos',
            last_name='Lopez'
        )

        cliente = PerfilCliente.objects.create(
            usuario=usuario_cliente
        )

        equipo = EquipoCliente.objects.create(
            cliente=cliente,
            marca='DJI',
            modelo='Mini 4 Pro',
            numero_serie='DJI-SALTOS-001'
        )

        usuario_tecnico = Usuario.objects.create_user(
            email='tecnico.saltos@example.com',
            password='ClavePrueba123!',
            no_identificacion='0801199900262',
            first_name='Pedro',
            last_name='Martinez'
        )

        tecnico = Tecnico.objects.create(
            usuario=usuario_tecnico,
            especialidad_tecnica='Reparación de drones',
            disponible=True
        )

        orden = OrdenServicio.objects.create(
            equipo=equipo,
            tecnico=tecnico,
            descripcion_problema='Falla en la cámara'
        )

        self.client.force_authenticate(
            user=usuario_tecnico
        )

        url = reverse(
            'orden-cambiar-estado',
            kwargs={'pk': orden.pk}
        )

        estados_invalidos = [
            OrdenServicio.Estado.EN_REPARACION,
            OrdenServicio.Estado.FINALIZADA
        ]

        for nuevo_estado in estados_invalidos:
            with self.subTest(estado=nuevo_estado):

                respuesta = self.client.patch(
                    url,
                    {'estado': nuevo_estado},
                    format='json'
                )

                self.assertEqual(
                    respuesta.status_code,
                    status.HTTP_400_BAD_REQUEST
                )

                orden.refresh_from_db()

                self.assertEqual(
                    orden.estado,
                    OrdenServicio.Estado.RECIBIDA
                )

                self.assertIsNone(
                    orden.fecha_cierre
                )

    def test_no_se_permiten_estados_inexistentes(self):
        Usuario = get_user_model()

        usuario = Usuario.objects.create_user(
            email='usuario.estadoinvalido@example.com',
            password='ClavePrueba123!',
            no_identificacion='0801199900271',
            first_name='Carlos',
            last_name='Lopez'
        )

        self.client.force_authenticate(
            user=usuario
        )

        url = reverse(
            'orden-cambiar-estado',
            kwargs={'pk': 1}
        )

        estados_invalidos = [
            'EN_PROCESO',
            'PENDIENTE',
            'RECHAZADA',
            'COMPLETADA'
        ]

        for estado_invalido in estados_invalidos:
            with self.subTest(estado=estado_invalido):

                respuesta = self.client.patch(
                    url,
                    {'estado': estado_invalido},
                    format='json'
                )

                self.assertEqual(
                    respuesta.status_code,
                    status.HTTP_400_BAD_REQUEST
                )

                self.assertIn(
                    'estado',
                    respuesta.data
                )

    def test_no_se_puede_entregar_orden_sin_finalizar(self):
        Usuario = get_user_model()

        usuario_cliente = Usuario.objects.create_user(
            email='cliente.anticipada@example.com',
            password='ClavePrueba123!',
            no_identificacion='0801199900281',
            first_name='Carlos',
            last_name='Lopez'
        )

        cliente = PerfilCliente.objects.create(
            usuario=usuario_cliente
        )

        equipo = EquipoCliente.objects.create(
            cliente=cliente,
            marca='DJI',
            modelo='Mini 4 Pro',
            numero_serie='DJI-ANTICIPADA-001'
        )

        usuario_admin = Usuario.objects.create_user(
            email='admin.anticipada@example.com',
            password='ClavePrueba123!',
            no_identificacion='0801199900282',
            first_name='Ana',
            last_name='Garcia'
        )

        permiso = Permission.objects.get(
            codename='change_ordenservicio',
            content_type__app_label='reparaciones'
        )

        usuario_admin.user_permissions.add(permiso)

        self.client.force_authenticate(
            user=usuario_admin
        )

        estados_no_finalizados = [
            OrdenServicio.Estado.RECIBIDA,
            OrdenServicio.Estado.EN_DIAGNOSTICO,
            OrdenServicio.Estado.EN_REPARACION
        ]

        for estado_inicial in estados_no_finalizados:
            with self.subTest(estado=estado_inicial):

                orden = OrdenServicio.objects.create(
                    equipo=equipo,
                    descripcion_problema='Falla en la cámara',
                    estado=estado_inicial
                )

                url = reverse(
                    'orden-cambiar-estado',
                    kwargs={'pk': orden.pk}
                )

                respuesta = self.client.patch(
                    url,
                    {'estado': 'ENTREGADA'},
                    format='json'
                )

                self.assertEqual(
                    respuesta.status_code,
                    status.HTTP_400_BAD_REQUEST
                )

                orden.refresh_from_db()

                self.assertEqual(
                    orden.estado,
                    estado_inicial
                )

                self.assertIsNone(
                    orden.fecha_cierre
                )

    def test_tecnico_no_puede_reabrir_orden_cerrada(self):
        from django.utils import timezone

        Usuario = get_user_model()

        usuario_cliente = Usuario.objects.create_user(
            email='cliente.reapertura@example.com',
            password='ClavePrueba123!',
            no_identificacion='0801199900291',
            first_name='Carlos',
            last_name='Lopez'
        )

        cliente = PerfilCliente.objects.create(
            usuario=usuario_cliente
        )

        equipo = EquipoCliente.objects.create(
            cliente=cliente,
            marca='DJI',
            modelo='Mini 4 Pro',
            numero_serie='DJI-REAPERTURA-001'
        )

        usuario_tecnico = Usuario.objects.create_user(
            email='tecnico.reapertura@example.com',
            password='ClavePrueba123!',
            no_identificacion='0801199900292',
            first_name='Pedro',
            last_name='Martinez'
        )

        tecnico = Tecnico.objects.create(
            usuario=usuario_tecnico,
            especialidad_tecnica='Reparación de drones',
            disponible=True
        )

        self.client.force_authenticate(
            user=usuario_tecnico
        )

        estados_cerrados = [
            OrdenServicio.Estado.ENTREGADA,
            OrdenServicio.Estado.CANCELADA
        ]

        for estado_inicial in estados_cerrados:
            with self.subTest(estado=estado_inicial):

                fecha_original = timezone.now()

                orden = OrdenServicio.objects.create(
                    equipo=equipo,
                    tecnico=tecnico,
                    descripcion_problema='Falla en la cámara',
                    estado=estado_inicial,
                    fecha_cierre=fecha_original
                )

                url = reverse(
                    'orden-cambiar-estado',
                    kwargs={'pk': orden.pk}
                )

                respuesta = self.client.patch(
                    url,
                    {'estado': 'EN_DIAGNOSTICO'},
                    format='json'
                )

                self.assertEqual(
                    respuesta.status_code,
                    status.HTTP_400_BAD_REQUEST
                )

                orden.refresh_from_db()

                self.assertEqual(
                    orden.estado,
                    estado_inicial
                )

                self.assertEqual(
                    orden.fecha_cierre,
                    fecha_original
                )

    def test_tecnico_no_puede_repetir_el_mismo_estado(self):
        Usuario = get_user_model()

        usuario_cliente = Usuario.objects.create_user(
            email='cliente.repeticion@example.com',
            password='ClavePrueba123!',
            no_identificacion='0801199900301',
            first_name='Carlos',
            last_name='Lopez'
        )

        cliente = PerfilCliente.objects.create(
            usuario=usuario_cliente
        )

        equipo = EquipoCliente.objects.create(
            cliente=cliente,
            marca='DJI',
            modelo='Mini 4 Pro',
            numero_serie='DJI-REPETICION-001'
        )

        usuario_tecnico = Usuario.objects.create_user(
            email='tecnico.repeticion@example.com',
            password='ClavePrueba123!',
            no_identificacion='0801199900302',
            first_name='Pedro',
            last_name='Martinez'
        )

        tecnico = Tecnico.objects.create(
            usuario=usuario_tecnico,
            especialidad_tecnica='Reparación de drones',
            disponible=True
        )

        orden = OrdenServicio.objects.create(
            equipo=equipo,
            tecnico=tecnico,
            descripcion_problema='Falla en la cámara',
            estado=OrdenServicio.Estado.EN_DIAGNOSTICO
        )

        self.client.force_authenticate(
            user=usuario_tecnico
        )

        url = reverse(
            'orden-cambiar-estado',
            kwargs={'pk': orden.pk}
        )

        respuesta = self.client.patch(
            url,
            {'estado': 'EN_DIAGNOSTICO'},
            format='json'
        )

        self.assertEqual(
            respuesta.status_code,
            status.HTTP_400_BAD_REQUEST
        )

        orden.refresh_from_db()

        self.assertEqual(
            orden.estado,
            OrdenServicio.Estado.EN_DIAGNOSTICO
        )

        self.assertIsNone(
            orden.fecha_cierre
        )

class ValidacionTransicionesModeloTests(TestCase):

    def test_save_rechaza_transicion_invalida(self):
        Usuario = get_user_model()

        # Crear cliente
        usuario_cliente = Usuario.objects.create_user(
            email='cliente.validacionmodelo@example.com',
            password='ClavePrueba123!',
            no_identificacion='0801199900311',
            first_name='Carlos',
            last_name='Lopez'
        )

        cliente = PerfilCliente.objects.create(
            usuario=usuario_cliente
        )

        # Registrar equipo
        equipo = EquipoCliente.objects.create(
            cliente=cliente,
            marca='DJI',
            modelo='Mini 4 Pro',
            numero_serie='DJI-VALIDACION-001'
        )

        # Crear orden en estado RECIBIDA
        orden = OrdenServicio.objects.create(
            equipo=equipo,
            descripcion_problema='Falla en la cámara'
        )

        # Intentar saltar directamente a FINALIZADA
        orden.estado = OrdenServicio.Estado.FINALIZADA

        # El modelo debe rechazar el cambio
        from django.core.exceptions import ValidationError

        with self.assertRaises(ValidationError):
            orden.save()

        # Verificar que PostgreSQL conserva el estado original
        orden.refresh_from_db()

        self.assertEqual(
            orden.estado,
            OrdenServicio.Estado.RECIBIDA
        )

        self.assertIsNone(
            orden.fecha_cierre
        )

    def test_save_permite_transiciones_validas(self):
        Usuario = get_user_model()

        usuario_cliente = Usuario.objects.create_user(
            email='cliente.flujomodelo@example.com',
            password='ClavePrueba123!',
            no_identificacion='0801199900321',
            first_name='Carlos',
            last_name='Lopez'
        )

        cliente = PerfilCliente.objects.create(
            usuario=usuario_cliente
        )

        equipo = EquipoCliente.objects.create(
            cliente=cliente,
            marca='DJI',
            modelo='Mini 4 Pro',
            numero_serie='DJI-FLUJOMODELO-001'
        )

        orden = OrdenServicio.objects.create(
            equipo=equipo,
            descripcion_problema='Falla en la cámara'
        )

        estados_permitidos = [
            OrdenServicio.Estado.EN_DIAGNOSTICO,
            OrdenServicio.Estado.EN_REPARACION,
            OrdenServicio.Estado.FINALIZADA
        ]

        for nuevo_estado in estados_permitidos:
            with self.subTest(estado=nuevo_estado):

                orden.estado = nuevo_estado
                orden.save()

                orden.refresh_from_db()

                self.assertEqual(
                    orden.estado,
                    nuevo_estado
                )

                self.assertIsNone(
                    orden.fecha_cierre
                )



