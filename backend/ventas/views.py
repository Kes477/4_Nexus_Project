from django.core.exceptions import ValidationError as DjangoValidationError
from django.shortcuts import get_object_or_404
from rest_framework import permissions, status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Carrito, CarritoDetalle
from .serializers import AgregarAlCarritoSerializer, CambiarCantidadSerializer, CarritoSerializer
from .servicios import (
    agregar_al_carrito,
    cambiar_cantidad,
    obtener_carrito,
    quitar_del_carrito,
    vaciar_carrito,
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