import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

/* TARJETA DE SERVICIO (ServiceCard) */
export const ServiceCard = ({ service }) => {
    const Icon = service.icon;

    return (
        <article
            style={{
                background: "var(--white)",
                padding: "25px",
                borderRadius: "8px",
                border: "1px solid var(--light-gray)",
                display: "flex",
                flexDirection: "column",
                gap: "15px",
                height: "100%",
                transition: "all 0.3s ease",
            }}
        >
            {/* Parte superior: Icono y Número */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                <div
                    style={{
                        background: "rgba(4, 201, 166, 0.1)",
                        color: "var(--color-primary)",
                        padding: "12px",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <Icon size={23} strokeWidth={1.7} />
                </div>
                <span
                    style={{
                        color: "var(--light-gray)",
                        fontSize: "24px",
                        fontWeight: "700",
                        fontFamily: "monospace",
                    }}
                >
                    {service.number}
                </span>
            </div>

            {/* Etiqueta y Título */}
            <span
                style={{
                    fontSize: "12px",
                    color: "var(--color-primary)",
                    fontWeight: "700",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                }}
            >
                {service.tag}
            </span>

            <h3
                style={{
                    color: "var(--color-dark)",
                    fontSize: "18px",
                    margin: 0,
                    fontWeight: "700",
                }}
            >
                {service.title}
            </h3>

            {/* Descripción */}
            <p
                style={{
                    color: "var(--text-light)",
                    fontSize: "14px",
                    lineHeight: "1.6",
                    margin: 0,
                    flexGrow: 1,
                }}
            >
                {service.description}
            </p>

            {/* Línea decorativa inferior */}
            <span
                style={{
                    width: "40px",
                    height: "3px",
                    background: "var(--color-primary)",
                    borderRadius: "2px",
                    marginTop: "10px",
                }}
            />
        </article>
    );
};

/* TARJETA DE PRODUCTO / DRON (ProductCard) */
export const ProductCard = ({ product }) => {
    const Icon = product.icon;

    return (
        <article
            style={{
                background: "var(--white)",
                borderRadius: "8px",
                border: "1px solid var(--light-gray)",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                height: "100%",
                transition: "all 0.3s ease",
            }}
        >
            {/* Imagen y etiquetas flotantes */}
            <div
                style={{
                    position: "relative",
                    height: "200px",
                    background: "var(--bg-color)",
                }}
            >
                <img
                    src={product.image}
                    alt={product.name}
                    loading="lazy"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />

                {/* Etiqueta de oferta/nuevo (Badge) */}
                <span
                    style={{
                        position: "absolute",
                        top: "15px",
                        left: "15px",
                        background: "var(--color-danger)",
                        color: "var(--white)",
                        padding: "4px 10px",
                        borderRadius: "20px",
                        fontSize: "12px",
                        fontWeight: "bold",
                    }}
                >
                    {product.label}
                </span>

                {/* Icono flotante superior derecho */}
                <span
                    style={{
                        position: "absolute",
                        top: "15px",
                        right: "15px",
                        background: "var(--white)",
                        color: "var(--color-primary)",
                        padding: "8px",
                        borderRadius: "50%",
                        display: "flex",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    }}
                >
                    <Icon size={19} />
                </span>
            </div>

            {/* Contenido de la tarjeta */}
            <div
                style={{
                    padding: "20px",
                    display: "flex",
                    flexDirection: "column",
                    flexGrow: 1,
                }}
            >
                <span
                    style={{
                        color: "var(--color-primary)",
                        fontSize: "12px",
                        fontWeight: "500",
                        marginBottom: "5px",
                    }}
                >
                    {product.category}
                </span>

                <h3
                    style={{
                        color: "var(--color-dark)",
                        fontSize: "18px",
                        margin: "0 0 10px 0",
                        fontWeight: "700",
                    }}
                >
                    {product.name}
                </h3>

                <p
                    style={{
                        color: "var(--text-light)",
                        fontSize: "13px",
                        lineHeight: "1.5",
                        margin: "0 0 20px 0",
                        flexGrow: 1,
                    }}
                >
                    {product.description}
                </p>

                {/* Footer de la tarjeta: Precio y Botón */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        borderTop: "1px solid var(--light-gray)",
                        paddingTop: "15px",
                    }}
                >
                    <div style={{ display: "flex", flexDirection: "column" }}>
                        <span
                            style={{
                                fontSize: "10px",
                                color: "var(--text-light)",
                                textTransform: "uppercase",
                                fontWeight: "bold",
                            }}
                        >
                            Precio
                        </span>
                        <strong style={{ fontSize: "18px", color: "var(--color-dark)" }}>
                            {product.price}{" "}
                            <small style={{ fontSize: "12px", color: "var(--text-light)" }}>
                                Lps
                            </small>
                        </strong>
                    </div>

                    {/* Botón de acción tipo IconButton usando Link */}
                    <Link
                        to="/contacto"
                        aria-label={`Consultar ${product.name}`}
                        style={{
                            background: "var(--color-primary)",
                            color: "var(--white)",
                            width: "40px",
                            height: "40px",
                            borderRadius: "6px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            textDecoration: "none",
                            transition: "background 0.3s",
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.background = "#03b394")}
                        onMouseOut={(e) =>
                        (e.currentTarget.style.background = "var(--color-primary)")
                        }
                    >
                        <ArrowUpRight size={20} />
                    </Link>
                </div>
            </div>
        </article>
    );
};
