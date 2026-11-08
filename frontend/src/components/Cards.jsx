import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
export function ServiceCard({ service }) {
  const Icon = service.icon;
  return <article className="service-card"><div className="service-card-top"><div className="icon-tile"><Icon size={23} strokeWidth={1.7} /></div><span className="service-number">{service.number}</span></div><span className="service-tag">{service.tag}</span><h3>{service.title}</h3><p>{service.description}</p><span className="service-line" /></article>;
}
export function ProductCard({ product }) {
  const Icon = product.icon;
  return <article className="product-card"><div className="product-image-wrap"><img src={product.image} alt={product.name} loading="lazy"/><span className="product-label">{product.label}</span><span className="product-image-icon"><Icon size={19}/></span></div><div className="product-content"><span className="product-category">{product.category}</span><h3>{product.name}</h3><p>{product.description}</p><div className="product-bottom"><div><span className="price-caption">Precio</span><strong>{product.price} <small>Lps</small></strong></div><Link className="icon-button" to="/contacto" aria-label={`Consultar ${product.name}`}><ArrowUpRight size={20}/></Link></div></div></article>;
}
