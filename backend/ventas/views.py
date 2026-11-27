from django.core.exceptions import ValidationError as DjangoValidationError
from django.shortcuts import get_object_or_404
from rest_framework import permissions, status, mixins, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import ProtectedError

from .models import Carrito, CarritoDetalle, MetodoPago, Pedido
from .pagos import ESTRATEGIAS
from .serializers import (AgregarAlCarritoSerializer, CambiarCantidadSerializer, CarritoSerializer, ConfirmarPedidoSerializer, MetodoPagoSerializer, PagarPedidoSerializer,PedidoSerializer)
from .servicios import (
    agregar_al_carrito,
    buscar_cupon,
    calcular_totales,
    cambiar_cantidad,
    cancelar_pedido,
    confirmar_pedido,
    obtener_carrito,
    quitar_del_carrito,
    requiere_direccion,
    vaciar_carrito,
    pagar_pedido,
)


def respuesta_carrito(usuario, estado=status.HTTP_200_OK):
    "Devuelve el carrito completo con todas sus líneas en pocas consultas."
    carrito = (Carrito.objects
               .prefetch_related('detalles__variante__producto')
               .get(pk=obtener_carrito(usuario).pk))
    return Response(CarritoSerializer(carrito).data, status=estado)


def ejecutar(funcion, *args):
    "Convierte los errores de negocio de Django en errores 400 de DRF."
    try:
        return funcion(*args)
    except DjangoValidationError as error:
        raise ValidationError({'detail': error.messages})


class CarritoView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return respuesta_carrito(request.user)

    def delete(self, request):
        vaciar_carrito(request.user)
        return respuesta_carrito(request.user)


class AgregarAlCarritoView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = AgregarAlCarritoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        ejecutar(
            agregar_al_carrito,
            request.user,
            serializer.validated_data['variante'],
            serializer.validated_data['cantidad'],
        )
        return respuesta_carrito(request.user, status.HTTP_201_CREATED)


class CarritoDetalleView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_detalle(self, request, pk):
        return get_object_or_404(
            CarritoDetalle.objects.select_related('variante__producto', 'carrito'),
            pk=pk,
            carrito__usuario=request.user,
        )

    def patch(self, request, pk):
        detalle = self.get_detalle(request, pk)
        serializer = CambiarCantidadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        ejecutar(cambiar_cantidad, detalle, serializer.validated_data['cantidad'])
        return respuesta_carrito(request.user)

    def delete(self, request, pk):
        quitar_del_carrito(self.get_detalle(request, pk))
        return respuesta_carrito(request.user)

class PedidoViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['estado_pedido']

    def get_queryset(self):
        return (Pedido.objects
                .filter(usuario=self.request.user)
                .select_related('cupon', 'direccion__ubicacion__padre__padre')
                .prefetch_related('detalles__variante__producto', 'transacciones__metodo_pago'))

    def get_serializer_class(self):
        if self.action in ('create', 'resumen'):
            return ConfirmarPedidoSerializer
        if self.action == 'pagar':
            return PagarPedidoSerializer
        return PedidoSerializer
    
    def _respuesta(self, pedido, estado=status.HTTP_200_OK):
        pedido = self.get_queryset().get(pk=pedido.pk)
        return Response(PedidoSerializer(pedido).data, status=estado)

    @action(detail=False, methods=['post'])
    def resumen(self, request):
        """Totales del carrito actual, sin crear el pedido."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        carrito = obtener_carrito(request.user)
        lineas = [
            (detalle.variante, detalle.cantidad)
            for detalle in carrito.detalles.select_related('variante__producto')
        ]
        if not lineas:
            raise ValidationError({'detail': ['El carrito está vacío.']})

        cupon = ejecutar(buscar_cupon, serializer.validated_data['cupon'])
        totales = calcular_totales(lineas, cupon)

        return Response({
            **{campo: str(valor) for campo, valor in totales.items()},
            'cupon': cupon.codigo if cupon else None,
            'requiere_direccion': requiere_direccion(lineas),
        })

    def create(self, request):
        """Confirma la compra con el carrito actual."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        pedido = ejecutar(
            confirmar_pedido,
            request.user,
            serializer.validated_data['direccion'],
            serializer.validated_data['cupon'],
        )
        return self._respuesta(pedido, status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def cancelar(self, request, pk=None):
        pedido = self.get_object()
        ejecutar(cancelar_pedido, pedido, request.user)
        return self._respuesta(pedido)

    @action(detail=True, methods=['post'])
    def pagar(self, request, pk=None):
        pedido = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        transaccion, resultado = ejecutar(
            pagar_pedido,
            pedido,
            serializer.validated_data['forma_pago'],
            serializer.validated_data['metodo_pago'],
        )

        pedido = self.get_queryset().get(pk=pedido.pk)
        return Response({
            'pago': {
                'id': transaccion.id,
                'estado': resultado.estado,
                'mensaje': resultado.mensaje,
                'referencia': resultado.referencia,
            },
            'pedido': PedidoSerializer(pedido).data,
        })

class FormasPagoView(APIView):
    """Las formas de pago salen del registro de estrategias, no de una lista escrita a mano."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response([
            {'clave': clave, 'nombre': estrategia.nombre}
            for clave, estrategia in ESTRATEGIAS.items()
        ])


class MetodoPagoViewSet(mixins.ListModelMixin, mixins.CreateModelMixin,
                        mixins.DestroyModelMixin, viewsets.GenericViewSet):
    serializer_class = MetodoPagoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return MetodoPago.objects.filter(usuario=self.request.user)

    def perform_destroy(self, instance):
        try:
            instance.delete()
        except ProtectedError:
            raise ValidationError({'detail': ['Esta tarjeta tiene pagos registrados y no se puede eliminar.']})