import { Check } from "lucide-react";
import { Button } from "../ui/Button";

/* TARJETA DE SERVICIO / SUSCRIPCIÓN (ServiceCard) */
export const ServiceCard = ({ service }) => {
    const Icon = service.icon;

    return (
        <article
            style={{
                background: "var(--white)",
                padding: "20px",
                borderRadius: "10px",
                border: service.destacado ? "2px solid var(--color-primary)" : "1px solid var(--light-gray)",
                display: "flex",
                flexDirection: "column",
                height: "100%",
                position: "relative",
                boxShadow: service.destacado ? "0 10px 30px rgba(4, 201, 166, 0.15)" : "0 4px 15px rgba(0,0,0,0.03)",
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-5px)";
                e.currentTarget.style.boxShadow = "0 15px 35px rgba(0,0,0,0.08)";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = service.destacado ? "0 10px 30px rgba(4, 201, 166, 0.15)" : "0 4px 15px rgba(0,0,0,0.03)";
            }}
        >
            {service.destacado && (
                <span style={{
                    position: "absolute", top: "-10px", left: "50%", transform: "translateX(-50%)",
                    background: "var(--color-primary)", color: "var(--white)",
                    padding: "2px 12px", borderRadius: "20px", fontSize: "10px", fontWeight: "bold",
                    textTransform: "uppercase", letterSpacing: "1px"
                }}>
                    Recomendado
                </span>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "15px" }}>
                <div style={{
                    background: "rgba(4, 201, 166, 0.1)", color: "var(--color-primary)",
                    padding: "10px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                    <Icon size={20} strokeWidth={2} />
                </div>
                <span style={{ color: "var(--light-gray)", fontSize: "24px", fontWeight: "900", fontFamily: "monospace" }}>
                    {service.number}
                </span>
            </div>

            <h3 style={{ color: "var(--color-dark)", fontSize: "18px", margin: "0 0 8px 0", fontWeight: "800" }}>
                {service.title}
            </h3>
            <p style={{ color: "var(--text-light)", fontSize: "13px", lineHeight: "1.5", margin: "0 0 15px 0" }}>
                {service.description}
            </p>

            <div style={{ marginBottom: "15px", borderBottom: "1px solid var(--light-gray)", paddingBottom: "15px" }}>
                <span style={{ fontSize: "28px", fontWeight: "900", color: "var(--color-dark)" }}>
                    {service.price}
                </span>
                <span style={{ fontSize: "13px", color: "var(--text-light)", marginLeft: "5px" }}>
                    {service.period}
                </span>
            </div>

            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px 0", display: "flex", flexDirection: "column", gap: "8px", flexGrow: 1 }}>
                {service.features.map((feature, i) => (
                    <li key={i} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--color-dark)" }}>
                        <div style={{ background: "rgba(4, 201, 166, 0.15)", padding: "3px", borderRadius: "50%", display: "flex" }}>
                            <Check size={12} color="var(--color-primary)" strokeWidth={3} />
                        </div>
                        {feature}
                    </li>
                ))}
            </ul>

            <Button variant={service.destacado ? "primary" : "outline-dark"} style={{ width: "100%", padding: "10px" }}>
                Seleccionar
            </Button>
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
                borderRadius: "10px",
                border: "1px solid var(--light-gray)",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                height: "100%",
                boxShadow: "0 4px 15px rgba(0,0,0,0.03)",
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-5px)";
                e.currentTarget.style.boxShadow = "0 15px 35px rgba(0,0,0,0.08)";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 15px rgba(0,0,0,0.03)";
            }}
        >
            <div style={{ position: "relative", height: "170px", background: "var(--bg-color)", overflow: "hidden" }}>
                <img
                    src={product.image}
                    alt={product.name}
                    loading="lazy"
                    style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s ease" }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                    onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 40%)" }} />
                
                <span style={{
                    position: "absolute", top: "10px", left: "10px",
                    background: "var(--color-primary)", color: "var(--white)",
                    padding: "4px 10px", borderRadius: "20px", fontSize: "10px", fontWeight: "bold",
                }}>
                    {product.label}
                </span>

                <div style={{
                    position: "absolute", bottom: "10px", left: "10px",
                    background: "rgba(255, 255, 255, 0.9)", color: "var(--color-primary)",
                    width: "30px", height: "30px", borderRadius: "6px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                    <Icon size={16} />
                </div>
            </div>

            <div style={{ padding: "20px", display: "flex", flexDirection: "column", flexGrow: 1 }}>
                <span style={{ color: "var(--text-light)", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "5px" }}>
                    {product.category}
                </span>
                <h3 style={{ color: "var(--color-dark)", fontSize: "18px", margin: "0 0 8px 0", fontWeight: "800" }}>
                    {product.name}
                </h3>
                <p style={{ color: "var(--text-light)", fontSize: "13px", lineHeight: "1.5", margin: "0 0 15px 0", flexGrow: 1 }}>
                    {product.description}
                </p>

                <div style={{ marginBottom: "15px", borderBottom: "1px solid var(--light-gray)", paddingBottom: "15px" }}>
                    <span style={{ fontSize: "10px", color: "var(--text-light)", fontWeight: "bold", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                        Precio
                    </span>
                    
                    <span style={{ fontSize: "18px", fontWeight: "800", color: "var(--color-dark)" }}>
                        L {product.price}
                    </span>
                </div>

                <Button variant="primary" style={{ width: "100%", padding: "10px" }}>
                    Cotizar Equipo
                </Button>
            </div>
        </article>
    );
};