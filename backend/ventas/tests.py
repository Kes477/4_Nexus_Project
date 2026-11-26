from decimal import Decimal

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from catalogo.models import Articulo, Categoria, Producto, Variante
from inventario.models import Almacen, Inventario

from .models import CarritoDetalle
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