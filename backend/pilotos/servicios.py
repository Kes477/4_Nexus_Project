from django.utils import timezone
from .models import Mision

class ServicioMisionPiloto:
    @staticmethod
    def cambiar_estado(mision, nuevo_estado):
        if not mision.puede_cambiar_a(nuevo_estado):
            raise ValueError("La trasición solicitada no está permitida desde elestado actual.")
        
        mision.estado = nuevo_estado
        
        if nuevo_estado in [
            Mision.Estado.COMPLETADA,
            Mision.Estado.RECHAZADA,
            Mision.Estado.CANCELADA,
        ]:
            mision.fecha_cierre = timezone.now()
            
        mision.save(update_fields=["estado", "fecha_cierre"])
        return mision