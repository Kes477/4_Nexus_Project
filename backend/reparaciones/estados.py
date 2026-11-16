
"""
MÓDULO: REPARACIONES
ARCHIVO: estados.py

PATRÓN DE DISEÑO: STATE (ESTADO)
================================

OBJETIVO:
    Encapsular las reglas de transición de las órdenes
    de reparación en clases independientes.

PROBLEMA RESUELTO:
    Anteriormente, el modelo OrdenServicio contenía
    directamente un diccionario con todas las transiciones.

    Esto provocaba que el modelo conociera las reglas
    particulares de cada estado.

SOLUCIÓN:
    Cada estado se representa mediante una clase que
    implementa el contrato común EstadoOrden.

    OrdenServicio solicita a FabricaEstados la clase
    correspondiente y delega la validación de transiciones.

PRINCIPIOS SOLID
================

S - SRP (SINGLE RESPONSIBILITY PRINCIPLE)
    Responsabilidad Única.

    Cada clase concreta define únicamente las transiciones
    permitidas para un estado específico.

    La fábrica tiene la responsabilidad independiente
    de seleccionar la implementación correspondiente.

O - OCP (OPEN/CLOSED PRINCIPLE)
    Abierto/Cerrado.

    Es posible crear nuevas implementaciones de EstadoOrden
    sin modificar las clases de estado existentes.

    Para incorporar un nuevo estado al sistema también
    debe registrarse en FabricaEstados y en el modelo Django.

L - LSP (LISKOV SUBSTITUTION PRINCIPLE)
    Sustitución de Liskov.

    Todas las clases concretas heredan de EstadoOrden
    y respetan el mismo contrato.

    Por tanto, pueden utilizarse mediante la clase base
    sin cambiar la forma de invocar sus métodos.

I - ISP (INTERFACE SEGREGATION PRINCIPLE)
    Segregación de Interfaces.

    EstadoOrden expone un contrato pequeño y específico
    para la validación de transiciones.

    Las clases concretas no están obligadas a implementar
    métodos ajenos a esta responsabilidad.

D - DIP (DEPENDENCY INVERSION PRINCIPLE)
    Inversión de Dependencias.

    El comportamiento común puede utilizarse mediante
    la abstracción EstadoOrden, en lugar de depender
    de los métodos particulares de cada estado.

    La fábrica selecciona las implementaciones concretas.

NOTA:
    ISP y DIP se favorecen mediante esta estructura,
    pero su cumplimiento completo requiere evaluar
    las dependencias del resto del módulo.
"""

from abc import ABC, abstractmethod

class EstadoOrden(ABC):
    """
    CLASE ABSTRACTA DEL PATRÓN STATE.

    PRINCIPIOS SOLID:
        SRP: Define exclusivamente el contrato de transiciones.
        ISP: Mantiene una interfaz pequeña y específica.
        LSP: Establece el comportamiento común de los estados.

    Responsabilidad:
        Definir las operaciones que deben ofrecer
        todas las clases de estado.

    Esta clase no conoce Django, la base de datos,
    los permisos ni las solicitudes HTTP.
    """

    @abstractmethod
    def transiciones_permitidas(self):
        """
        Devuelve los estados a los que se permite avanzar.

        Las clases concretas deben implementar este método.

        Retorna:
            list[str]: Identificadores de estados permitidos.
        """
        pass

    def puede_cambiar_a(self, nuevo_estado):
        """
        Comprueba si una transición está permitida.

        PRINCIPIO LSP:
            Este método funciona con cualquier implementación
            válida de EstadoOrden.

        Parámetros:
            nuevo_estado (str): Estado de destino.

        Retorna:
            bool: True si la transición está permitida.
        """
        return nuevo_estado in self.transiciones_permitidas()

class EstadoRecibida(EstadoOrden):
    """
    Estado inicial de una orden.

    PRINCIPIO SRP:
        Define exclusivamente las transiciones
        permitidas desde RECIBIDA.
    """

    def transiciones_permitidas(self):
        """Permite iniciar el diagnóstico o cancelar."""
        return ["EN_DIAGNOSTICO", "CANCELADA"]

class EstadoDiagnostico(EstadoOrden):
    """
    Estado de una orden en diagnóstico.

    PRINCIPIO SRP:
        Define las transiciones desde EN_DIAGNOSTICO.
    """

    def transiciones_permitidas(self):
        """Permite iniciar la reparación o cancelar."""
        return ["EN_REPARACION", "CANCELADA"]

class EstadoReparacion(EstadoOrden):
    """
    Estado de una orden en proceso de reparación.

    PRINCIPIO SRP:
        Define las transiciones desde EN_REPARACION.
    """

    def transiciones_permitidas(self):
        """Permite finalizar la reparación o cancelar."""
        return ["FINALIZADA", "CANCELADA"]

class EstadoFinalizada(EstadoOrden):
    """
    Estado de una reparación finalizada.

    PRINCIPIO SRP:
        Define las transiciones desde FINALIZADA.
    """

    def transiciones_permitidas(self):
        """Permite entregar la orden o cancelarla."""
        return ["ENTREGADA", "CANCELADA"]

class EstadoEntregada(EstadoOrden):
    """
    Estado terminal de una orden entregada.

    REGLA DE NEGOCIO:
        No permite realizar nuevas transiciones.

    PRINCIPIO LSP:
        Conserva el contrato de EstadoOrden y devuelve
        una lista vacía, sin generar errores especiales.
    """

    def transiciones_permitidas(self):
        """No existen transiciones permitidas."""
        return []

class EstadoCancelada(EstadoOrden):
    """
    Estado terminal de una orden cancelada.

    REGLA DE NEGOCIO:
        No permite realizar nuevas transiciones.

    PRINCIPIO LSP:
        Implementa el mismo contrato que los demás estados.
    """

    def transiciones_permitidas(self):
        """No existen transiciones permitidas."""
        return []

class FabricaEstados:
    """
    PATRÓN COMPLEMENTARIO: FÁBRICA SIMPLE.

    Responsabilidad:
        Seleccionar la clase de estado correspondiente
        al identificador recibido.

    PRINCIPIO SRP:
        Centraliza la creación de objetos de estado.

    PRINCIPIO OCP:
        Las clases de estado existentes no necesitan
        modificarse al agregar nuevas implementaciones.

        Sin embargo, esta fábrica utiliza un registro
        explícito que debe actualizarse cuando se
        incorpora un nuevo estado.

    IMPORTANTE:
        Esta es una fábrica simple, no una implementación
        completa del patrón GoF Factory Method.
    """

    _estados = {
        "RECIBIDA": EstadoRecibida,
        "EN_DIAGNOSTICO": EstadoDiagnostico,
        "EN_REPARACION": EstadoReparacion,
        "FINALIZADA": EstadoFinalizada,
        "ENTREGADA": EstadoEntregada,
        "CANCELADA": EstadoCancelada,
    }

    @classmethod
    def obtener(cls, estado):
        """
        Obtiene una instancia del estado solicitado.

        Parámetros:
            estado (str): Identificador del estado actual.

        Retorna:
            EstadoOrden: Implementación correspondiente.

        Lanza:
            ValueError: Si el estado no está registrado.

        PRINCIPIO LSP:
            Todas las instancias devueltas respetan
            el contrato definido por EstadoOrden.
        """

        clase_estado = cls._estados.get(estado)

        if clase_estado is None:
            raise ValueError(
                f"Estado desconocido: {estado}"
            )

        return clase_estado()