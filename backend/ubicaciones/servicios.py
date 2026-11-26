from django.db import transaction

from .models import Direccion


@transaction.atomic
def guardar_direccion(usuario, datos, direccion=None):
    "Crea o edita una dirección del usuario y mantiene una sola principal."
    quiere_principal = datos.pop('es_principal', False)

    if direccion is None:
        direccion = Direccion(usuario=usuario)
        if not usuario.direcciones.exists():
            quiere_principal = True

    for campo, valor in datos.items():
        setattr(direccion, campo, valor)

    if quiere_principal:
        (usuario.direcciones
            .select_for_update()
            .filter(es_principal=True)
            .exclude(pk=direccion.pk)
            .update(es_principal=False))
        direccion.es_principal = True

    direccion.save()
    return direccion


@transaction.atomic
def eliminar_direccion(direccion):
    "Borra la dirección; si era la principal, la siguiente toma su lugar."
    usuario = direccion.usuario
    era_principal = direccion.es_principal
    direccion.delete()

    if era_principal:
        siguiente = usuario.direcciones.order_by('id').first()
        if siguiente:
            siguiente.es_principal = True
            siguiente.save(update_fields=['es_principal'])