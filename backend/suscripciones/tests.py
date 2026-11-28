from datetime import timedelta
from decimal import Decimal

from django.urls import reverse
from django.utils import timezone
from rest_framework import status

from catalogo.models import Categoria, Producto, Suscripcion, Variante
from ventas.models import TransaccionPago
from ventas.servicios import confirmar_pago
from ventas.tests import PagoBaseTest

from .models import SuscripcionActiva
from .servicios import activar_suscripciones


class SuscripcionBaseTest(PagoBaseTest):
    "Reutiliza el cliente, la dirección y la tarjeta 4242 de las pruebas de ventas."

    def setUp(self):
        super().setUp()
        categoria = Categoria.objects.create(nombre='Planes')
        producto = Producto.objects.create(
            categoria=categoria, nombre='Plan Protección', tipo_producto=Producto.Tipo.SUSCRIPCION,
        )
        Suscripcion.objects.create(producto=producto, periodo_facturacion_dias=30,
                                   cantidad_mantenimientos_incluidos=2)
        self.plan = Variante.objects.create(producto=producto, sku='PLAN-30', precio=Decimal('900'))

    def comprar_plan(self):
        "Pedido solo con el plan ('Comprar ahora'); un plan no necesita dirección."
        respuesta = self.client.post(self.url_pedidos, {'variante': self.plan.id}, format='json')
        return respuesta.data['id']

    def pagar_pedido(self, pedido_id, **datos):
        return self.client.post(reverse('pedido-pagar', args=[pedido_id]), datos, format='json')


############################       1. ACTIVACIÓN AL PAGAR       ############################


class ActivarSuscripcionTests(SuscripcionBaseTest):

    def test_tarjeta_aprobada_activa_el_plan(self):
        pedido_id = self.comprar_plan()
        self.pagar_pedido(pedido_id, forma_pago='TARJETA', metodo_pago=self.tarjeta.id)

        suscripcion = SuscripcionActiva.objects.get()
        hoy = timezone.localdate()
        self.assertEqual(suscripcion.usuario, self.cliente)
        self.assertEqual(suscripcion.estado, 'ACTIVA')
        self.assertEqual(suscripcion.fecha_inicio, hoy)
        self.assertEqual(suscripcion.fecha_vencimiento, hoy + timedelta(days=30))
        self.assertEqual(suscripcion.dias_restantes, 30)

    def test_tarjeta_rechazada_no_activa(self):
        rechazada = self.crear_tarjeta('0000')
        pedido_id = self.comprar_plan()
        self.pagar_pedido(pedido_id, forma_pago='TARJETA', metodo_pago=rechazada.id)

        self.assertFalse(SuscripcionActiva.objects.exists())

    def test_transferencia_activa_al_confirmarse(self):
        pedido_id = self.comprar_plan()
        self.pagar_pedido(pedido_id, forma_pago='TRANSFERENCIA')
        self.assertFalse(SuscripcionActiva.objects.exists())

        confirmar_pago(TransaccionPago.objects.get(pedido_id=pedido_id))
        self.assertEqual(SuscripcionActiva.objects.count(), 1)

    def test_no_se_duplica(self):
        pedido_id = self.comprar_plan()
        self.pagar_pedido(pedido_id, forma_pago='TARJETA', metodo_pago=self.tarjeta.id)

        pedido = self.cliente.pedidos.get(pk=pedido_id)
        self.assertEqual(activar_suscripciones(pedido), [])
        self.assertEqual(SuscripcionActiva.objects.count(), 1)

    def test_plan_sin_configurar_no_se_vende(self):
        incompleto = Producto.objects.create(
            categoria=Categoria.objects.get(nombre='Planes'),
            nombre='Plan Roto', tipo_producto=Producto.Tipo.SUSCRIPCION,
        )
        variante = Variante.objects.create(producto=incompleto, sku='ROTO', precio=Decimal('100'))

        respuesta = self.client.post(self.url_pedidos, {'variante': variante.id}, format='json')
        self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)


############################       2. API "MIS SUSCRIPCIONES"       ############################


class SuscripcionAPITests(SuscripcionBaseTest):

    def setUp(self):
        super().setUp()
        pedido_id = self.comprar_plan()
        self.pagar_pedido(pedido_id, forma_pago='TARJETA', metodo_pago=self.tarjeta.id)
        self.suscripcion = SuscripcionActiva.objects.get()
        self.url_lista = reverse('suscripcion-list')
        self.url_detalle = reverse('suscripcion-detail', args=[self.suscripcion.id])
        self.url_cancelar = reverse('suscripcion-cancelar', args=[self.suscripcion.id])
        self.id_dron = self.dron.producto_id   # el Articulo usa el producto como llave

    def test_lista_solo_las_propias(self):
        respuesta = self.client.get(self.url_lista)
        self.assertEqual(len(respuesta.data), 1)
        self.assertEqual(respuesta.data[0]['plan_nombre'], 'Plan Protección')

        otro = self.crear_usuario('otro@nexus.com', '0801199900802')
        self.client.force_authenticate(user=otro)
        self.assertEqual(self.client.get(self.url_lista).data, [])
        self.assertEqual(self.client.get(self.url_detalle).status_code, status.HTTP_404_NOT_FOUND)

    def test_cubrir_un_dron_comprado(self):
        self.pagar(forma_pago='TARJETA', metodo_pago=self.tarjeta.id)   # paga el pedido del dron

        drones = self.client.get(reverse('suscripcion-drones')).data
        self.assertEqual([d['id'] for d in drones], [self.id_dron])

        respuesta = self.client.patch(self.url_detalle, {'articulo_cubierto': self.id_dron}, format='json')
        self.assertEqual(respuesta.status_code, status.HTTP_200_OK)
        self.assertEqual(respuesta.data['articulo_texto'], 'DJI')

    def test_no_cubre_un_dron_sin_pagar(self):
        # El pedido del dron existe, pero sigue PENDIENTE
        respuesta = self.client.patch(self.url_detalle, {'articulo_cubierto': self.id_dron}, format='json')
        self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cancelar(self):
        respuesta = self.client.post(self.url_cancelar)
        self.assertEqual(respuesta.data['estado'], 'CANCELADA')
        self.assertFalse(respuesta.data['puede_cancelar'])

        self.assertEqual(self.client.post(self.url_cancelar).status_code, status.HTTP_400_BAD_REQUEST)

    def test_vencida_se_actualiza_al_consultar(self):
        hoy = timezone.localdate()
        SuscripcionActiva.objects.update(
            fecha_inicio=hoy - timedelta(days=40), fecha_vencimiento=hoy - timedelta(days=10)
        )
        respuesta = self.client.get(self.url_detalle)
        self.assertEqual(respuesta.data['estado'], 'VENCIDA')
        self.assertEqual(respuesta.data['dias_restantes'], 0)