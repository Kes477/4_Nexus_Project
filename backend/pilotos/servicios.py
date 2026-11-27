from decimal import Decimal

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

        if (
            nuevo_estado == Mision.Estado.COMPLETADA
            and mision.piloto_id is not None
            and mision.fecha_creacion is not None
        ):
            delta = mision.fecha_cierre - mision.fecha_creacion
            horas = Decimal(str(round(max(delta.total_seconds(), 0) / 3600, 2)))

            piloto = mision.piloto
            piloto.horas_vuelo_acumuladas = (piloto.horas_vuelo_acumuladas or 0) + horas
            piloto.save(update_fields=["horas_vuelo_acumuladas"])

        return mision