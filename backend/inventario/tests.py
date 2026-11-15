from django.test import TestCase
from decimal import Decimal
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from catalogo.models import Articulo, Categoria, Producto, Variante
from usuarios.models import Usuario
from . import servicios
from .models import Almacen, Inventario, MovimientoInventario

Tipo = MovimientoInventario.Tipo

class InventarioBaseTest(TestCase):
    ###########     Datos comunes de un Dron con 10 unidades
    def setUp(self):
        self.categoria = Categoria.objects.create(nombre = 'Fotografía')
        producto = Producto.objects.create(categoria = self.categoria, nombre ='Mini 5 Pro')
        Articulo.objects.create(producto = producto, marca='DJI')
        self.variante = Variante.objects.create(
            producto=producto, sku='MINI5-STD',precio=Decimal('18500')
        )
        self.almacen = Almacen.objects.create(nombre='Tegucigalpa',direccion='Francisco Morazan')
        self.inventario = Inventario.objects.create(
            almacen =self.almacen, variante= self.variante, cantidad_disponible = 10
        )
        self.usuario = Usuario.objects.create_user(
            email='bodega@nexus.com',
            password = 'Clave-Segura-2026*',
            no_identificacion = '0801199900030',
            first_name = 'said',
            last_name = 'Rodriguez',
        )

    def assertStock(self, disponible, reservada):
        self.inventario.refresh_from_db()
        self.assertEqual(self.inventario.cantidad_disponible, disponible)
        self.assertEqual(self.inventario.cantidad_reservada, reservada)

    
#### PRUEBAS DE MODELOS Y RESTRICCIONES ########

class InventarioModelTests(InventarioBaseTest):

    def test_una_variante_por_almacen(self):
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Inventario.objects.create(almacen=self.almacen, variante = self.variante)

    def test_BD_rechaza_stock_negativo(self):
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Inventario.objects.filter(pk=self.inventario.pk).update(cantidad_disponible=-30)

    def test_movimiento_cero_rechazado(self):
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                MovimientoInventario.objects.create(inventario=self.inventario, tipo= Tipo.ENTRADA, cantidad=0)

    def test_servicio_no_puede_tener_inventario(self):
        servicio = Producto.objects.create(
            categoria = self.categoria,
            nombre= 'Fotografía aérea',
            tipo_producto = Producto.Tipo.SERVICIO,
        )
        variante = Variante.objects.create(
            producto = servicio, sku ='FOTO 1H', precio= Decimal('1500')
        )
        with self.assertRaises(ValidationError):
            Inventario(almacen=self.almacen, variante = variante).clean()

    def test_cantidad_total(self):
        self.inventario.cantidad_reservada = 3
        self.assertEqual(self.inventario.cantidad_total, 13)

########### PRUEBAS EN LA CAPA DE SERVICIOS ##############

class InventarioServiciosTests(InventarioBaseTest):

    def test_registrar_entrada(self):
        servicios.registrar_entrada(self.inventario,5,self.usuario, 'Compra a Proveedor')
        self.assertStock(disponible=15, reservada=0)

        movimiento = MovimientoInventario.objects.get()
        self.assertEqual(movimiento.tipo, Tipo.ENTRADA)
        self.assertEqual(movimiento.cantidad,5)
        self.assertEqual(movimiento.usuario, self.usuario)

    def test_reservar_stock(self):
        servicios.reservar_stock(self.inventario,3)
        self.assertStock(disponible=7, reservada=3)
        self.assertEqual(MovimientoInventario.objects.get().tipo, Tipo.RESERVA)

    def test_reservar_mas_de_lo_disponible(self):
        with self.assertRaises(ValidationError):
            servicios.reservar_stock(self.inventario, 11)
        self.assertStock(disponible=10, reservada=0)
        self.assertFalse(MovimientoInventario.objects.exists())

    def test_liberar_reserva(self):
        servicios.reservar_stock(self.inventario, 3)
        servicios.liberar_reserva(self.inventario,2)
        self.assertStock(disponible=9, reservada=1)
    
    def test_liberar_mas_de_lo_reservado(self):
        servicios.reservar_stock(self.inventario,1)
        with self.assertRaises(ValidationError):
            servicios.liberar_reserva(self.inventario,2)
        self.assertStock(disponible=9, reservada=1)

    def test_confirmar_salida(self):
        servicios.reservar_stock(self.inventario,3)
        servicios.confirmar_salida(self.inventario,3)
        self.assertStock(disponible=7, reservada=0)

    def test_salida_sin_reserva(self):
        with self.assertRaises(ValidationError):
            servicios.confirmar_salida(self.inventario,1)
        self.assertStock(disponible=10, reservada=0)

    def test_cantidades_invalidas_rechazadas(self):
        operaciones = [
            servicios.registrar_entrada,
            servicios.reservar_stock,
            servicios.liberar_reserva,
            servicios.confirmar_salida,
        ]

        for operacion in operaciones:
            for cantidad in[0,-5]:
                with self.subTest(operacion=operacion.__name__, cantidad=cantidad):
                    with self.assertRaises(ValidationError):
                        operacion(self.inventario, cantidad)
                    self.assertStock(disponible=10, reservada=0)
        self.assertFalse(MovimientoInventario.objects.exists())


    def test_ajuste_registra_diferencia_con_signo(self):
        servicios.ajustar_inventario(self.inventario, 8, self.usuario, 'Conteo físico: 2 dañados')
        self.assertStock(disponible=8, reservada=0)
        self.assertEqual(MovimientoInventario.objects.get().cantidad, -2)

    def test_ajuste_requiere_motivo(self):
        with self.assertRaises(ValidationError):
            servicios.ajustar_inventario(self.inventario, 8, self.usuario, ' ')
        self.assertStock(disponible=10, reservada=0)

    def test_ajuste_sin_diferencia(self):
        with self.assertRaises(ValidationError):
            servicios.ajustar_inventario(self.inventario, 10 , self.usuario, 'conteo')

    def test_ajuste_negativo(self):
        with self.assertRaises(ValidationError):
            servicios.ajustar_inventario(self.inventario, -1, self.usuario, 'conteo')

    def test_servicio_devuelve_inventario_actualizado(self):
        resultado = servicios.registrar_entrada(self.inventario, 5)
        self.assertEqual(resultado.cantidad_disponible, 15)

    def test_kardex_completo(self):
        servicios.registrar_entrada(self.inventario,5)
        servicios.reservar_stock(self.inventario,2)
        servicios.confirmar_salida(self.inventario,2)

        tipos = list(MovimientoInventario.objects.order_by('id').values_list('tipo', flat=True))
        self.assertEqual(tipos, [Tipo.ENTRADA, Tipo.RESERVA, Tipo.SALIDA])
        self.assertStock(disponible=13, reservada=0)