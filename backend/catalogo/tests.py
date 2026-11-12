from decimal import Decimal
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.db.models import ProtectedError
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from .models import (Articulo, AtributoVariante, Categoria, ImagenArticulo, Producto, Variante,)

def crear_dron(categoria, nombre, precios, activo=True):
    #crea un tipo de articulo con su ficha técnica y variantes
    producto = Producto.objects.create(categoria=categoria, nombre=nombre, activo = activo)
    articulo = Articulo.objects.create(producto=producto, marca='DJI', modelo=nombre)

    for numero, precio in enumerate(precios):
        Variante.objects.create(
            producto=producto,
            sku=f'{nombre}-{numero}',
            precio = Decimal(precio),
        )
    return producto, articulo



# 1 PRUEBAS DE LOS MODELOS Y RESTRICCIONES

class CatalogoModelTests(TestCase):
    def setUp(self):
        self.categoria = Categoria.objects.create(nombre='Fotografía')
        self.producto,self.articulo = crear_dron(self.categoria, 'Mini 5 Pro', [18500])

    def test_precio_mayor_a_cero(self):
        for precio in ['0','-100']:
            with self.subTest(precio=precio):
                with self.assertRaises(IntegrityError):
                    with transaction.atomic():
                        Variante.objects.create(
                            producto = self.producto,
                            sku = f'SKU - {precio}',
                            precio = Decimal(precio),
                        ) 

    def test_sku_duplicado(self):
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Variante.objects.create(
                    producto=self.producto,
                    sku='Mini 5 Pro-0',
                    precio = Decimal('100')
                )

    def test_una_imagen_principal(self):
        ImagenArticulo.objects.create(
            articulo=self.articulo,
            url_imagen = 'https://ejemplo.com/1.jpg',
            imagen_principal = True
        )

        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                ImagenArticulo.objects.create(
                    articulo = self.articulo,
                    url_imagen = 'https://ejemplo.com/2.jpg',
                    imagen_principal= True,

                )


    def test_varias_imagenes_secundarias_permitidas(self):
        for numero in range(3):
            ImagenArticulo.objects.create(
                articulo=self.articulo, url_imagen =f'https://ejemplo.com/{numero}.jpg'
            )
        self.assertEqual(self.articulo.imagenes.count(),3)

    def test_atributo_duplicado_variante(self):
        variante = self.producto.variantes.first()
        AtributoVariante.objects.create(
            variante=variante, nombre_atributo = 'Paquete', valor_atributo = 'Estandar'
        )
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                AtributoVariante.objects.create(
                    variante=variante, nombre_atributo ='Paquete',valor_atributo ='Combo'
                )

    def test_servicio_no_puede_tener_articulo(self):
        servicio = Producto.objects.create(
            categoria = self.categoria,
            nombre = 'Fotografía aérea',
            tipo_producto = Producto.Tipo.SERVICIO
        )
        with self.assertRaises(ValidationError):
            Articulo(producto=servicio, marca='DJI').clean()

    def test_no_borrar_categoria_con_productos(self):
        with self.assertRaises(ProtectedError):
            self.categoria.delete()


# PRUEBAS DE LA API DE CATÁLOGO

class CatalogoAPITest(APITestCase):
    def setUp(self):
        self.fotografia = Categoria.objects.create(nombre='Fotografía')
        self.agricultura = Categoria.objects.create(nombre='Agricultura')
        self.mini, articulo_mini = crear_dron(self.fotografia, 'Mini 5 Pro', ['25000','18500'])
        ImagenArticulo.objects.create(
            articulo = articulo_mini, url_imagen='https://ejemplo.com/principal.jpg',
            imagen_principal =True, orden = 0,
        )
        ImagenArticulo.objects.create(
             articulo = articulo_mini, url_imagen='https://ejemplo.com/secundario.jpg', orden = 1,
        )

        self.agras, _ =crear_dron(self.agricultura, 'Agras T50',[350000])
        self.inactivo, _ = crear_dron(self.fotografia, 'Dron Inactivo',['1000'], activo=False,)
        self.url_lista = reverse('producto-list')

    def nombres(self, respuesta):
        return [producto['nombre'] for producto in respuesta.data]

    def test_lista_publica(self):
        respuesta = self.client.get(self.url_lista)
        self.assertEqual(respuesta.status_code, status.HTTP_200_OK)

    def test_lista_funciona_con_token_vencido(self):
        self.client.credentials(HTTP_AUTHORIZATION='Bearer token_invalido')
        respuesta = self.client.get(self.url_lista)
        self.assertEqual(respuesta.status_code, status.HTTP_200_OK)

    def test_no_muestra_productos_inactivos(self):
        respuesta = self.client.get(self.url_lista)
        self.assertNotIn('Dron Inactivo', self.nombres(respuesta))
        self.assertEqual(len(respuesta.data),2)

    def test_precio_desde_el_minimo(self):
        respuesta = self.client.get(self.url_lista)
        mini = next(p for p in respuesta.data if p['id'] == self.mini.id)
        self.assertEqual(mini['precio_desde'], '18500.00')

    def test_imagen_principal_en_lista(self):
        respuesta = self.client.get(self.url_lista)
        mini = next(p for p in respuesta.data if p['id'] == self.mini.id)
        self.assertEqual(mini['imagen_principal'], 'https://ejemplo.com/principal.jpg')

    def test_detalle_ficha_imagen_variantes(self):
        url = reverse('producto-detail', args=[self.mini.id])
        respuesta = self.client.get(url)

        self.assertEqual(respuesta.status_code, status.HTTP_200_OK)
        self.assertEqual(respuesta.data['articulo']['marca'],'DJI')
        self.assertEqual(len(respuesta.data['articulo']['imagenes']),2)
        self.assertEqual(len(respuesta.data['variantes']),2)
        self.assertEqual(respuesta.data['variantes'][0]['precio'],'18500.00')

    def test_detalle_producto_inactivo(self):
        url = reverse('producto-detail',args = [self.inactivo.id])
        respuesta = self.client.get(url)
        self.assertEqual(respuesta.status_code, status.HTTP_404_NOT_FOUND)

    def test_busqueda(self):
        respuesta = self.client.get(self.url_lista, {'search':'mini'}) 
        self.assertEqual(self.nombres(respuesta),['Mini 5 Pro']) 

    def test_filtro_por_categoria(self):
        respuesta = self.client.get(self.url_lista, {'categoria': self.agricultura.id})
        self.assertEqual(self.nombres(respuesta), ['Agras T50'])

    def test_ordenar_por_precio(self):
        respuesta = self.client.get(self.url_lista, {'ordering': 'precio_desde'}) 
        self.assertEqual(self.nombres(respuesta), ['Mini 5 Pro','Agras T50'])

    def test_api_lectura(self):
        respuesta = self.client.post(self.url_lista, {'nombre':'Hackeado'}, format='json')
        self.assertEqual(respuesta.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_lista_categorias(self):
        respuesta = self.client.get(reverse('categoria-list'))
        self.assertEqual(respuesta.status_code, status.HTTP_200_OK)
        self.assertEqual(len(respuesta.data),2)