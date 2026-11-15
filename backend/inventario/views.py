from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from . import servicios
from .models import Almacen, Inventario,MovimientoInventario
from .serializers import (AjusteSerializer, AlmacenSerializer, EntradaSerializer, InventarioSerializer, MovimientoInventarioSerializer,)

class AlmacenViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Almacen.objects.all()
    serializer_class = AlmacenSerializer
    permission_classes = [permissions.IsAdminUser]

class InventarioViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Inventario.objects.select_related('almacen', 'variante__producto')
    serializer_class = InventarioSerializer
    permission_classes = [permissions.IsAdminUser]
    filterset_fields = ['almacen', 'variante']
    search_fields = ['variante__sku', 'variante__producto__nombre']
    ordering_fields = ['cantidad_disponible', 'cantidad_reservada']

    @action(detail=True, methods=['post'])
    def entrada(self, request, pk=None):
        datos = EntradaSerializer(data=request.data)
        datos.is_valid(raise_exception=True)

        try:
            inventario = servicios.registrar_entrada(
                self.get_object(),
                datos.validated_data['cantidad'],
                request.user,
                datos.validated_data['motivo'],
            )
        except DjangoValidationError as error:
            raise ValidationError(error.messages)

        return Response(self.get_serializer(inventario).data)

    @action(detail=True, methods=['post'])
    def ajuste(self, request, pk=None):
        datos = AjusteSerializer(data=request.data)
        datos.is_valid(raise_exception=True)

        try:
            inventario = servicios.ajustar_inventario(
                self.get_object(),
                datos.validated_data['conteo_real'],
                request.user,
                datos.validated_data['motivo'],
            )
        except DjangoValidationError as error:
            raise ValidationError(error.messages)

        return Response(self.get_serializer(inventario).data)


class MovimientoInventarioViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = MovimientoInventario.objects.select_related(
        'inventario__variante', 'inventario__almacen', 'usuario'
    )
    serializer_class = MovimientoInventarioSerializer
    permission_classes = [permissions.IsAdminUser]
    filterset_fields = ['inventario', 'tipo', 'inventario__almacen']