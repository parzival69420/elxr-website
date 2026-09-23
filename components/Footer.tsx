import { bottles, contact, global } from "@/lib/content";

export default function Footer() {
  const f = global.footer;
  return (
    <footer className="site-footer relative z-10">
      <div className="footer-grid">
        <div className="footer-lead">
          <p className="footer-tagline">{f.tagline}</p>
          <a href={`mailto:${f.email}`} className="footer-email">
            {f.email}
          </a>
          <a href={contact.primaryCta.href} className="btn-primary">
            {contact.primaryCta.label}
          </a>
        </div>
        <nav aria-label="Services">
          <h2>Services</h2>
          <ul>
            {bottles.map((b) => (
              <li key={b.id}>
                <a href={`#detail-${b.id}`}>{b.name}</a>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Studio">
          <h2>Studio</h2>
          <ul>
            {global.navLinks.map((l) => (
              <li key={l.href}>
                <a href={l.href}>{l.label}</a>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <h2>Follow</h2>
          <ul>
            <li>
              <a href={f.instagram.href}>{f.instagram.label}</a>
            </li>
            <li>
              <a href={f.linkedin.href}>{f.linkedin.label}</a>
            </li>
          </ul>
          <p className="footer-line">{f.line}</p>
        </div>
      </div>
      <p className="footer-wordmark" aria-hidden="true">
        ELXR
      </p>
      <div className="footer-legal">
        <span>{f.legal}</span>
        <a href="#top">Back to top</a>
      </div>
    </footer>
  );
}
