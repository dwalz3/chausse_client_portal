export function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid #E7E5E4',
      backgroundColor: '#FAFAF7',
      padding: '2rem 1.5rem',
      marginTop: '4rem',
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <span style={{
          fontFamily: 'var(--font-playfair), serif',
          fontSize: '1rem',
          fontWeight: 700,
          color: '#8B4513',
          letterSpacing: '0.05em',
        }}>
          CHAUSSE_
        </span>
        <span style={{ fontSize: '0.8rem', color: '#78716C' }}>
          Trade use only · Chausse Selections
        </span>
      </div>
    </footer>
  );
}
