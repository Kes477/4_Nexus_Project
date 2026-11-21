from abc import ABC, abstractmethod

class EstadoMision(ABC):
    @abstractmethod
    def transiciones_permitidas(self):
        pass
    
    def puede_cambiar_a(self, nuevo_estado):
        return nuevo_estado in self.transiciones_permitidas()
    
class EstadoPendiente(EstadoMision):
    def transiciones_permitidas(self):
        return ['ACEPTADA', 'RECHAZADA', 'CANCELADA']

class EstadoAceptada(EstadoMision):
    def transiciones_permitidas(self):
        return ['EN_CURSO', 'CANCELADA']
    
class EstadoEnCurso(EstadoMision):
    def transiciones_permitidas(self):
        return ['COMPLETADA', 'CANCELADA']

class EstadoCompletada(EstadoMision):
    def transiciones_permitidas(self):
        return []
    
class EstadoRechazada(EstadoMision):
    def transiciones_permitidas(self):
        return []

class EstadoCancelada(EstadoMision):
    def transiciones_permitidas(self):
        return []
    
class FabricaEstados:
    _estados = {
        "PENDIENTE": EstadoPendiente,
        "ACEPTADA": EstadoAceptada,
        "EN_CURSO": EstadoEnCurso,
        "COMPLETADA": EstadoCompletada,
        "RECHAZADA": EstadoRechazada,
        "CANCELADA": EstadoCancelada
    }
    
    @classmethod
    def obtener(cls, estado):
        clase = cls._estados.get(estado)
        if clase is None:
            raise ValueError(f"Estado desconocido: {estado}")
        return clase()