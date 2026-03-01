import Link from 'next/link';

export function Navbar() {
  return (
    <nav style={{
      backgroundColor: '#FAFAF7',
      borderBottom: '1px solid #E7E5E4',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 1.5rem',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        {/* Logo */}
        <Link href="/" style={{ textDecoration: 'none' }}>
          <span style={{
            fontFamily: 'var(--font-playfair), serif',
            fontSize: '1.25rem',
            fontWeight: 700,
            color: '#8B4513',
            letterSpacing: '0.05em',
          }}>
            CHAUSSE_
          </span>
        </Link>

        {/* Nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <NavLink href="/wines">Wines</NavLink>
          <NavLink href="/producers">Producers</NavLink>
          <NavLink href="/new-arrivals">New Arrivals</NavLink>
        </div>
      </div>
    </nav>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      style={{
        fontFamily: 'var(--font-inter), Inter, sans-serif',
        fontSize: '0.9rem',
        fontWeight: 500,
        color: '#44403C',
        textDecoration: 'none',
        letterSpacing: '0.02em',
      }}
    >
      {children}
    </Link>
  );
}
