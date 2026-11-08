export default function SectionHeading({ eyebrow, title, description, light = false }) {
  return <div className={`section-heading ${light ? 'section-heading-light' : ''}`}><span className="eyebrow"><span />{eyebrow}</span><h2>{title}</h2>{description && <p>{description}</p>}</div>;
}
