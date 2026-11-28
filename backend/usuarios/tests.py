import re

from django.contrib.auth import get_user_model
from django.core import mail
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import IntegrityError, transaction
from django.test import TestCase
from django.urls import reverse

from rest_framework import status
from rest_framework.test import APITestCase
from usuarios.models import PerfilCliente, Tecnico, Piloto, Vendedor, PasswordResetCode


Usuario = get_user_model()


# ============================================================
# 1. PRUEBAS DEL MODELO USUARIO
# ============================================================

class UsuarioModelTests(TestCase):

    def test_crear_usuario(self):
        usuario = Usuario.objects.create_user(
            email="cliente@example.com",
            password="ClavePrueba123!",
            no_identificacion="0801199900001",
            first_name="Carlos",
            last_name="Lopez"
        )

        self.assertEqual(usuario.email, "cliente@example.com")
        self.assertEqual(usuario.first_name, "Carlos")
        self.assertTrue(usuario.check_password("ClavePrueba123!"))

    def test_correo_obligatorio(self):
        with self.assertRaises(ValueError):
            Usuario.objects.create_user(
                email="",
                password="ClavePrueba123!",
                no_identificacion="0801199900002"
            )

    def test_usuario_activo(self):
        usuario = Usuario.objects.create_user(
            email="activo@example.com",
            password="ClavePrueba123!",
            no_identificacion="0801199900003",
            estado_cuenta="A"
        )

        self.assertTrue(usuario.is_active)

    def test_usuario_inactivo(self):
        usuario = Usuario.objects.create_user(
            email="inactivo@example.com",
            password="ClavePrueba123!",
            no_identificacion="0801199900004",
            estado_cuenta="I"
        )

        self.assertFalse(usuario.is_active)

    def test_crear_superusuario(self):
        usuario = Usuario.objects.create_superuser(
            email="admin@example.com",
            password="ClavePrueba123!",
            no_identificacion="0801199900005"
        )

        self.assertTrue(usuario.is_staff)
        self.assertTrue(usuario.is_superuser)

    def test_correo_duplicado(self):
        Usuario.objects.create_user(
            email="duplicado@example.com",
            password="ClavePrueba123!",
            no_identificacion="0801199900020"
        )

        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Usuario.objects.create_user(
                    email="duplicado@example.com",
                    password="ClavePrueba123!",
                    no_identificacion="0801199900021"
                )

    def test_identificacion_duplicada(self):
        Usuario.objects.create_user(
            email="primero@example.com",
            password="ClavePrueba123!",
            no_identificacion="0801199900022"
        )

        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Usuario.objects.create_user(
                    email="segundo@example.com",
                    password="ClavePrueba123!",
                    no_identificacion="0801199900022"
                )

    def test_normalizacion_correo(self):
        usuario = Usuario.objects.create_user(
            email="usuario@EXAMPLE.COM",
            password="ClavePrueba123!",
            no_identificacion="0801199900023"
        )

        self.assertEqual(usuario.email, "usuario@example.com")

    def test_cambio_estado_cuenta(self):
        usuario = Usuario.objects.create_user(
            email="estado@example.com",
            password="ClavePrueba123!",
            no_identificacion="0801199900024"
        )

        self.assertTrue(usuario.is_active)

        usuario.estado_cuenta = "S"
        usuario.save()
        self.assertFalse(usuario.is_active)

        usuario.estado_cuenta = "A"
        usuario.save()
        self.assertTrue(usuario.is_active)


# ============================================================
# 2. PRUEBAS DE AUTENTICACION Y SEGURIDAD
# ============================================================

class AutenticacionAPITests(APITestCase):

    def setUp(self):
        self.usuario = Usuario.objects.create_user(
            email="pruebas@example.com",
            password="ClavePrueba123!",
            no_identificacion="0801199900010",
            first_name="Maria",
            last_name="Garcia"
        )

        self.url_login = reverse("login")
        self.url_perfil = reverse("perfil")
        self.url_refrescar = reverse("token_refrescar")

        self.credenciales = {
            "email": "pruebas@example.com",
            "password": "ClavePrueba123!"
        }

    def test_login_correcto(self):
        respuesta = self.client.post(self.url_login, self.credenciales, format="json")

        self.assertEqual(respuesta.status_code, status.HTTP_200_OK)
        self.assertIn("access", respuesta.data)
        self.assertIn("refresh", respuesta.data)
        self.assertIn("usuario", respuesta.data)
        self.assertEqual(respuesta.data["usuario"]["email"], "pruebas@example.com")
        self.assertNotIn("password", respuesta.data["usuario"])

    def test_login_contrasena_incorrecta(self):
        respuesta = self.client.post(
            self.url_login,
            {"email": "pruebas@example.com", "password": "Incorrecta123!"},
            format="json"
        )

        self.assertEqual(respuesta.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_correo_inexistente(self):
        respuesta = self.client.post(
            self.url_login,
            {"email": "noexiste@example.com", "password": "ClavePrueba123!"},
            format="json"
        )

        self.assertEqual(respuesta.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_usuario_inactivo(self):
        self.usuario.estado_cuenta = "I"
        self.usuario.save()

        respuesta = self.client.post(self.url_login, self.credenciales, format="json")

        self.assertEqual(respuesta.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_perfil_sin_autenticacion(self):
        respuesta = self.client.get(self.url_perfil)

        self.assertIn(
            respuesta.status_code,
            [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]
        )

    def test_perfil_con_token_valido(self):
        login = self.client.post(self.url_login, self.credenciales, format="json")
        self.assertEqual(login.status_code, status.HTTP_200_OK)

        token = login.data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

        respuesta = self.client.get(self.url_perfil)

        self.assertEqual(respuesta.status_code, status.HTTP_200_OK)
        self.assertEqual(respuesta.data["email"], "pruebas@example.com")
        self.assertNotIn("password", respuesta.data)

    def test_refrescar_token(self):
        login = self.client.post(self.url_login, self.credenciales, format="json")
        self.assertEqual(login.status_code, status.HTTP_200_OK)

        refresh = login.data["refresh"]
        respuesta = self.client.post(self.url_refrescar, {"refresh": refresh}, format="json")

        self.assertEqual(respuesta.status_code, status.HTTP_200_OK)
        self.assertIn("access", respuesta.data)

    def test_perfil_con_token_invalido(self):
        self.client.credentials(HTTP_AUTHORIZATION="Bearer token_invalido")
        respuesta = self.client.get(self.url_perfil)

        self.assertEqual(respuesta.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_refrescar_token_invalido(self):
        respuesta = self.client.post(
            self.url_refrescar, {"refresh": "token_invalido"}, format="json"
        )

        self.assertEqual(respuesta.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertNotIn("access", respuesta.data)

    def test_proteccion_datos_sensibles(self):
        login = self.client.post(self.url_login, self.credenciales, format="json")
        self.assertEqual(login.status_code, status.HTTP_200_OK)

        datos_usuario = login.data["usuario"]
        campos_prohibidos = [
            "password", "is_superuser", "user_permissions", "groups", "last_login"
        ]

        for campo in campos_prohibidos:
            with self.subTest(campo=campo):
                self.assertNotIn(campo, datos_usuario)

        token = login.data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        perfil = self.client.get(self.url_perfil)
        self.assertEqual(perfil.status_code, status.HTTP_200_OK)

        for campo in campos_prohibidos:
            with self.subTest(campo=campo):
                self.assertNotIn(campo, perfil.data)


# ============================================================
# 3. PRUEBAS DE RESTRICCIONES DE LOS PERFILES
# ============================================================

class PerfilesModelTests(TestCase):

    def crear_usuario(self, numero):
        return Usuario.objects.create_user(
            email=f"perfil{numero}@example.com",
            password="ClavePrueba123!",
            no_identificacion=f"08011999{numero:05d}",
            first_name="Usuario",
            last_name="Prueba"
        )

    def test_cliente_no_permite_puntos_negativos(self):
        usuario = self.crear_usuario(1)

        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                PerfilCliente.objects.create(usuario=usuario, saldo_puntos=-10)

    def test_piloto_no_permite_horas_negativas(self):
        usuario = self.crear_usuario(2)

        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Piloto.objects.create(
                    usuario=usuario,
                    numero_licencia_aeronautica="LIC-001",
                    horas_vuelo_acumuladas=-5
                )

    def test_vendedor_no_permite_comision_superior_a_100(self):
        usuario = self.crear_usuario(3)

        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Vendedor.objects.create(
                    usuario=usuario,
                    rtn_empresa="RTN-001",
                    nombre_comercial="Empresa Prueba",
                    comision_pactada=101
                )

    def test_tecnico_no_permite_especialidad_vacia(self):
        usuario = self.crear_usuario(4)

        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Tecnico.objects.create(usuario=usuario, especialidad_tecnica="")

    def test_cliente_permite_puntos_validos(self):
        usuario = self.crear_usuario(5)
        cliente = PerfilCliente.objects.create(usuario=usuario, saldo_puntos=100)
        self.assertEqual(cliente.saldo_puntos, 100)


# ============================================================
# 4. PRUEBAS DEL REGISTRO PÚBLICO
# ============================================================

class RegistroAPITest(APITestCase):

    def setUp(self):
        self.url = reverse('registro')
        self.datos = {
            'email': 'nuevo@nexus.com',
            'password': 'Drones-2026!',
            'first_name': 'Ana',
            'last_name': 'López',
            'no_identificacion': '0801199900300',
            'telefono': '9999-0000',
        }

    def registrar(self, **cambios):
        return self.client.post(self.url, {**self.datos, **cambios}, format='json')

    def test_registro_exitoso_crea_cliente_con_perfil(self):
        respuesta = self.registrar()

        self.assertEqual(respuesta.status_code, status.HTTP_201_CREATED)
        usuario = Usuario.objects.get(email='nuevo@nexus.com')
        self.assertTrue(PerfilCliente.objects.filter(usuario=usuario).exists())
        self.assertEqual(respuesta.data['usuario']['rol'], 'cliente')

    def test_respuesta_incluye_tokens_y_no_la_contrasena(self):
        respuesta = self.registrar()

        self.assertIn('access', respuesta.data)
        self.assertIn('refresh', respuesta.data)
        self.assertNotIn('password', respuesta.data['usuario'])

    def test_no_se_puede_registrar_como_admin(self):
        respuesta = self.registrar(role='admin', is_staff=True, is_superuser=True)

        self.assertEqual(respuesta.status_code, status.HTTP_201_CREATED)
        usuario = Usuario.objects.get(email='nuevo@nexus.com')
        self.assertFalse(usuario.is_staff)
        self.assertFalse(usuario.is_superuser)
        self.assertEqual(usuario.rol, 'cliente')

    def test_no_se_puede_registrar_como_otro_rol(self):
        for rol in ['piloto', 'tecnico', 'vendedor']:
            with self.subTest(rol=rol):
                respuesta = self.registrar(
                    email=f'{rol}@nexus.com', no_identificacion=f'0801-{rol}', role=rol
                )
                self.assertEqual(respuesta.status_code, status.HTTP_201_CREATED)
                self.assertEqual(respuesta.data['usuario']['rol'], 'cliente')

        self.assertFalse(Piloto.objects.exists())
        self.assertFalse(Tecnico.objects.exists())
        self.assertFalse(Vendedor.objects.exists())

    def test_contrasena_debil_rechazada(self):
        for clave in ['12345678', 'abc', 'password']:
            with self.subTest(clave=clave):
                respuesta = self.registrar(password=clave)
                self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)
                self.assertIn('password', respuesta.data)

        self.assertFalse(Usuario.objects.exists())

    def test_correo_repetido(self):
        self.registrar()
        respuesta = self.registrar(no_identificacion='0801199900301')

        self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', respuesta.data)

    def test_identificacion_repetida(self):
        self.registrar()
        respuesta = self.registrar(email='otro@nexus.com')

        self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('no_identificacion', respuesta.data)

    def test_campos_obligatorios(self):
        respuesta = self.client.post(self.url, {}, format='json')

        self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)
        for campo in ['email', 'password', 'first_name', 'last_name', 'no_identificacion']:
            self.assertIn(campo, respuesta.data)

    def test_token_del_registro_sirve_para_entrar(self):
        respuesta = self.registrar()
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {respuesta.data['access']}")

        perfil = self.client.get(reverse('perfil'))
        self.assertEqual(perfil.status_code, status.HTTP_200_OK)
        self.assertEqual(perfil.data['email'], 'nuevo@nexus.com')

    def test_registro_funciona_con_token_viejo(self):
        self.client.credentials(HTTP_AUTHORIZATION='Bearer token_invalido')
        respuesta = self.registrar()
        self.assertEqual(respuesta.status_code, status.HTTP_201_CREATED)


# ============================================================
# 5. PRUEBAS DEL ROL CALCULADO
# ============================================================

class RolUsuarioTests(APITestCase):

    def crear_usuario(self, numero, **extra):
        return Usuario.objects.create_user(
            email=f'rol{numero}@nexus.com',
            password='Drones-2026!',
            no_identificacion=f'08011999{numero:05d}',
            first_name='Prueba',
            last_name='Rol',
            **extra,
        )

    def rol_de(self, usuario):
        return Usuario.objects.get(pk=usuario.pk).rol

    def test_usuario_sin_perfil_es_cliente(self):
        self.assertEqual(self.rol_de(self.crear_usuario(1)), 'cliente')

    def test_superusuario_es_admin(self):
        admin = Usuario.objects.create_superuser(
            email='admin@nexus.com', password='Drones-2026!',
            no_identificacion='0801199900900', first_name='Admin', last_name='Nexus',
        )
        self.assertEqual(self.rol_de(admin), 'admin')

    def test_piloto(self):
        usuario = self.crear_usuario(2)
        Piloto.objects.create(usuario=usuario, numero_licencia_aeronautica='LIC-0001')
        self.assertEqual(self.rol_de(usuario), 'piloto')

    def test_tecnico(self):
        usuario = self.crear_usuario(3)
        Tecnico.objects.create(usuario=usuario, especialidad_tecnica='Motores')
        self.assertEqual(self.rol_de(usuario), 'tecnico')

    def test_vendedor(self):
        usuario = self.crear_usuario(4)
        Vendedor.objects.create(
            usuario=usuario, rtn_empresa='08011999000001', nombre_comercial='DronShop'
        )
        self.assertEqual(self.rol_de(usuario), 'vendedor')

    def test_login_devuelve_el_rol(self):
        usuario = self.crear_usuario(5)
        Piloto.objects.create(usuario=usuario, numero_licencia_aeronautica='LIC-0002')

        respuesta = self.client.post(
            reverse('login'),
            {'email': 'rol5@nexus.com', 'password': 'Drones-2026!'},
            format='json',
        )
        self.assertEqual(respuesta.status_code, status.HTTP_200_OK)
        self.assertEqual(respuesta.data['usuario']['rol'], 'piloto')


# ============================================================
# 6. PRUEBAS DE EDICIÓN DEL PERFIL
# ============================================================

class PerfilAPITest(APITestCase):
    def setUp(self):
        self.url = reverse('perfil')
        self.usuario = Usuario.objects.create_user(
            email='perfil@nexus.com',
            password='Drones-2026!',
            no_identificacion='0801199900500',
            first_name='Ana',
            last_name='López',
        )

        PerfilCliente.objects.create(usuario=self.usuario)
        self.client.force_authenticate(user=self.usuario)

    def test_ver_perfil(self):
        respuesta = self.client.get(self.url)

        self.assertEqual(respuesta.status_code, status.HTTP_200_OK)
        self.assertEqual(respuesta.data['email'], 'perfil@nexus.com')
        self.assertEqual(respuesta.data['rol'], 'cliente')
        self.assertIn('fecha_nacimiento', respuesta.data)
        self.assertIn('date_joined', respuesta.data)

    def test_perfil_requiere_sesion(self):
        self.client.force_authenticate(user=None)

        self.assertEqual(self.client.get(self.url).status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(
            self.client.patch(self.url, {'telefono': '1'}, format='json').status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_actualizar_datos_personales(self):
        respuesta = self.client.patch(self.url, {
            'first_name': 'Andrea',
            'telefono': '9999-1111',
            'fecha_nacimiento': '23-05-2000',
        }, format='json')

        self.assertEqual(respuesta.status_code, status.HTTP_200_OK)
        self.usuario.refresh_from_db()
        self.assertEqual(self.usuario.first_name, 'Andrea')
        self.assertEqual(self.usuario.telefono, '9999-1111')
        self.assertEqual(str(self.usuario.fecha_nacimiento), '2000-05-23')
        self.assertEqual(self.usuario.last_name, 'López')

    def test_no_se_pueden_cambiar_campos_protegidos(self):
        respuesta = self.client.patch(self.url, {
            'email': 'hacker@x.com',
            'no_identificacion': '0000000000000',
            'is_staff': True,
            'is_superuser': True,
            'estado_cuenta': 'B',
        }, format='json')

        self.assertEqual(respuesta.status_code, status.HTTP_200_OK)
        self.usuario.refresh_from_db()
        self.assertEqual(self.usuario.email, 'perfil@nexus.com')
        self.assertEqual(self.usuario.no_identificacion, '0801199900500')
        self.assertFalse(self.usuario.is_staff)
        self.assertFalse(self.usuario.is_superuser)
        self.assertEqual(self.usuario.estado_cuenta, 'A')

    def test_datos_invalidos(self):
        casos = {
            'first_name': '',
            'telefono': '1' * 21,
            'fecha_nacimiento': '2000-13-45',
        }
        for campo, valor in casos.items():
            with self.subTest(campo=campo):
                respuesta = self.client.patch(self.url, {campo: valor}, format='json')
                self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)
                self.assertIn(campo, respuesta.data)

    def test_put_no_permitido(self):
        respuesta = self.client.put(self.url, {'first_name': 'X'}, format='json')
        self.assertEqual(respuesta.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)


# ============================================================
# 7. PRUEBAS DE CAMBIO DE CONTRASEÑA
# ============================================================

class CambiarPasswordAPITests(APITestCase):

    def setUp(self):
        self.url = reverse('cambiar-password')
        self.usuario = Usuario.objects.create_user(
            email='clave@nexus.com',
            password='Drones-2026!',
            no_identificacion='0801199900600',
            first_name='Luis',
            last_name='Pérez',
        )
        self.client.force_authenticate(user=self.usuario)

    def cambiar(self, actual, nueva):
        return self.client.post(
            self.url,
            {'password_actual': actual, 'password_nueva': nueva},
            format='json',
        )

    def test_requiere_sesion(self):
        self.client.force_authenticate(user=None)
        respuesta = self.cambiar('Drones-2026!', 'Helices-2027!')
        self.assertEqual(respuesta.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_contrasena_actual_incorrecta(self):
        respuesta = self.cambiar('incorrecta', 'Helices-2027!')

        self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password_actual', respuesta.data)
        self.usuario.refresh_from_db()
        self.assertTrue(self.usuario.check_password('Drones-2026!'))

    def test_contrasena_nueva_debil(self):
        respuesta = self.cambiar('Drones-2026!', '12345678')

        self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)
        mensajes = respuesta.data['password_nueva']
        self.assertTrue(all(len(m) > 15 for m in mensajes))
        self.assertNotIn('required', mensajes)
        self.usuario.refresh_from_db()
        self.assertTrue(self.usuario.check_password('Drones-2026!'))

    def test_campos_obligatorios(self):
        respuesta = self.client.post(self.url, {}, format='json')

        self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password_actual', respuesta.data)
        self.assertIn('password_nueva', respuesta.data)

    def test_cambio_exitoso_y_login_con_la_nueva(self):
        respuesta = self.cambiar('Drones-2026!', 'Helices-2027!')
        self.assertEqual(respuesta.status_code, status.HTTP_200_OK)

        self.usuario.refresh_from_db()
        self.assertTrue(self.usuario.check_password('Helices-2027!'))
        self.assertFalse(self.usuario.check_password('Drones-2026!'))

        self.client.force_authenticate(user=None)
        login = self.client.post(
            reverse('login'),
            {'email': 'clave@nexus.com', 'password': 'Helices-2027!'},
            format='json',
        )
        self.assertEqual(login.status_code, status.HTTP_200_OK)


# ============================================================
# 8. PRUEBAS DE RECUPERACIÓN DE CONTRASEÑA
# ============================================================

class PasswordResetAPITests(APITestCase):

    def setUp(self):
        self.usuario = Usuario.objects.create_user(
            email='reset@nexus.com',
            password='Drones-2026!',
            no_identificacion='0801199900700',
            first_name='Reset',
            last_name='User',
        )
        self.url_request = reverse('password_reset_request')
        self.url_confirm = reverse('password_reset_confirm')

    def _obtener_codigo(self):
        return re.search(r'(\d{6})', mail.outbox[-1].body).group(1)

    def test_request_envia_correo_con_codigo(self):
        respuesta = self.client.post(
            self.url_request, {'email': 'reset@nexus.com'}, format='json'
        )
        self.assertEqual(respuesta.status_code, status.HTTP_200_OK)
        self.assertEqual(len(mail.outbox), 1)
        self.assertRegex(mail.outbox[0].body, r'\d{6}')
        self.assertTrue(PasswordResetCode.objects.filter(usuario=self.usuario).exists())

    def test_request_email_inexistente_no_revela(self):
        respuesta = self.client.post(
            self.url_request, {'email': 'nadie@x.com'}, format='json'
        )
        self.assertEqual(respuesta.status_code, status.HTTP_200_OK)
        self.assertEqual(len(mail.outbox), 0)
        self.assertFalse(PasswordResetCode.objects.exists())

    def test_request_invalida_codigos_previos(self):
        self.client.post(self.url_request, {'email': 'reset@nexus.com'}, format='json')
        self.client.post(self.url_request, {'email': 'reset@nexus.com'}, format='json')

        activos = PasswordResetCode.objects.filter(usuario=self.usuario, is_used=False)
        self.assertEqual(activos.count(), 1)

    def test_confirm_cambia_password(self):
        self.client.post(self.url_request, {'email': 'reset@nexus.com'}, format='json')
        codigo = self._obtener_codigo()

        respuesta = self.client.post(self.url_confirm, {
            'email': 'reset@nexus.com',
            'code': codigo,
            'new_password': 'Helices-2027!',
        }, format='json')

        self.assertEqual(respuesta.status_code, status.HTTP_200_OK)
        self.usuario.refresh_from_db()
        self.assertTrue(self.usuario.check_password('Helices-2027!'))

    def test_confirm_marca_todos_los_codigos_como_usados(self):
        self.client.post(self.url_request, {'email': 'reset@nexus.com'}, format='json')
        codigo = self._obtener_codigo()

        self.client.post(self.url_confirm, {
            'email': 'reset@nexus.com',
            'code': codigo,
            'new_password': 'Helices-2027!',
        }, format='json')

        self.assertFalse(
            PasswordResetCode.objects.filter(usuario=self.usuario, is_used=False).exists()
        )

    def test_confirm_codigo_invalido(self):
        self.client.post(self.url_request, {'email': 'reset@nexus.com'}, format='json')
        respuesta = self.client.post(self.url_confirm, {
            'email': 'reset@nexus.com',
            'code': '000000',
            'new_password': 'Helices-2027!',
        }, format='json')
        self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('code', respuesta.data)


# ============================================================
# 9. PRUEBAS DE REGLA PILOTO ≠ ADMIN
# ============================================================

class PilotoAdminTests(TestCase):

    def setUp(self):
        self.usuario_staff = Usuario.objects.create_superuser(
            email='admin@x.com', password='Clave-2026!', no_identificacion='ADMIN-01',
            first_name='Admin', last_name='X',
        )
        self.usuario_piloto = Usuario.objects.create_user(
            email='pilot@x.com', password='Clave-2026!', no_identificacion='PILOT-01',
            first_name='Pilot', last_name='Y',
        )

    def test_piloto_no_puede_crearse_para_admin(self):
        with self.assertRaises(DjangoValidationError):
            Piloto.objects.create(
                usuario=self.usuario_staff, numero_licencia_aeronautica='LIC-ADMIN'
            )

    def test_admin_no_puede_obtener_perfil_piloto(self):
        Piloto.objects.create(
            usuario=self.usuario_piloto, numero_licencia_aeronautica='LIC-PILOT'
        )
        self.usuario_piloto.is_staff = True
        with self.assertRaises(DjangoValidationError):
            self.usuario_piloto.save()

    def test_piloto_sin_staff_funciona(self):
        piloto = Piloto.objects.create(
            usuario=self.usuario_piloto, numero_licencia_aeronautica='LIC-OK'
        )
        self.assertEqual(piloto.usuario.rol, 'piloto')

    def test_admin_sin_perfil_piloto_funciona(self):
        self.assertEqual(self.usuario_staff.rol, 'admin')

    def test_piloto_clean_detecta_staff(self):
        Usuario.objects.filter(pk=self.usuario_piloto.pk).update(is_staff=True)
        piloto = Piloto(
            usuario_id=self.usuario_piloto.pk, numero_licencia_aeronautica='LIC-CLEAN'
        )
        with self.assertRaises(DjangoValidationError):
            piloto.clean()