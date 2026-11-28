from decimal import Decimal
from django.core.exceptions import ValidationError
from reparaciones.servicios import ServicioOrdenReparacion
from django.contrib.auth import get_user_model
from django.test import override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from reparaciones.models import EquipoCliente, OrdenServicio
from usuarios.models import PerfilCliente, Tecnico
from ventas.models import Pedido
from ventas.servicios import cancelar_pedido
from ventas.factura import generar_factura_pdf


@override_settings(VENTAS_TASA_ISV=Decimal('0.15'))
class CotizarReparacionTests(APITestCase):

    def setUp(self):
        Usuario = get_user_model()

        self.usuario_cliente = Usuario.objects.create_user(
            email='cliente.cotiza@example.com', password='ClavePrueba123!',
            no_identificacion='0801199900501', first_name='Ana', last_name='Lopez',
        )
        cliente = PerfilCliente.objects.create(usuario=self.usuario_cliente)
        equipo = EquipoCliente.objects.create(
            cliente=cliente, marca='DJI', modelo='Mini 4 Pro', numero_serie='DJI-COTIZA-001',
        )

        self.usuario_tecnico = Usuario.objects.create_user(
            email='tecnico.cotiza@example.com', password='ClavePrueba123!',
            no_identificacion='0801199900502', first_name='Pedro', last_name='Martinez',
        )
        tecnico = Tecnico.objects.create(
            usuario=self.usuario_tecnico, especialidad_tecnica='Drones', disponible=True,
        )

        self.orden = OrdenServicio.objects.create(
            equipo=equipo, tecnico=tecnico,
            descripcion_problema='No enciende', estado=OrdenServicio.Estado.EN_DIAGNOSTICO,
        )
        self.url = reverse('orden-cotizar', kwargs={'pk': self.orden.pk})
        self.client.force_authenticate(user=self.usuario_tecnico)

    def cotizar(self, costo='1200'):
        return self.client.post(self.url, {'costo': costo}, format='json')

    def test_tecnico_asignado_cotiza_y_se_crea_el_pedido(self):
        respuesta = self.cotizar()

        self.assertEqual(respuesta.status_code, status.HTTP_200_OK)
        self.assertEqual(respuesta.data['costo'], '1200.00')
        self.assertEqual(respuesta.data['pedido_estado'], 'PENDIENTE')
        self.assertEqual(respuesta.data['total_a_pagar'], '1380.00')   # 1200 + 15 % ISV

        pedido = Pedido.objects.get()
        self.assertEqual(pedido.usuario, self.usuario_cliente)          # se le cobra al dueño
        self.assertEqual(pedido.costo_envio, Decimal('0'))
        detalle = pedido.detalles.get()
        self.assertEqual(detalle.variante.sku, 'SERV-REPARACION')
        self.assertEqual(detalle.precio_unitario, Decimal('1200.00'))

    def test_el_cliente_lo_ve_en_mis_pedidos(self):
        self.cotizar()
        self.client.force_authenticate(user=self.usuario_cliente)

        respuesta = self.client.get(reverse('pedido-list'))
        self.assertEqual([p['id'] for p in respuesta.data], [self.orden.__class__.objects.get().pedido_id])

    def test_cliente_no_puede_cotizar(self):
        self.client.force_authenticate(user=self.usuario_cliente)
        self.assertEqual(self.cotizar().status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(Pedido.objects.exists())

    def test_solo_en_diagnostico(self):
        OrdenServicio.objects.filter(pk=self.orden.pk).update(estado=OrdenServicio.Estado.RECIBIDA)
        self.assertEqual(self.cotizar().status_code, status.HTTP_400_BAD_REQUEST)

    def test_costo_debe_ser_positivo(self):
        self.assertEqual(self.cotizar('0').status_code, status.HTTP_400_BAD_REQUEST)

    def test_no_se_cotiza_dos_veces_salvo_si_se_cancelo(self):
        self.cotizar()
        self.assertEqual(self.cotizar('1500').status_code, status.HTTP_400_BAD_REQUEST)

        # El cliente rechaza el precio cancelando el pedido -> se puede volver a cotizar
        cancelar_pedido(Pedido.objects.get())
        respuesta = self.cotizar('900')
        self.assertEqual(respuesta.status_code, status.HTTP_200_OK)
        self.assertEqual(respuesta.data['costo'], '900.00')
        self.assertEqual(Pedido.objects.count(), 2)


@override_settings(VENTAS_TASA_ISV=Decimal('0.15'))
class CobroReparacionTests(CotizarReparacionTests):
    "Hereda el setUp (cliente, técnico, orden en diagnóstico y cotizar())."

    # Las pruebas de la clase padre no se repiten aquí
    test_tecnico_asignado_cotiza_y_se_crea_el_pedido = None
    test_el_cliente_lo_ve_en_mis_pedidos = None
    test_cliente_no_puede_cotizar = None
    test_solo_en_diagnostico = None
    test_costo_debe_ser_positivo = None
    test_no_se_cotiza_dos_veces_salvo_si_se_cancelo = None

    def poner_en(self, estado):
        OrdenServicio.objects.filter(pk=self.orden.pk).update(estado=estado)
        return OrdenServicio.objects.get(pk=self.orden.pk)

    def cambiar(self, estado):
        orden = OrdenServicio.objects.get(pk=self.orden.pk)
        return ServicioOrdenReparacion.cambiar_estado(orden, estado)

    def test_no_se_entrega_sin_pagar(self):
        self.cotizar()
        self.poner_en(OrdenServicio.Estado.FINALIZADA)

        with self.assertRaises(ValidationError):
            self.cambiar(OrdenServicio.Estado.ENTREGADA)
        self.assertEqual(OrdenServicio.objects.get().estado, 'FINALIZADA')

    def test_se_entrega_si_esta_pagada(self):
        self.cotizar()
        Pedido.objects.update(estado_pedido=Pedido.Estado.PAGADO)
        self.poner_en(OrdenServicio.Estado.FINALIZADA)

        self.assertEqual(self.cambiar(OrdenServicio.Estado.ENTREGADA).estado, 'ENTREGADA')

    def test_sin_cotizacion_se_entrega(self):
        self.poner_en(OrdenServicio.Estado.FINALIZADA)
        self.assertEqual(self.cambiar(OrdenServicio.Estado.ENTREGADA).estado, 'ENTREGADA')

    def test_cancelar_la_orden_cancela_el_cobro_pendiente(self):
        self.cotizar()
        self.cambiar(OrdenServicio.Estado.CANCELADA)

        self.assertEqual(Pedido.objects.get().estado_pedido, 'CANCELADO')

    def test_no_se_cancela_si_ya_pago(self):
        self.cotizar()
        Pedido.objects.update(estado_pedido=Pedido.Estado.PAGADO)

        with self.assertRaises(ValidationError):
            self.cambiar(OrdenServicio.Estado.CANCELADA)
        self.assertEqual(OrdenServicio.objects.get().estado, 'EN_DIAGNOSTICO')


class FacturaReparacionTests(CobroReparacionTests):
    test_no_se_entrega_sin_pagar = None
    test_se_entrega_si_esta_pagada = None
    test_sin_cotizacion_se_entrega = None
    test_cancelar_la_orden_cancela_el_cobro_pendiente = None
    test_no_se_cancela_si_ya_pago = None

    def test_la_reparacion_genera_su_pdf(self):
        self.cotizar()
        pdf = generar_factura_pdf(Pedido.objects.get())
        self.assertTrue(pdf.startswith(b'%PDF'))