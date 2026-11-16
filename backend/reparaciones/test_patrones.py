
"""
MÓDULO: REPARACIONES
ARCHIVO: test_patrones.py

OBJETIVO:
    Verificar el funcionamiento de los patrones de diseño
    Strategy y Factory Method utilizados para autorizar
    cambios de estado en órdenes de reparación.

PRINCIPIOS SOLID EVALUADOS:
    SRP: Responsabilidad única.
    OCP: Abierto/Cerrado.
    LSP: Sustitución de Liskov.
    ISP: Segregación de interfaces.
    DIP: Inversión de dependencias.

Estas pruebas comprueban los contratos y comportamientos
de las políticas de autorización, pero no demuestran por
sí solas el cumplimiento completo de todos los principios.
"""

from types import SimpleNamespace
from unittest import TestCase
from unittest.mock import Mock

from rest_framework.exceptions import PermissionDenied

from .politicas import (
    AutorizarCambioEstado,
    CreadorPolitica,
    CreadorPoliticaTecnica,
    CreadorPoliticaAdministrativa,
    PoliticaTecnicoAsignado,
    PoliticaPermisoAdministrativo,
    SelectorPoliticas,
)

class PatronesAutorizacionTests(TestCase):
    """
    Pruebas unitarias de las políticas de autorización.

    No requieren crear registros en la base de datos.
    """

    # ======================================================
    # PRUEBA 1: FACTORY METHOD
    # ======================================================

    def test_factory_method(self):
        """
        Comprueba que el creador concreto implementa
        el contrato del creador abstracto y devuelve
        una estrategia válida.
        """

        creador = CreadorPoliticaTecnica()

        self.assertIsInstance(
            creador,
            CreadorPolitica
        )

        politica = creador.crear_politica()

        self.assertIsInstance(
            politica,
            AutorizarCambioEstado
        )

        self.assertIsInstance(
            politica,
            PoliticaTecnicoAsignado
        )

    # ======================================================
    # PRUEBA 2: SELECCIÓN DE ESTRATEGIA TÉCNICA
    # ======================================================

    def test_selector_tecnico(self):
        """
        Comprueba que un estado técnico selecciona
        la estrategia de autorización correspondiente.
        """

        politica = SelectorPoliticas.obtener(
            "EN_REPARACION"
        )

        self.assertIsInstance(
            politica,
            PoliticaTecnicoAsignado
        )

    # ======================================================
    # PRUEBA 3: SELECCIÓN DE ESTRATEGIA ADMINISTRATIVA
    # ======================================================

    def test_selector_administrativo(self):
        """
        Comprueba que un estado administrativo selecciona
        la estrategia de autorización correspondiente.
        """

        politica = SelectorPoliticas.obtener(
            "ENTREGADA"
        )

        self.assertIsInstance(
            politica,
            PoliticaPermisoAdministrativo
        )

        creador = CreadorPoliticaAdministrativa()

        self.assertIsInstance(
            creador.crear_politica(),
            PoliticaPermisoAdministrativo
        )

    # ======================================================
    # PRUEBA 4: TÉCNICO AUTORIZADO
    # ======================================================

    def test_tecnico_autorizado(self):
        """
        Comprueba que el técnico asignado puede
        autorizar la operación.
        """

        usuario = SimpleNamespace(
            perfil_tecnico=SimpleNamespace(pk=8)
        )

        orden = SimpleNamespace(
            tecnico_id=8
        )

        politica = PoliticaTecnicoAsignado()

        resultado = politica.autorizar(
            usuario,
            orden
        )

        self.assertIsNone(resultado)

    # ======================================================
    # PRUEBA 5: TÉCNICO NO AUTORIZADO
    # ======================================================

    def test_tecnico_no_autorizado(self):
        """
        Comprueba que un técnico diferente del asignado
        no puede realizar la operación.
        """

        usuario = SimpleNamespace(
            perfil_tecnico=SimpleNamespace(pk=9)
        )

        orden = SimpleNamespace(
            tecnico_id=8
        )

        politica = PoliticaTecnicoAsignado()

        with self.assertRaises(PermissionDenied):
            politica.autorizar(
                usuario,
                orden
            )

    # ======================================================
    # PRUEBA 6: ADMINISTRADOR SIN PERMISO
    # ======================================================

    def test_administrador_sin_permiso(self):
        """
        Comprueba que un usuario sin permiso
        de modificación no puede cerrar órdenes.
        """

        usuario = Mock()

        usuario.has_perm.return_value = False

        politica = PoliticaPermisoAdministrativo()

        with self.assertRaises(PermissionDenied):
            politica.autorizar(
                usuario,
                None
            )

        usuario.has_perm.assert_called_once_with(
            "reparaciones.change_ordenservicio"
        )

    # ======================================================
    # PRUEBA 7: ADMINISTRADOR CON PERMISO
    # ======================================================

    def test_administrador_con_permiso(self):
        """
        Comprueba que un usuario con permiso
        de modificación supera la autorización.

        El método autorizar() debe finalizar sin
        lanzar excepciones y devolver None.
        """

        usuario = Mock()

        usuario.has_perm.return_value = True

        politica = PoliticaPermisoAdministrativo()

        resultado = politica.autorizar(
            usuario,
            None
        )

        self.assertIsNone(resultado)

        usuario.has_perm.assert_called_once_with(
            "reparaciones.change_ordenservicio"
        )