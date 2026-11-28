"""
Genera la factura en PDF de un pedido pagado (compra, plan o reparación).

NOTA: documento sin validez fiscal. Una factura real en Honduras
necesita CAI y rango autorizado por el SAR.
Este Documento se utiliza únicamente con fines Demostrativos y Educativos para la Clase De Ingeniería de Software 
"""

from io import BytesIO
from xml.sax.saxutils import escape

from django.conf import settings
from django.utils import timezone
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from .models import TransaccionPago

COLOR_MARCA = colors.HexColor('#0E5E6F')
COLOR_SUAVE = colors.HexColor('#F2F5F7')
COLOR_TEXTO = colors.HexColor('#333333')


# ============================================================
# REGLAS (las usa la vista y el serializer)
# ============================================================

def pago_aprobado(pedido):
    "La última transacción aprobada del pedido, o None."
    return (pedido.transacciones
            .filter(estado_pago=TransaccionPago.Estado.APROBADO)
            .select_related('metodo_pago')
            .order_by('fecha_pago')
            .last())


def puede_facturar(pedido):
    "Solo se factura lo que ya se cobró."
    return pago_aprobado(pedido) is not None


def numero_factura(pedido):
    return f'FAC-{pedido.pk:06d}'


# ============================================================
# FORMATO
# ============================================================

def _lempiras(valor):
    return f'L {valor:,.2f}'


def _fecha(valor):
    return timezone.localtime(valor).strftime('%d/%m/%Y %H:%M') if valor else '—'


def _descripcion(detalle):
    "Texto de la línea. Si el pedido es de una reparación, dice qué equipo y qué orden."
    # escape(): los textos del usuario no deben romper el formato de reportlab (&, <, >)
    texto = f'{escape(detalle.variante.producto.nombre)} <font size="7" color="#777777">({escape(detalle.variante.sku)})</font>'
    orden = getattr(detalle.pedido, 'orden_reparacion', None)
    if orden is not None:
        texto += f'<br/><font size="8">Orden de servicio #{orden.pk} · {escape(str(orden.equipo))}</font>'
    return texto


def _forma_de_pago(pago):
    if pago is None:
        return '—'
    texto = pago.get_forma_pago_display()
    if pago.metodo_pago_id:
        texto += f' · {pago.metodo_pago.tipo_tarjeta} terminada en {pago.metodo_pago.ultimos_cuatro}'
    if pago.id_transaccion_externa:
        texto += f' · Ref. {escape(pago.id_transaccion_externa)}'
    return texto


# ============================================================
# PDF
# ============================================================

def generar_factura_pdf(pedido):
    "Devuelve los bytes del PDF de la factura del pedido."
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=letter,
        leftMargin=18 * mm, rightMargin=18 * mm, topMargin=16 * mm, bottomMargin=20 * mm,
        title=numero_factura(pedido), author='4 Nexus',
    )

    estilos = getSampleStyleSheet()
    normal = ParagraphStyle('normal', parent=estilos['Normal'], fontSize=9, leading=12, textColor=COLOR_TEXTO)
    titulo = ParagraphStyle('titulo', parent=normal, fontSize=20, leading=24, textColor=COLOR_MARCA)
    derecha = ParagraphStyle('derecha', parent=normal, alignment=2)

    pago = pago_aprobado(pedido)
    cliente = pedido.usuario
    elementos = []

    # --- Encabezado: empresa | número de factura ---
    encabezado = Table([[
        Paragraph('<b>4 NEXUS</b>', titulo),
        Paragraph(
            f'<b><font size="14">FACTURA</font></b><br/>'
            f'No. <b>{numero_factura(pedido)}</b><br/>'
            f'Pedido #{pedido.pk}<br/>'
            f'Emitida: {_fecha(pago.fecha_pago if pago else timezone.now())}',
            derecha,
        ),
    ]], colWidths=[95 * mm, 85 * mm])
    encabezado.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LINEBELOW', (0, 0), (-1, 0), 1.5, COLOR_MARCA),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
    ]))
    elementos += [encabezado, Spacer(1, 6 * mm)]

    # --- Cliente ---
    datos_cliente = (
        f'<b>Cliente:</b> {escape(cliente.get_full_name() or cliente.email)}<br/>'
        f'<b>Identificación:</b> {escape(getattr(cliente, "no_identificacion", "") or "—")}<br/>'
        f'<b>Correo:</b> {escape(cliente.email)}'
    )
    if pedido.direccion_id:
        direccion = pedido.direccion
        datos_cliente += (
            f'<br/><b>Dirección de envío:</b> '
            f'{escape(direccion.linea_direccion1)}, {escape(str(direccion.ubicacion))}'
        )
    elementos += [Paragraph(datos_cliente, normal), Spacer(1, 6 * mm)]

    # --- Detalle ---
    filas = [['Descripción', 'Cant.', 'Precio unit.', 'Subtotal']]
    for detalle in pedido.detalles.select_related('variante__producto'):
        filas.append([
            Paragraph(_descripcion(detalle), normal),
            str(detalle.cantidad),
            _lempiras(detalle.precio_unitario),
            _lempiras(detalle.subtotal_linea),
        ])
    tabla = Table(filas, colWidths=[100 * mm, 15 * mm, 32 * mm, 33 * mm], repeatRows=1)
    tabla.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), COLOR_MARCA),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, COLOR_SUAVE]),
        ('LINEBELOW', (0, -1), (-1, -1), 0.5, colors.lightgrey),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    elementos += [tabla, Spacer(1, 4 * mm)]

    # --- Totales (solo se muestran las filas que aplican) ---
    tasa = int(settings.VENTAS_TASA_ISV * 100)
    totales = [['Subtotal', _lempiras(pedido.subtotal)]]
    if pedido.total_descuento:
        cupon = f' ({pedido.cupon.codigo})' if pedido.cupon_id else ''
        totales.append([f'Descuento{cupon}', f'- {_lempiras(pedido.total_descuento)}'])
    if pedido.costo_envio:
        totales.append(['Envío', _lempiras(pedido.costo_envio)])
    totales.append([f'ISV ({tasa} %)', _lempiras(pedido.total_impuestos)])
    totales.append(['TOTAL', _lempiras(pedido.total_final)])

    tabla_totales = Table(totales, colWidths=[40 * mm, 35 * mm], hAlign='RIGHT')
    tabla_totales.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, -1), (-1, -1), 11),
        ('TEXTCOLOR', (0, -1), (-1, -1), COLOR_MARCA),
        ('LINEABOVE', (0, -1), (-1, -1), 1, COLOR_MARCA),
        ('TOPPADDING', (0, -1), (-1, -1), 6),
    ]))
    elementos += [tabla_totales, Spacer(1, 8 * mm)]

    # --- Pago ---
    elementos.append(Paragraph(
        f'<b>Forma de pago:</b> {_forma_de_pago(pago)}<br/>'
        f'<b>Fecha de pago:</b> {_fecha(pago.fecha_pago if pago else None)}',
        normal,
    ))

    # --- Pie en cada página ---
    def pie(canvas, documento):
        canvas.saveState()
        canvas.setFont('Helvetica', 7)
        canvas.setFillColor(colors.grey)
        canvas.drawCentredString(
            letter[0] / 2, 10 * mm,
            'Documento sin validez fiscal – proyecto académico 4 Nexus (UNAH-CU). '
            f'Generado el {_fecha(timezone.now())}.',
        )
        canvas.restoreState()

    doc.build(elementos, onFirstPage=pie, onLaterPages=pie)
    return buffer.getvalue()
