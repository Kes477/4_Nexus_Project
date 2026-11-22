from io import BytesIO
from datetime import datetime

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
        Paragraph('Objetivo', celda_head),
        Paragraph('Dron', celda_head),
        Paragraph('Duración', celda_head),
        Paragraph('Estado', celda_head),
    ]

    filas = [encabezados]
    for m in misiones:
        duracion = getattr(m, 'duracion_horas', None)
        if duracion is None:
            duracion = getattr(m, 'horas_vuelo', None)

        filas.append([
            Paragraph(f'MIS-{str(m.id).zfill(4)}', celda),
            Paragraph(_fmt_fecha(m.fecha_programada), celda),
            Paragraph(m.ubicacion or '—', celda),
            Paragraph(m.descripcion or m.categoria or '—', celda),
            Paragraph(m.dron_asignado or '—', celda),
            Paragraph(_fmt_duracion(duracion), celda),
            Paragraph(ESTADO_LABEL.get(m.estado, m.estado), celda),
        ])

    tabla = Table(
        filas,
        repeatRows=1,
        colWidths=[20 * mm, 22 * mm, 45 * mm, 65 * mm, 38 * mm, 20 * mm, 24 * mm],
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