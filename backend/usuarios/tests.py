
from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.test import TestCase
from django.urls import reverse

from rest_framework import status
from rest_framework.test import APITestCase
from usuarios.models import PerfilCliente, Tecnico, Piloto, Vendedor


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

        self.assertEqual(
            usuario.email,
            "usuario@example.com"
        )

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
        respuesta = self.client.post(
            self.url_login,
            self.credenciales,
            format="json"
        )

        self.assertEqual(
            respuesta.status_code,
            status.HTTP_200_OK
        )

        self.assertIn("access", respuesta.data)
        self.assertIn("refresh", respuesta.data)
        self.assertIn("usuario", respuesta.data)

        self.assertEqual(
            respuesta.data["usuario"]["email"],
            "pruebas@example.com"
        )

        self.assertNotIn(
            "password",
            respuesta.data["usuario"]
        )

    def test_login_contrasena_incorrecta(self):
        respuesta = self.client.post(
            self.url_login,
            {
                "email": "pruebas@example.com",
                "password": "Incorrecta123!"
            },
            format="json"
        )

        self.assertEqual(
            respuesta.status_code,
            status.HTTP_401_UNAUTHORIZED
        )

    def test_login_correo_inexistente(self):
        respuesta = self.client.post(
            self.url_login,
            {
                "email": "noexiste@example.com",
                "password": "ClavePrueba123!"
            },
            format="json"
        )

        self.assertEqual(
            respuesta.status_code,
            status.HTTP_401_UNAUTHORIZED
        )

    def test_login_usuario_inactivo(self):
        self.usuario.estado_cuenta = "I"
        self.usuario.save()

        respuesta = self.client.post(
            self.url_login,
            self.credenciales,
            format="json"
        )

        self.assertEqual(
            respuesta.status_code,
            status.HTTP_401_UNAUTHORIZED
        )

    def test_perfil_sin_autenticacion(self):
        respuesta = self.client.get(self.url_perfil)

        self.assertIn(
            respuesta.status_code,
            [
                status.HTTP_401_UNAUTHORIZED,
                status.HTTP_403_FORBIDDEN
            ]
        )

    def test_perfil_con_token_valido(self):
        login = self.client.post(
            self.url_login,
            self.credenciales,
            format="json"
        )

        self.assertEqual(
            login.status_code,
            status.HTTP_200_OK
        )

        token = login.data["access"]

        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {token}"
        )

        respuesta = self.client.get(self.url_perfil)

        self.assertEqual(
            respuesta.status_code,
            status.HTTP_200_OK
        )

        self.assertEqual(
            respuesta.data["email"],
            "pruebas@example.com"
        )

        self.assertNotIn("password", respuesta.data)

    def test_refrescar_token(self):
        login = self.client.post(
            self.url_login,
            self.credenciales,
            format="json"
        )

        self.assertEqual(
            login.status_code,
            status.HTTP_200_OK
        )

        refresh = login.data["refresh"]

        respuesta = self.client.post(
            self.url_refrescar,
            {"refresh": refresh},
            format="json"
        )

        self.assertEqual(
            respuesta.status_code,
            status.HTTP_200_OK
        )

        self.assertIn("access", respuesta.data)

    # --------------------------------------------------------
    # PRUEBAS ADICIONALES DE SEGURIDAD
    # --------------------------------------------------------

    def test_perfil_con_token_invalido(self):
        self.client.credentials(
            HTTP_AUTHORIZATION="Bearer token_invalido"
        )

        respuesta = self.client.get(self.url_perfil)

        self.assertEqual(
            respuesta.status_code,
            status.HTTP_401_UNAUTHORIZED
        )

    def test_refrescar_token_invalido(self):
        respuesta = self.client.post(
            self.url_refrescar,
            {"refresh": "token_invalido"},
            format="json"
        )

        self.assertEqual(
            respuesta.status_code,
            status.HTTP_401_UNAUTHORIZED
        )

        self.assertNotIn("access", respuesta.data)

    def test_proteccion_datos_sensibles(self):
        login = self.client.post(
            self.url_login,
            self.credenciales,
            format="json"
        )

        self.assertEqual(
            login.status_code,
            status.HTTP_200_OK
        )

        datos_usuario = login.data["usuario"]

        campos_prohibidos = [
            "password",
            "is_superuser",
            "user_permissions",
            "groups",
            "last_login"
        ]

        for campo in campos_prohibidos:
            with self.subTest(campo=campo):
                self.assertNotIn(campo, datos_usuario)

        token = login.data["access"]

        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {token}"
        )

        perfil = self.client.get(self.url_perfil)

        self.assertEqual(
            perfil.status_code,
            status.HTTP_200_OK
        )

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
                PerfilCliente.objects.create(
                    usuario=usuario,
                    saldo_puntos=-10
                )

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
                Tecnico.objects.create(
                    usuario=usuario,
                    especialidad_tecnica=""
                )

    def test_cliente_permite_puntos_validos(self):
        usuario = self.crear_usuario(5)

        cliente = PerfilCliente.objects.create(
            usuario=usuario,
            saldo_puntos=100
        )

        self.assertEqual(cliente.saldo_puntos, 100)
