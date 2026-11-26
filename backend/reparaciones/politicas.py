
"""
Patrones GoF: Strategy y Factory Method.

SOLID:
SRP: cada política tiene una responsabilidad.
OCP: pueden añadirse nuevas políticas.
LSP: todas respetan el mismo contrato.
ISP: la interfaz solo exige autorizar().
DIP: la vista utiliza la abstracción de autorización.
"""

from abc import ABC, abstractmethod

from rest_framework.exceptions import PermissionDenied

from .models import OrdenServicio

# INTERFAZ - ISP Y DIP
class AutorizarCambioEstado(ABC):

    @abstractmethod
    def autorizar(self, usuario, orden):
        """Comprueba si el usuario puede realizar la operación."""
        pass

# STRATEGY: autorización de técnicos
class PoliticaTecnicoAsignado(AutorizarCambioEstado):

    def autorizar(self, usuario, orden):
        if (
            orden.tecnico_id is None
            or not hasattr(usuario, "perfil_tecnico")
            or orden.tecnico_id != usuario.perfil_tecnico.pk
        ):
            raise PermissionDenied(
                "Solo el técnico asignado puede avanzar esta orden."
            )

# STRATEGY: autorización administrativa
class PoliticaPermisoAdministrativo(AutorizarCambioEstado):

    def autorizar(self, usuario, orden):
        if not usuario.has_perm(
            "reparaciones.change_ordenservicio"
        ):
            raise PermissionDenied(
                "No tiene permiso para cerrar órdenes."
            )

# STRATEGY: otros estados
class PoliticaDenegacionPorDefecto(AutorizarCambioEstado):

    def autorizar(self, usuario, orden):
        raise PermissionDenied(
            "No existe una politica de autorizacion "
            "para el estado solicitado."
        )

# FACTORY METHOD: creador abstracto
class CreadorPolitica(ABC):

    @abstractmethod
    def crear_politica(self) -> AutorizarCambioEstado:
        pass

# FACTORY METHOD: creadores concretos
class CreadorPoliticaTecnica(CreadorPolitica):

    def crear_politica(self) -> AutorizarCambioEstado:
        return PoliticaTecnicoAsignado()

class CreadorPoliticaAdministrativa(CreadorPolitica):

    def crear_politica(self) -> AutorizarCambioEstado:
        return PoliticaPermisoAdministrativo()

class CreadorPoliticaDenegacion(CreadorPolitica):

    def crear_politica(self) -> AutorizarCambioEstado:
        return PoliticaDenegacionPorDefecto()

# Selecciona la política según el estado solicitado
class SelectorPoliticas:

    _tecnicos = frozenset((
        OrdenServicio.Estado.EN_DIAGNOSTICO,
        OrdenServicio.Estado.EN_REPARACION,
        OrdenServicio.Estado.FINALIZADA,
    ))

    _administrativos = frozenset((
        OrdenServicio.Estado.ENTREGADA,
        OrdenServicio.Estado.CANCELADA,
    ))

    @classmethod
    def es_estado_tecnico(cls, estado):
        return estado in cls._tecnicos

    @classmethod
    def obtener(cls, nuevo_estado) -> AutorizarCambioEstado:
        if nuevo_estado in cls._tecnicos:
            creador = CreadorPoliticaTecnica()
        elif nuevo_estado in cls._administrativos:
            creador = CreadorPoliticaAdministrativa()
        else:
            creador = CreadorPoliticaDenegacion()

        return creador.crear_politica()