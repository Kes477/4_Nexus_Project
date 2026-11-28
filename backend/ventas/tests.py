from datetime import timedelta
from decimal import Decimal
from unittest.mock import patch

from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.test import TestCase, override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from catalogo.models import Articulo, Categoria, Producto, Variante
from inventario.models import Almacen, Inventario, MovimientoInventario
from ubicaciones.models import Direccion, Ubicacion

from .models import CarritoDetalle, Cupon, MetodoPago, Pedido, ReservaPedido, TransaccionPago
from .pagos import ESTRATEGIAS, EstrategiaPago, ResultadoPago
from .servicios import confirmar_pago, marcar_entregado, marcar_enviado, pagar_pedido, procesar_pedido, stock_disponible

Usuario = get_user_model()


class CarritoBaseTest(APITestCase):

    def setUp(self):
        categoria = Categoria.objects.create(nombre='Drones')

        # Artículo con 3 unidades en un almacén activo y 2 en uno inactivo
        dron = Producto.objects.create(categoria=categoria, nombre='Mini 5 Pro')
        Articulo.objects.create(producto=dron, marca='DJI')
        self.dron = Variante.objects.create(producto=dron, sku='MINI5-STD', precio=Decimal('18500'))

        activo = Almacen.objects.create(nombre='Tegucigalpa', direccion='Col. Kennedy')
        inactivo = Almacen.objects.create(nombre='Viejo', direccion='Cerrado', activo=False)
        Inventario.objects.create(almacen=activo, variante=self.dron, cantidad_disponible=3)
        Inventario.objects.create(almacen=inactivo, variante=self.dron, cantidad_disponible=2)

        # Servicio (no lleva inventario)
        servicio = Producto.objects.create(
            categoria=categoria, nombre='Fotografía aérea', tipo_producto=Producto.Tipo.SERVICIO
        )
        self.servicio = Variante.objects.create(
            producto=servicio, sku='FOTO-1H', precio=Decimal('1500')
        )

        self.cliente = self.crear_usuario('cliente@nexus.com', '0801199900801')
        self.client.force_authenticate(user=self.cliente)

        self.url = reverse('carrito')
        self.url_agregar = reverse('carrito-agregar')

    def crear_usuario(self, email, identificacion):
        return Usuario.objects.create_user(
            email=email, password='Drones-2026!', no_identificacion=identificacion,
            first_name='Prueba', last_name='Carrito',
        )

    def agregar(self, variante, cantidad=1):
        return self.client.post(
            self.url_agregar, {'variante': variante.id, 'cantidad': cantidad}, format='json'
        )

    def url_detalle(self, detalle_id):
        return reverse('carrito-detalle', args=[detalle_id])



########################## 1. VER Y AGREGAR #########################

class AgregarAlCarritoTests(CarritoBaseTest):

    def test_requiere_sesion(self):
        self.client.force_authenticate(user=None)
        self.assertEqual(self.client.get(self.url).status_code, status.HTTP_401_UNAUTHORIZED)

    def test_carrito_vacio_se_crea_al_consultar(self):
        respuesta = self.client.get(self.url)

        self.assertEqual(respuesta.status_code, status.HTTP_200_OK)
        self.assertEqual(respuesta.data['detalles'], [])
        self.assertEqual(respuesta.data['cantidad_articulos'], 0)

    def test_agregar_articulo(self):
        respuesta = self.agregar(self.dron)

        self.assertEqual(respuesta.status_code, status.HTTP_201_CREATED)
        linea = respuesta.data['detalles'][0]
        self.assertEqual(linea['producto'], 'Mini 5 Pro')
        self.assertEqual(linea['cantidad'], 1)
        self.assertEqual(respuesta.data['subtotal'], '18500.00')

    def test_agregar_dos_veces_suma_la_cantidad(self):
        self.agregar(self.dron)
        respuesta = self.agregar(self.dron)

        self.assertEqual(len(respuesta.data['detalles']), 1)
        self.assertEqual(respuesta.data['detalles'][0]['cantidad'], 2)
        self.assertEqual(respuesta.data['cantidad_articulos'], 2)
        self.assertEqual(respuesta.data['subtotal'], '37000.00')

    def test_solo_cuenta_almacenes_activos(self):
        self.assertEqual(stock_disponible(self.dron), 3)

    def test_no_se_puede_pasar_del_stock(self):
        respuesta = self.agregar(self.dron, 4)

        self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Solo hay 3', str(respuesta.data))
        self.assertFalse(CarritoDetalle.objects.exists())

    def test_servicio_solo_una_vez(self):
        self.assertEqual(self.agregar(self.servicio).status_code, status.HTTP_201_CREATED)

        respuesta = self.agregar(self.servicio)
        self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(CarritoDetalle.objects.get(variante=self.servicio).cantidad, 1)

    def test_producto_inactivo(self):
        self.dron.producto.activo = False
        self.dron.producto.save()

        respuesta = self.agregar(self.dron)
        self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)

    def test_variante_inexistente(self):
        respuesta = self.client.post(self.url_agregar, {'variante': 9999}, format='json')

        self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('variante', respuesta.data)

    def test_el_carrito_usa_el_precio_actual(self):
        self.agregar(self.dron)
        self.dron.precio = Decimal('17000')
        self.dron.save()

        respuesta = self.client.get(self.url)
        self.assertEqual(respuesta.data['subtotal'], '17000.00')


##################### 2. CAMBIAR, QUITAR Y VACIAR ###########################


class ModificarCarritoTests(CarritoBaseTest):

    def setUp(self):
        super().setUp()
        self.detalle_id = self.agregar(self.dron).data['detalles'][0]['id']

    def test_cambiar_cantidad(self):
        respuesta = self.client.patch(self.url_detalle(self.detalle_id), {'cantidad': 3}, format='json')

        self.assertEqual(respuesta.status_code, status.HTTP_200_OK)
        self.assertEqual(respuesta.data['detalles'][0]['cantidad'], 3)

    def test_cantidad_invalida(self):
        for cantidad in [0, -1, 4]:
            with self.subTest(cantidad=cantidad):
                respuesta = self.client.patch(
                    self.url_detalle(self.detalle_id), {'cantidad': cantidad}, format='json'
                )
                self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)

        self.assertEqual(CarritoDetalle.objects.get(pk=self.detalle_id).cantidad, 1)

    def test_quitar_linea(self):
        respuesta = self.client.delete(self.url_detalle(self.detalle_id))

        self.assertEqual(respuesta.status_code, status.HTTP_200_OK)
        self.assertEqual(respuesta.data['detalles'], [])

    def test_vaciar_carrito(self):
        self.agregar(self.servicio)
        respuesta = self.client.delete(self.url)

        self.assertEqual(respuesta.data['detalles'], [])
        self.assertFalse(CarritoDetalle.objects.exists())

    def test_no_puede_tocar_el_carrito_de_otro(self):
        otro = self.crear_usuario('otro@nexus.com', '0801199900802')
        self.client.force_authenticate(user=otro)
        url = self.url_detalle(self.detalle_id)

        self.assertEqual(
            self.client.patch(url, {'cantidad': 2}, format='json').status_code,
            status.HTTP_404_NOT_FOUND,
        )
        self.assertEqual(self.client.delete(url).status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(CarritoDetalle.objects.get(pk=self.detalle_id).cantidad, 1)


###################################           3. PEDIDOS            ############################################

@override_settings(VENTAS_TASA_ISV=Decimal('0.15'), VENTAS_COSTO_ENVIO=Decimal('150.00'))
class PedidoBaseTest(CarritoBaseTest):

    def setUp(self):
        super().setUp()
        self.direccion = Direccion.objects.create(
            usuario=self.cliente,
            ubicacion=Ubicacion.objects.get(nombre='Distrito Central'),
            linea_direccion1='Col. Kennedy, casa 12',
            es_principal=True,
        )
        hoy = timezone.localdate()
        self.cupon = Cupon.objects.create(
            codigo='DRONES20', tipo_descuento=Cupon.Tipo.PORCENTAJE, valor_descuento=20,
            fecha_inicio=hoy, fecha_expiracion=hoy + timedelta(days=30),
        )
        self.url_pedidos = reverse('pedido-list')
        self.url_resumen = reverse('pedido-resumen')

    def inventario(self, almacen='Tegucigalpa'):
        return Inventario.objects.get(almacen__nombre=almacen, variante=self.dron)

    def confirmar(self, **datos):
        datos.setdefault('direccion', self.direccion.id)
        return self.client.post(self.url_pedidos, datos, format='json')


class ResumenPedidoTests(PedidoBaseTest):

    def setUp(self):
        super().setUp()
        self.agregar(self.dron, 2)  # 2 x 18,500 = 37,000

    def test_resumen_no_crea_nada(self):
        respuesta = self.client.post(self.url_resumen, {}, format='json')

        self.assertEqual(respuesta.status_code, status.HTTP_200_OK)
        self.assertEqual(respuesta.data['subtotal'], '37000.00')
        self.assertEqual(respuesta.data['costo_envio'], '150.00')
        self.assertEqual(respuesta.data['total_impuestos'], '5550.00')   # 15 % de 37,000
        self.assertEqual(respuesta.data['total_final'], '42700.00')
        self.assertTrue(respuesta.data['requiere_direccion'])
        self.assertFalse(Pedido.objects.exists())
        self.assertEqual(CarritoDetalle.objects.count(), 1)

    def test_resumen_con_cupon(self):
        respuesta = self.client.post(self.url_resumen, {'cupon': 'drones20'}, format='json')

        self.assertEqual(respuesta.data['cupon'], 'DRONES20')
        self.assertEqual(respuesta.data['total_descuento'], '7400.00')   # 20 % de 37,000
        self.assertEqual(respuesta.data['total_impuestos'], '4440.00')   # 15 % de 29,600
        self.assertEqual(respuesta.data['total_final'], '34190.00')      # 29,600 + 150 + 4,440

    def test_cupon_invalido_o_vencido(self):
        self.cupon.fecha_expiracion = timezone.localdate() - timedelta(days=1)
        self.cupon.fecha_inicio = self.cupon.fecha_expiracion - timedelta(days=10)
        self.cupon.save()

        for codigo in ['NOEXISTE', 'DRONES20']:
            with self.subTest(codigo=codigo):
                respuesta = self.client.post(self.url_resumen, {'cupon': codigo}, format='json')
                self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)

    def test_carrito_vacio(self):
        self.client.delete(self.url)
        respuesta = self.client.post(self.url_resumen, {}, format='json')
        self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)


class ConfirmarPedidoTests(PedidoBaseTest):

    def test_confirmar_crea_el_pedido_y_reserva_stock(self):
        self.agregar(self.dron, 2)
        respuesta = self.confirmar(cupon='DRONES20')

        self.assertEqual(respuesta.status_code, status.HTTP_201_CREATED)
        self.assertEqual(respuesta.data['estado_pedido'], 'PENDIENTE')
        self.assertEqual(respuesta.data['total_final'], '34190.00')
        self.assertEqual(respuesta.data['detalles'][0]['precio_unitario'], '18500.00')
        self.assertTrue(respuesta.data['puede_cancelar'])

        inventario = self.inventario()
        self.assertEqual(inventario.cantidad_disponible, 1)
        self.assertEqual(inventario.cantidad_reservada, 2)
        self.assertFalse(CarritoDetalle.objects.exists())

    def test_el_pedido_congela_el_precio(self):
        self.agregar(self.dron)
        pedido_id = self.confirmar().data['id']

        self.dron.precio = Decimal('9999')
        self.dron.save()

        respuesta = self.client.get(reverse('pedido-detail', args=[pedido_id]))
        self.assertEqual(respuesta.data['detalles'][0]['precio_unitario'], '18500.00')

    def test_reserva_repartida_entre_almacenes(self):
        sps = Almacen.objects.create(nombre='San Pedro Sula', direccion='Barrio Guamilito')
        Inventario.objects.create(almacen=sps, variante=self.dron, cantidad_disponible=2)

        self.agregar(self.dron, 4)  # 3 en Tegucigalpa + 1 en San Pedro Sula
        self.assertEqual(self.confirmar().status_code, status.HTTP_201_CREATED)

        self.assertEqual(ReservaPedido.objects.count(), 2)
        self.assertEqual(self.inventario('Tegucigalpa').cantidad_reservada, 3)
        self.assertEqual(self.inventario('San Pedro Sula').cantidad_reservada, 1)
        self.assertEqual(stock_disponible(self.dron), 1)

    def test_articulos_requieren_direccion(self):
        self.agregar(self.dron)
        respuesta = self.client.post(self.url_pedidos, {}, format='json')

        self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(Pedido.objects.exists())
        self.assertEqual(CarritoDetalle.objects.count(), 1)

    def test_no_puede_usar_la_direccion_de_otro(self):
        otro = self.crear_usuario('otro@nexus.com', '0801199900803')
        ajena = Direccion.objects.create(
            usuario=otro, ubicacion=self.direccion.ubicacion, linea_direccion1='Ajena'
        )
        self.agregar(self.dron)

        respuesta = self.confirmar(direccion=ajena.id)

        self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('direccion', respuesta.data)

    def test_solo_servicios_no_paga_envio_ni_reserva(self):
        self.agregar(self.servicio)
        respuesta = self.client.post(self.url_pedidos, {}, format='json')

        self.assertEqual(respuesta.status_code, status.HTTP_201_CREATED)
        self.assertEqual(respuesta.data['costo_envio'], '0.00')
        self.assertFalse(ReservaPedido.objects.exists())

    def test_si_el_stock_cambio_no_se_crea_nada(self):
        self.agregar(self.dron, 3)
        inventario = self.inventario()
        inventario.cantidad_disponible = 1
        inventario.save()

        respuesta = self.confirmar()

        self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(Pedido.objects.exists())
        self.assertEqual(CarritoDetalle.objects.count(), 1)
        self.assertEqual(self.inventario().cantidad_reservada, 0)

    def test_base_de_datos_exige_que_el_total_cuadre(self):
        with self.assertRaises(IntegrityError), transaction.atomic():
            Pedido.objects.create(
                usuario=self.cliente, subtotal=100, total_impuestos=15, total_final=999
            )


class GestionPedidoTests(PedidoBaseTest):

    def setUp(self):
        super().setUp()
        self.agregar(self.dron, 2)
        self.pedido_id = self.confirmar().data['id']
        self.url_detalle_pedido = reverse('pedido-detail', args=[self.pedido_id])
        self.url_cancelar = reverse('pedido-cancelar', args=[self.pedido_id])

    def test_mis_pedidos(self):
        respuesta = self.client.get(self.url_pedidos)

        self.assertEqual(respuesta.status_code, status.HTTP_200_OK)
        self.assertEqual(len(respuesta.data), 1)

    def test_cancelar_libera_el_stock(self):
        respuesta = self.client.post(self.url_cancelar)

        self.assertEqual(respuesta.status_code, status.HTTP_200_OK)
        self.assertEqual(respuesta.data['estado_pedido'], 'CANCELADO')
        self.assertFalse(respuesta.data['puede_cancelar'])
        inventario = self.inventario()
        self.assertEqual(inventario.cantidad_disponible, 3)
        self.assertEqual(inventario.cantidad_reservada, 0)

    def test_no_se_cancela_dos_veces(self):
        self.client.post(self.url_cancelar)
        respuesta = self.client.post(self.url_cancelar)

        self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(self.inventario().cantidad_disponible, 3)

    def test_otro_cliente_no_ve_ni_cancela(self):
        otro = self.crear_usuario('otro@nexus.com', '0801199900804')
        self.client.force_authenticate(user=otro)

        self.assertEqual(self.client.get(self.url_pedidos).data, [])
        self.assertEqual(self.client.get(self.url_detalle_pedido).status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(self.client.post(self.url_cancelar).status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(Pedido.objects.get(pk=self.pedido_id).estado_pedido, 'PENDIENTE')

    def test_no_se_puede_editar_ni_borrar(self):
        self.assertEqual(
            self.client.patch(self.url_detalle_pedido, {'total_final': 1}, format='json').status_code,
            status.HTTP_405_METHOD_NOT_ALLOWED,
        )
        self.assertEqual(
            self.client.delete(self.url_detalle_pedido).status_code,
            status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    def test_no_se_borra_una_direccion_usada(self):
        respuesta = self.client.delete(reverse('direccion-detail', args=[self.direccion.id]))

        self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue(Direccion.objects.filter(pk=self.direccion.id).exists())


############################             4. PATRÓN STRATEGY (sin API)                    #####################################
 

class EstrategiasPagoTests(TestCase):

    def test_registro_tiene_las_tres_formas(self):
        self.assertEqual(set(ESTRATEGIAS), {'TARJETA', 'TRANSFERENCIA', 'CONTRA_ENTREGA'})

    def test_todas_cumplen_la_interfaz(self):
        for estrategia in ESTRATEGIAS.values():
            with self.subTest(estrategia=estrategia.clave):
                self.assertIsInstance(estrategia, EstrategiaPago)
                self.assertTrue(estrategia.nombre)

    def test_una_estrategia_sin_procesar_no_se_puede_crear(self):
        class EstrategiaIncompleta(EstrategiaPago):
            clave = 'INCOMPLETA'

        with self.assertRaises(TypeError):
            EstrategiaIncompleta()


####################################                    5. PAGOS                   ##########################################


class PagoBaseTest(PedidoBaseTest):

    def setUp(self):
        super().setUp()
        self.agregar(self.dron)
        self.pedido_id = self.confirmar().data['id']
        self.url_pagar = reverse('pedido-pagar', args=[self.pedido_id])
        self.tarjeta = self.crear_tarjeta('4242')

    def crear_tarjeta(self, ultimos, expiracion='12/2099', usuario=None):
        return MetodoPago.objects.create(
            usuario=usuario or self.cliente,
            tipo_tarjeta='Visa',
            ultimos_cuatro=ultimos,
            token_pasarela='tok_sim_prueba',
            fecha_expiracion=expiracion,
        )

    def pagar(self, **datos):
        return self.client.post(self.url_pagar, datos, format='json')

    def pedido(self):
        return Pedido.objects.get(pk=self.pedido_id)


class AgregarEstrategiaTests(PagoBaseTest):

    def test_nueva_forma_de_pago_sin_tocar_el_contexto(self):
        """Abierto/Cerrado: se registra una estrategia nueva y pagar_pedido la usa tal cual."""

        class PagoDePrueba(EstrategiaPago):
            clave = 'PRUEBA'
            nombre = 'Pago de prueba'

            def procesar(self, pedido, datos):
                return ResultadoPago(TransaccionPago.Estado.APROBADO, referencia='PRUEBA-1')

        with patch.dict(ESTRATEGIAS, {'PRUEBA': PagoDePrueba()}):
            transaccion, resultado = pagar_pedido(self.pedido(), 'PRUEBA')

        self.assertEqual(resultado.estado, 'APROBADO')
        self.assertEqual(transaccion.forma_pago, 'PRUEBA')
        self.assertEqual(self.pedido().estado_pedido, 'PAGADO')


class MetodoPagoAPITests(PagoBaseTest):

    def setUp(self):
        super().setUp()
        self.url_tarjetas = reverse('metodo-pago-list')

    def guardar(self, **cambios):
        datos = {
            'tipo_tarjeta': 'Mastercard',
            'ultimos_cuatro': '5555',
            'fecha_expiracion': '06/2030',
            'token_pasarela': 'tok_sim_abc',
            **cambios,
        }
        return self.client.post(self.url_tarjetas, datos, format='json')

    def test_formas_de_pago_salen_del_registro(self):
        respuesta = self.client.get(reverse('formas-pago'))

        self.assertEqual(respuesta.status_code, status.HTTP_200_OK)
        self.assertEqual({f['clave'] for f in respuesta.data}, set(ESTRATEGIAS))

    def test_guardar_tarjeta_sin_devolver_el_token(self):
        respuesta = self.guardar()

        self.assertEqual(respuesta.status_code, status.HTTP_201_CREATED)
        self.assertNotIn('token_pasarela', respuesta.data)
        self.assertFalse(respuesta.data['vencida'])
        self.assertEqual(MetodoPago.objects.get(pk=respuesta.data['id']).usuario, self.cliente)

    def test_datos_de_tarjeta_invalidos(self):
        casos = {
            'fecha_expiracion': ['13/2030', '2030-06', '01/2020'],
            'ultimos_cuatro': ['abcd', '123'],
        }
        for campo, valores in casos.items():
            for valor in valores:
                with self.subTest(campo=campo, valor=valor):
                    respuesta = self.guardar(**{campo: valor})
                    self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)
                    self.assertIn(campo, respuesta.data)

    def test_solo_ve_y_borra_sus_tarjetas(self):
        otro = self.crear_usuario('otro@nexus.com', '0801199900805')
        ajena = self.crear_tarjeta('1111', usuario=otro)

        ids = [t['id'] for t in self.client.get(self.url_tarjetas).data]
        self.assertNotIn(ajena.id, ids)

        respuesta = self.client.delete(reverse('metodo-pago-detail', args=[ajena.id]))
        self.assertEqual(respuesta.status_code, status.HTTP_404_NOT_FOUND)

    def test_no_se_borra_una_tarjeta_con_pagos(self):
        self.pagar(forma_pago='TARJETA', metodo_pago=self.tarjeta.id)

        respuesta = self.client.delete(reverse('metodo-pago-detail', args=[self.tarjeta.id]))

        self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue(MetodoPago.objects.filter(pk=self.tarjeta.id).exists())


class PagarConTarjetaTests(PagoBaseTest):

    def test_pago_aprobado(self):
        respuesta = self.pagar(forma_pago='TARJETA', metodo_pago=self.tarjeta.id)

        self.assertEqual(respuesta.status_code, status.HTTP_200_OK)
        self.assertEqual(respuesta.data['pago']['estado'], 'APROBADO')
        self.assertTrue(respuesta.data['pago']['referencia'].startswith('SIM-'))
        self.assertEqual(respuesta.data['pedido']['estado_pedido'], 'PAGADO')
        self.assertFalse(respuesta.data['pedido']['puede_pagar'])
        self.assertFalse(respuesta.data['pedido']['puede_cancelar'])

        transaccion = TransaccionPago.objects.get()
        self.assertEqual(transaccion.monto, self.pedido().total_final)

    def test_rechazada_se_registra_y_se_puede_reintentar(self):
        rechazada = self.crear_tarjeta('0000')

        respuesta = self.pagar(forma_pago='TARJETA', metodo_pago=rechazada.id)
        self.assertEqual(respuesta.data['pago']['estado'], 'RECHAZADO')
        self.assertEqual(self.pedido().estado_pedido, 'PENDIENTE')
        self.assertTrue(respuesta.data['pedido']['puede_pagar'])

        respuesta = self.pagar(forma_pago='TARJETA', metodo_pago=self.tarjeta.id)
        self.assertEqual(respuesta.data['pago']['estado'], 'APROBADO')
        self.assertEqual(TransaccionPago.objects.count(), 2)

    def test_tarjeta_obligatoria_vencida_o_ajena(self):
        otro = self.crear_usuario('otro@nexus.com', '0801199900806')
        casos = {
            'sin tarjeta': {},
            'vencida': {'metodo_pago': self.crear_tarjeta('9999', expiracion='01/2020').id},
            'de otro cliente': {'metodo_pago': self.crear_tarjeta('8888', usuario=otro).id},
        }
        for caso, datos in casos.items():
            with self.subTest(caso=caso):
                respuesta = self.pagar(forma_pago='TARJETA', **datos)
                self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)

        self.assertFalse(TransaccionPago.objects.exists())

    def test_no_se_paga_dos_veces(self):
        self.pagar(forma_pago='TARJETA', metodo_pago=self.tarjeta.id)
        respuesta = self.pagar(forma_pago='TARJETA', metodo_pago=self.tarjeta.id)

        self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(TransaccionPago.objects.count(), 1)

    def test_otro_cliente_no_puede_pagar(self):
        otro = self.crear_usuario('otro@nexus.com', '0801199900807')
        self.client.force_authenticate(user=otro)

        respuesta = self.pagar(forma_pago='TRANSFERENCIA')
        self.assertEqual(respuesta.status_code, status.HTTP_404_NOT_FOUND)

    def test_base_de_datos_exige_tarjeta_en_pagos_con_tarjeta(self):
        with self.assertRaises(IntegrityError), transaction.atomic():
            TransaccionPago.objects.create(
                pedido=self.pedido(), forma_pago='TARJETA', monto=100, estado_pago='APROBADO'
            )


class PagarSinTarjetaTests(PagoBaseTest):

    def test_transferencia_queda_pendiente_hasta_que_el_admin_confirma(self):
        respuesta = self.pagar(forma_pago='TRANSFERENCIA')

        self.assertEqual(respuesta.data['pago']['estado'], 'PENDIENTE')
        self.assertEqual(respuesta.data['pago']['referencia'], f'NEXUS-{self.pedido_id:06d}')
        self.assertEqual(self.pedido().estado_pedido, 'PENDIENTE')
        self.assertFalse(respuesta.data['pedido']['puede_pagar'])

        confirmar_pago(TransaccionPago.objects.get())

        self.assertEqual(self.pedido().estado_pedido, 'PAGADO')
        self.assertEqual(TransaccionPago.objects.get().estado_pago, 'APROBADO')

    def test_contra_entrega_requiere_envio(self):
        self.agregar(self.servicio)
        solo_servicio = self.client.post(self.url_pedidos, {}, format='json').data['id']

        respuesta = self.client.post(
            reverse('pedido-pagar', args=[solo_servicio]), {'forma_pago': 'CONTRA_ENTREGA'}, format='json'
        )
        self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)

        respuesta = self.pagar(forma_pago='CONTRA_ENTREGA')
        self.assertEqual(respuesta.data['pago']['estado'], 'PENDIENTE')

    def test_cancelar_rechaza_el_pago_pendiente(self):
        self.pagar(forma_pago='TRANSFERENCIA')
        self.client.post(reverse('pedido-cancelar', args=[self.pedido_id]))

        self.assertEqual(TransaccionPago.objects.get().estado_pago, 'RECHAZADO')
        respuesta = self.pagar(forma_pago='TRANSFERENCIA')
        self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)

    def test_no_se_confirma_dos_veces(self):
        self.pagar(forma_pago='TRANSFERENCIA')
        transaccion = TransaccionPago.objects.get()
        confirmar_pago(transaccion)

        with self.assertRaises(ValidationError):
            confirmar_pago(transaccion)


############################       6. COMPRAR AHORA (sin carrito)        #####################################


class ComprarAhoraTests(PedidoBaseTest):

    def test_resumen_de_una_variante(self):
        respuesta = self.client.post(self.url_resumen, {'variante': self.dron.id, 'cantidad': 1}, format='json')

        self.assertEqual(respuesta.status_code, status.HTTP_200_OK)
        self.assertEqual(respuesta.data['subtotal'], '18500.00')
        self.assertTrue(respuesta.data['requiere_direccion'])

    def test_comprar_ahora_no_toca_el_carrito(self):
        self.agregar(self.servicio)

        respuesta = self.confirmar(variante=self.dron.id, cantidad=1)

        self.assertEqual(respuesta.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(respuesta.data['detalles']), 1)
        self.assertEqual(respuesta.data['detalles'][0]['sku'], 'MINI5-STD')
        self.assertEqual(self.inventario().cantidad_reservada, 1)
        # Lo que había en el carrito sigue ahí
        self.assertEqual(CarritoDetalle.objects.get().variante, self.servicio)

    def test_comprar_ahora_respeta_el_stock(self):
        respuesta = self.confirmar(variante=self.dron.id, cantidad=4)

        self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(Pedido.objects.exists())

    def test_comprar_ahora_requiere_direccion(self):
        respuesta = self.client.post(self.url_pedidos, {'variante': self.dron.id}, format='json')
        self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)



############################       7. GESTIÓN DEL PEDIDO (procesar, enviar, entregar)       ##################


class GestionEnvioTests(PagoBaseTest):

    def pagar_con_tarjeta(self):
        self.pagar(forma_pago='TARJETA', metodo_pago=self.tarjeta.id)

    def test_flujo_completo_descuenta_el_stock(self):
        self.pagar_con_tarjeta()

        procesar_pedido(self.pedido())
        inventario = self.inventario()
        self.assertEqual(self.pedido().estado_pedido, 'EN_PROCESO')
        self.assertEqual(inventario.cantidad_reservada, 0)
        self.assertEqual(inventario.cantidad_disponible, 2)
        self.assertTrue(MovimientoInventario.objects.filter(tipo='SALIDA', inventario=inventario).exists())

        marcar_enviado(self.pedido())
        marcar_entregado(self.pedido())
        self.assertEqual(self.pedido().estado_pedido, 'ENTREGADO')

    def test_no_se_procesa_sin_pagar(self):
        with self.assertRaises(ValidationError):
            procesar_pedido(self.pedido())
        self.assertEqual(self.inventario().cantidad_reservada, 1)

    def test_no_se_saltan_estados(self):
        self.pagar_con_tarjeta()
        with self.assertRaises(ValidationError):
            marcar_enviado(self.pedido())          # falta procesar

        procesar_pedido(self.pedido())
        with self.assertRaises(ValidationError):
            marcar_entregado(self.pedido())        # falta enviar
        with self.assertRaises(ValidationError):
            procesar_pedido(self.pedido())         # no se descuenta dos veces

    def test_contra_entrega_se_cobra_al_entregar(self):
        self.pagar(forma_pago='CONTRA_ENTREGA')
        transaccion = TransaccionPago.objects.get()

        with self.assertRaises(ValidationError):
            confirmar_pago(transaccion)            # no se confirma por adelantado

        procesar_pedido(self.pedido())
        marcar_enviado(self.pedido())
        self.assertEqual(TransaccionPago.objects.get().estado_pago, 'PENDIENTE')

        marcar_entregado(self.pedido())
        self.assertEqual(TransaccionPago.objects.get().estado_pago, 'APROBADO')
        self.assertEqual(self.pedido().estado_pedido, 'ENTREGADO')

    def test_en_proceso_ya_no_se_cancela(self):
        self.pagar(forma_pago='CONTRA_ENTREGA')
        procesar_pedido(self.pedido())

        respuesta = self.client.post(reverse('pedido-cancelar', args=[self.pedido_id]))
        self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)

    def test_solo_servicios_no_se_procesa(self):
        self.agregar(self.servicio)
        pedido_id = self.client.post(self.url_pedidos, {}, format='json').data['id']
        self.client.post(
            reverse('pedido-pagar', args=[pedido_id]),
            {'forma_pago': 'TARJETA', 'metodo_pago': self.tarjeta.id}, format='json',
        )

        with self.assertRaises(ValidationError):
            procesar_pedido(Pedido.objects.get(pk=pedido_id))

############################       8. FACTURA       ############################


class FacturaTests(PagoBaseTest):

    def url_factura(self, pedido_id=None):
        return reverse('pedido-factura', args=[pedido_id or self.pedido_id])

    def test_pedido_pagado_descarga_el_pdf(self):
        self.pagar(forma_pago='TARJETA', metodo_pago=self.tarjeta.id)

        respuesta = self.client.get(self.url_factura())
        self.assertEqual(respuesta.status_code, status.HTTP_200_OK)
        self.assertEqual(respuesta['Content-Type'], 'application/pdf')
        self.assertIn(f'FAC-{self.pedido_id:06d}.pdf', respuesta['Content-Disposition'])
        self.assertTrue(respuesta.content.startswith(b'%PDF'))

    def test_sin_pagar_no_hay_factura(self):
        self.assertEqual(self.client.get(self.url_factura()).status_code, status.HTTP_400_BAD_REQUEST)

    def test_transferencia_pendiente_no_factura(self):
        self.pagar(forma_pago='TRANSFERENCIA')
        self.assertEqual(self.client.get(self.url_factura()).status_code, status.HTTP_400_BAD_REQUEST)

    def test_factura_disponible_en_el_pedido(self):
        self.assertFalse(self.client.get(reverse('pedido-detail', args=[self.pedido_id])).data['factura_disponible'])

        self.pagar(forma_pago='TARJETA', metodo_pago=self.tarjeta.id)
        self.assertTrue(self.client.get(reverse('pedido-detail', args=[self.pedido_id])).data['factura_disponible'])

    def test_no_descarga_facturas_ajenas(self):
        self.pagar(forma_pago='TARJETA', metodo_pago=self.tarjeta.id)
        otro = self.crear_usuario('otro.factura@nexus.com', '0801199900803')
        self.client.force_authenticate(user=otro)

        self.assertEqual(self.client.get(self.url_factura()).status_code, status.HTTP_404_NOT_FOUND)