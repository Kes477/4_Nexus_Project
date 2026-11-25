from types import SimpleNamespace
from unittest import TestCase
from unittest.mock import Mock

from rest_framework.exceptions import PermissionDenied

from .politicas import (
    PoliticaPilotoAsignado,
    PoliticaPermisoAdministrativo,
    SelectorPoliticas,
)

class PatronesAutorizacionTests(TestCase):

    def test_piloto_autorizado(self):
        # Comprueba que el piloto asignado puede modificar la misión.
        usuario = SimpleNamespace(perfil_piloto=SimpleNamespace(pk=8))
        mision = SimpleNamespace(piloto_id=8)

        politica = PoliticaPilotoAsignado()
        resultado = politica.autorizar(usuario, mision)

        self.assertIsNone(resultado)

    def test_piloto_no_autorizado(self):
        # Comprueba que un piloto diferente no puede modificar la misión.
        usuario = SimpleNamespace(perfil_piloto=SimpleNamespace(pk=9))
        mision = SimpleNamespace(piloto_id=8)

        politica = PoliticaPilotoAsignado()

        with self.assertRaises(PermissionDenied):
            politica.autorizar(usuario, mision)

    def test_piloto_sin_perfil(self):
        # Comprueba que un usuario sin perfil de piloto es rechazado.
        usuario = SimpleNamespace()
        mision = SimpleNamespace(piloto_id=8)

        politica = PoliticaPilotoAsignado()

        with self.assertRaises(PermissionDenied):
            politica.autorizar(usuario, mision)

    def test_administrador_con_permiso(self):
        # Comprueba que un administrador puede modificar cualquier misión.
        usuario = Mock()
        usuario.is_staff = True

        politica = PoliticaPermisoAdministrativo()
        resultado = politica.autorizar(usuario, None)

        self.assertIsNone(resultado)

    def test_administrador_sin_permiso(self):
        # Comprueba que un usuario normal es rechazado por la política administrativa.
        usuario = Mock()
        usuario.is_staff = False

        politica = PoliticaPermisoAdministrativo()

        with self.assertRaises(PermissionDenied):
            politica.autorizar(usuario, None)

    def test_selector_politicas(self):
        # Comprueba que el selector devuelve la estrategia correcta según el usuario.
        usuario_piloto = Mock()
        usuario_piloto.is_staff = False

        usuario_admin = Mock()
        usuario_admin.is_staff = True

        self.assertIsInstance(
            SelectorPoliticas.obtener(usuario_piloto, "EN_CURSO"),
            PoliticaPilotoAsignado
        )

        self.assertIsInstance(
            SelectorPoliticas.obtener(usuario_admin, "EN_CURSO"),
            PoliticaPermisoAdministrativo
        )