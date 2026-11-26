from decimal import Decimal
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.test import override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from catalogo.models import Articulo, Categoria, Producto, Variante
from inventario.models import Almacen, Inventario
from ubicaciones.models import Direccion, Ubicacion

from .models import CarritoDetalle, Cupon, Pedido, ReservaPedido
from .servicios import stock_disponible

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