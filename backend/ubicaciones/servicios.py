from django.db import transaction

from .models import Direccion


@transaction.atomic
def guardar_direccion(usuario, datos, direccion=None):
    quiere_principal = datos.pop('es_principal', None)
    es_nueva = direccion is None

    if es_nueva:
        direccion = Direccion(usuario=usuario)
        if not usuario.direcciones.exists():
            quiere_principal = True

    for campo, valor in datos.items():
        setattr(direccion, campo, valor)

    list(usuario.direcciones.select_for_update().values_list('pk', flat=True))

    if quiere_principal is True:
        otrras = usuario.direcciones.filter(es_principal=True)
        if direccion.pk is not None:
            otrras = otrras.exclude(pk=direccion.pk)
        otrras.update(es_principal=False)
        direccion.es_principal = True
        direccion.save()
        return direccion

    if quiere_principal is False and not es_nueva and direccion.es_principal:
        direccion.es_principal = False
        direccion.save()
        siguiente = usuario.direcciones.exclude(pk=direccion.pk).order_by('id').first()
        if siguiente:
            siguiente.es_principal = True
            siguiente.save(update_fields=['es_principal'])
        return direccion

    direccion.save()
    return direccion


@transaction.atomic
def eliminar_direccion(direccion):
    usuario = direccion.usuario
    era_principal = direccion.es_principal
    direccion.delete()

    if era_principal:
        siguiente = usuario.direcciones.order_by('id').first()
        if siguiente:
            siguiente.es_principal = True
            siguiente.save(update_fields=['es_principal'])