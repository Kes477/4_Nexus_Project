from abc import ABC, abstractmethod
from rest_framework.exceptions import PermissionDenied

class AutorizarCambioEstado(ABC):
    @abstractmethod
    def autorizar(self, usuario, mision):
        pass
    
class PoliticaPilotoAsignado(AutorizarCambioEstado):
    def autorizar(self, usuario, mision):
        if mision.piloto_id is None or not hasattr(usuario, 'perfil_piloto') or mision.piloto_id != usuario.perfil_piloto.pk:
            raise PermissionDenied("Solo el piloto asignado puede modificar esta misión")
        
class PoliticaPermisoAdministrativo(AutorizarCambioEstado):
    def autorizar(self, usuario, mision):
        if not usuario.is_staff:
            raise PermissionDenied("No tiene permisos de administrador para realizar esta acción")
        
class SelectorPoliticas:
    @classmethod
    def obtener(cls, usuario, nuevo_estado) -> AutorizarCambioEstado:
        if usuario.is_staff:
            return PoliticaPermisoAdministrativo()
        return PoliticaPilotoAsignado()