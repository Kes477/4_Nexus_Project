from io import BytesIO

from django.utils import timezone
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
)


ESTADO_LABEL = {
    'PENDIENTE': 'Pendiente',
    'ACEPTADA': 'Aceptada',
    'EN_CURSO': 'En Curso',
    'COMPLETADA': 'Completada',
    'RECHAZADA': 'Rechazada',
    'CANCELADA': 'Cancelada',
}

FILTRO_LABEL = {
    'todos': 'Todos',
    'completados': 'Completados',
    'en_proceso': 'En proceso',
    'alertas': 'Alertas',
    'pendientes': 'Pendientes',
}

PERIODO_LABEL = {
    'semanal': 'Semanal',
    'mensual': 'Mensual',
    'anual': 'Anual',
}


def _fmt_fecha(fecha):
    if not fecha:
        return '—'
    if hasattr(fecha, 'strftime'):
        return fecha.strftime('%d/%m/%Y')
    return str(fecha)


def _fmt_duracion(horas):
    if horas is None:
        return '—'
    try:
        h = float(horas)
    except (TypeError, ValueError):
        return '—'
    entero = int(h)
    minutos = round((h - entero) * 60)
    if entero == 0:
        return f'{minutos} min'
    if minutos == 0:
        return f'{entero} h'
    return f'{entero} h {minutos} min'


def _fmt_horas_simple(n):
    try:
        return f'{float(n or 0):.1f} h'
    except (TypeError, ValueError):
        return '0.0 h'


def _fmt_money(n):
    try:
        return f'L {float(n or 0):,.2f}'
    except (TypeError, ValueError):
        return 'L 0.00'


def _fmt_categoria(cat):
    if not cat:
        return '—'
    if cat == 'TODAS':
        return 'Todos los servicios'
    return cat.replace('_', ' ').title()


def _get_cliente(m):
    nombre = getattr(m, 'cliente_nombre', None) or getattr(m, 'cliente', None)
    if not nombre or str(nombre).strip() == '' or str(nombre).lower() == 'uso personal':
        return 'Uso Personal'
    return str(nombre).strip()


def _calcular_duracion(m):
    if getattr(m, 'fecha_creacion', None) and getattr(m, 'fecha_cierre', None):
        diff = m.fecha_cierre - m.fecha_creacion
        horas = diff.total_seconds() / 3600
        return horas if horas > 0 else None
    return None


def generar_pdf_bitacora(piloto, misiones, filtro='todos', busqueda=''):
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=landscape(A4),
        leftMargin=14 * mm,
        rightMargin=14 * mm,
        topMargin=14 * mm,
        bottomMargin=18 * mm,
        title='Bitácora de Vuelos',
        author=f'{piloto.usuario.first_name} {piloto.usuario.last_name}'.strip(),
    )

    styles = getSampleStyleSheet()
    titulo = ParagraphStyle(
        'Titulo', parent=styles['Heading1'],
        fontSize=16, leading=20, spaceAfter=4,
        textColor=colors.HexColor('#0F172A'),
    )
    subtitulo = ParagraphStyle(
        'Subtitulo', parent=styles['Normal'],
        fontSize=9, leading=12, textColor=colors.HexColor('#475569'),
    )
    celda = ParagraphStyle(
        'Celda', parent=styles['Normal'],
        fontSize=7.5, leading=9,
    )
    celda_head = ParagraphStyle(
        'CeldaHead', parent=styles['Normal'],
        fontSize=8, leading=10, textColor=colors.white,
        fontName='Helvetica-Bold',
    )

    story = []

    story.append(Paragraph('Bitácora de Vuelos', titulo))

    nombre_piloto = f'{piloto.usuario.first_name} {piloto.usuario.last_name}'.strip() or 'Piloto'
    story.append(Paragraph(
        f'<b>Piloto:</b> {nombre_piloto} &nbsp;&nbsp;|&nbsp;&nbsp; '
        f'<b>Licencia:</b> {piloto.numero_licencia_aeronautica or "No registrada"}',
        subtitulo,
    ))
    story.append(Paragraph(
        f'<b>Generado:</b> {timezone.localtime().strftime("%d/%m/%Y %H:%M")} &nbsp;&nbsp;|&nbsp;&nbsp; '
        f'<b>Modo activo:</b> {FILTRO_LABEL.get(filtro, filtro)} &nbsp;&nbsp;|&nbsp;&nbsp; '
        f'<b>Búsqueda:</b> {busqueda or "(sin término)"}',
        subtitulo,
    ))
    story.append(Spacer(1, 8))

    encabezados = [
        Paragraph('Código', celda_head),
        Paragraph('Fecha', celda_head),
        Paragraph('Ubicación', celda_head),
        Paragraph('Cliente', celda_head),
        Paragraph('Servicio', celda_head),
        Paragraph('Dron', celda_head),
        Paragraph('Duración', celda_head),
        Paragraph('Estado', celda_head),
    ]

    filas = [encabezados]
    for m in misiones:
        duracion = _calcular_duracion(m)
        cliente = _get_cliente(m)

        filas.append([
            Paragraph(f'MIS-{str(m.id).zfill(4)}', celda),
            Paragraph(_fmt_fecha(m.fecha_programada), celda),
            Paragraph(m.ubicacion or '—', celda),
            Paragraph(cliente, celda),
            Paragraph(_fmt_categoria(m.categoria), celda),
            Paragraph(m.dron_asignado or '—', celda),
            Paragraph(_fmt_duracion(duracion), celda),
            Paragraph(ESTADO_LABEL.get(m.estado, m.estado), celda),
        ])

    tabla = Table(
        filas,
        repeatRows=1,
        colWidths=[20 * mm, 22 * mm, 40 * mm, 35 * mm, 35 * mm, 35 * mm, 22 * mm, 25 * mm],
    )
    tabla.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#03B394')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('GRID', (0, 0), (-1, -1), 0.25, colors.HexColor('#CBD5E1')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F1F5F9')]),
        ('LEFTPADDING', (0, 0), (-1, -1), 4),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    story.append(tabla)

    story.append(Spacer(1, 6))
    story.append(Paragraph(
        f'<b>Total de vuelos filtrados:</b> {len(misiones)}',
        subtitulo,
    ))

    def _pie(canvas, doc_):
        canvas.saveState()
        canvas.setFont('Helvetica', 7)
        canvas.setFillColor(colors.HexColor('#94A3B8'))
        ancho, _ = landscape(A4)
        canvas.drawString(14 * mm, 8 * mm, '4 NEXUS SOLUTIONS — Bitácora de Vuelos')
        canvas.drawRightString(
            ancho - 14 * mm, 8 * mm,
            f'Página {doc_.page}',
        )
        canvas.restoreState()

    doc.build(story, onFirstPage=_pie, onLaterPages=_pie)
    buffer.seek(0)
    return buffer.getvalue()


def generar_pdf_facturacion(piloto, registros, periodo='mensual', categoria='TODAS', total_periodo=0):
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=landscape(A4),
        leftMargin=14 * mm,
        rightMargin=14 * mm,
        topMargin=14 * mm,
        bottomMargin=18 * mm,
        title='Facturación y Ganancias',
        author=f'{piloto.usuario.first_name} {piloto.usuario.last_name}'.strip(),
    )

    styles = getSampleStyleSheet()
    titulo = ParagraphStyle(
        'Titulo', parent=styles['Heading1'],
        fontSize=16, leading=20, spaceAfter=4,
        textColor=colors.HexColor('#0F172A'),
    )
    subtitulo = ParagraphStyle(
        'Subtitulo', parent=styles['Normal'],
        fontSize=9, leading=12, textColor=colors.HexColor('#475569'),
    )
    celda = ParagraphStyle(
        'Celda', parent=styles['Normal'],
        fontSize=8.5, leading=11,
    )
    celda_head = ParagraphStyle(
        'CeldaHead', parent=styles['Normal'],
        fontSize=9, leading=11, textColor=colors.white,
        fontName='Helvetica-Bold',
    )

    story = []

    story.append(Paragraph('Facturación y Ganancias', titulo))

    nombre_piloto = f'{piloto.usuario.first_name} {piloto.usuario.last_name}'.strip() or 'Piloto'
    story.append(Paragraph(
        f'<b>Piloto:</b> {nombre_piloto} &nbsp;&nbsp;|&nbsp;&nbsp; '
        f'<b>Licencia:</b> {piloto.numero_licencia_aeronautica or "No registrada"}',
        subtitulo,
    ))
    story.append(Paragraph(
        f'<b>Generado:</b> {timezone.localtime().strftime("%d/%m/%Y %H:%M")} &nbsp;&nbsp;|&nbsp;&nbsp; '
        f'<b>Periodo:</b> {PERIODO_LABEL.get(periodo, periodo)} &nbsp;&nbsp;|&nbsp;&nbsp; '
        f'<b>Categoría:</b> {_fmt_categoria(categoria)}',
        subtitulo,
    ))
    story.append(Spacer(1, 8))

    encabezados = [
        Paragraph('Fecha', celda_head),
        Paragraph('Servicio', celda_head),
        Paragraph('Horas', celda_head),
        Paragraph('Monto', celda_head),
        Paragraph('Estado', celda_head),
    ]

    filas = [encabezados]
    for r in registros:
        filas.append([
            Paragraph(_fmt_fecha(r.get('fecha')), celda),
            Paragraph(_fmt_categoria(r.get('categoria')), celda),
            Paragraph(_fmt_horas_simple(r.get('horas')), celda),
            Paragraph(_fmt_money(r.get('monto')), celda),
            Paragraph(ESTADO_LABEL.get(r.get('estado'), r.get('estado') or '—'), celda),
        ])

    tabla = Table(
        filas,
        repeatRows=1,
        colWidths=[32 * mm, 95 * mm, 32 * mm, 42 * mm, 35 * mm],
    )
    tabla.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#03B394')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN', (2, 0), (3, -1), 'RIGHT'),
        ('GRID', (0, 0), (-1, -1), 0.25, colors.HexColor('#CBD5E1')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F1F5F9')]),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(tabla)

    story.append(Spacer(1, 8))
    story.append(Paragraph(
        f'<b>Servicios registrados:</b> {len(registros)} &nbsp;&nbsp;|&nbsp;&nbsp; '
        f'<b>Total del periodo:</b> {_fmt_money(total_periodo)}',
        subtitulo,
    ))

    def _pie(canvas, doc_):
        canvas.saveState()
        canvas.setFont('Helvetica', 7)
        canvas.setFillColor(colors.HexColor('#94A3B8'))
        ancho, _ = landscape(A4)
        canvas.drawString(14 * mm, 8 * mm, '4 NEXUS SOLUTIONS — Facturación y Ganancias')
        canvas.drawRightString(
            ancho - 14 * mm, 8 * mm,
            f'Página {doc_.page}',
        )
        canvas.restoreState()

    doc.build(story, onFirstPage=_pie, onLaterPages=_pie)
    buffer.seek(0)
    return buffer.getvalue()