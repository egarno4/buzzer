import { useNavigate } from 'react-router-dom'

export default function Cover() {
  const navigate = useNavigate()

  return (
    <div
      style={{
        fontFamily: "'Barlow', sans-serif",
        maxWidth: 430,
        margin: '0 auto',
        minHeight: '100vh',
        background: '#F5F0E8',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@700;800;900&display=swap');
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes skylineIn {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade1 { animation: fadeUp 0.55s ease both; }
        .fade2 { animation: fadeUp 0.55s 0.12s ease both; }
        .fade3 { animation: fadeUp 0.55s 0.24s ease both; }
        .fade4 { animation: fadeUp 0.55s 0.36s ease both; }
        .fade5 { animation: fadeUp 0.55s 0.48s ease both; }
        .skyline { animation: skylineIn 0.8s 0.3s ease both; }
      `}</style>

      <div
        className="fade1"
        style={{
          position: 'relative',
          zIndex: 1,
          padding: '20px 28px 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#9C8F7A',
          }}
        >
          New York City
        </div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#9C8F7A',
          }}
        >
          buzzer.nyc
        </div>
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '0 28px 0',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div className="fade2" style={{ marginBottom: 18 }}>
          <span
            style={{
              display: 'inline-block',
              background: '#D4773A',
              color: '#fff',
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              padding: '5px 11px',
              borderRadius: 4,
            }}
          >
            No Doorman Required
          </span>
        </div>

        <div
          className="fade3"
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 900,
            fontSize: 72,
            lineHeight: 0.92,
            letterSpacing: '-0.02em',
            color: '#1C1812',
            marginBottom: 20,
          }}
        >
          BUZZ<span style={{ color: '#D4773A' }}>ER.</span>
        </div>

        <div
          className="fade4"
          style={{
            fontSize: 16,
            color: '#6B5F52',
            lineHeight: 1.6,
            maxWidth: 290,
            marginBottom: 44,
            fontWeight: 400,
          }}
        >
          Your building, looking out for each other. Keep packages safe with your neighbors.
        </div>

        <div className="fade5" style={{ marginBottom: 32 }}>
          <button
            type="button"
            onClick={() => navigate('/onboarding/name')}
            style={{
              width: '100%',
              padding: '16px',
              background: '#1C1812',
              color: '#F5F0E8',
              border: 'none',
              borderRadius: 10,
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 800,
              fontSize: 16,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              marginBottom: 14,
            }}
          >
            Get Started
          </button>
          <div style={{ textAlign: 'center', fontSize: 13, color: '#9C8F7A' }}>
            Already a member?{' '}
            <span
              role="button"
              tabIndex={0}
              onClick={() => navigate('/onboarding/email')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  navigate('/onboarding/email')
                }
              }}
              style={{ color: '#D4773A', fontWeight: 700, cursor: 'pointer' }}
            >
              Sign in
            </span>
          </div>
        </div>
      </div>

      <div className="skyline" style={{ position: 'relative', zIndex: 0, lineHeight: 0 }}>
        <svg
          viewBox="0 0 430 160"
          width="100%"
          preserveAspectRatio="xMidYMax meet"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#DDD7CC" />
              <stop offset="100%" stopColor="#C8C0B4" />
            </linearGradient>
          </defs>
          <rect x="0" y="155" width="430" height="5" fill="#C8C0B4" />
          <g fill="#E0D9CF" opacity="0.7">
            <rect x="0" y="130" width="25" height="30" />
            <rect x="26" y="120" width="18" height="40" />
            <rect x="50" y="125" width="30" height="35" />
            <rect x="82" y="115" width="20" height="45" />
            <rect x="104" y="122" width="35" height="38" />
            <rect x="140" y="118" width="22" height="42" />
            <rect x="164" y="126" width="28" height="34" />
            <rect x="194" y="112" width="24" height="48" />
            <rect x="220" y="120" width="32" height="40" />
            <rect x="254" y="116" width="20" height="44" />
            <rect x="276" y="124" width="28" height="36" />
            <rect x="306" y="118" width="24" height="42" />
            <rect x="332" y="126" width="30" height="34" />
            <rect x="364" y="120" width="22" height="40" />
            <rect x="388" y="128" width="42" height="32" />
          </g>
          <g fill="url(#skyGrad)">
            <rect x="0" y="118" width="14" height="42" />
            <rect x="15" y="105" width="10" height="55" />
            <rect x="26" y="100" width="18" height="60" />
            <rect x="30" y="94" width="10" height="6" />
            <rect x="32" y="88" width="6" height="6" />
            <rect x="46" y="110" width="22" height="50" />
            <rect x="70" y="85" width="10" height="75" />
            <rect x="72" y="80" width="6" height="5" />
            <rect x="82" y="108" width="30" height="52" />
            <rect x="114" y="95" width="20" height="65" />
            <rect x="117" y="88" width="14" height="7" />
            <rect x="120" y="82" width="8" height="6" />
            <rect x="136" y="112" width="16" height="48" />
            <rect x="154" y="78" width="22" height="82" />
            <rect x="158" y="70" width="14" height="8" />
            <rect x="161" y="62" width="8" height="8" />
            <rect x="163" y="54" width="4" height="8" />
            <rect x="164" y="30" width="2" height="24" />
            <rect x="179" y="82" width="18" height="78" />
            <rect x="182" y="74" width="12" height="8" />
            <rect x="184" y="67" width="8" height="7" />
            <rect x="185" y="61" width="6" height="6" />
            <rect x="186" y="55" width="4" height="6" />
            <path d="M185,55 Q188,42 191,55 Z" fill="url(#skyGrad)" />
            <rect x="187" y="42" width="2" height="13" />
            <rect x="200" y="95" width="28" height="65" />
            <rect x="204" y="90" width="20" height="5" />
            <rect x="230" y="102" width="20" height="58" />
            <rect x="252" y="72" width="22" height="88" />
            <rect x="255" y="64" width="16" height="8" />
            <rect x="258" y="56" width="10" height="8" />
            <rect x="260" y="48" width="6" height="8" />
            <rect x="262" y="38" width="2" height="10" />
            <rect x="262" y="14" width="2" height="24" />
            <rect x="276" y="90" width="18" height="70" />
            <rect x="278" y="84" width="14" height="6" />
            <rect x="296" y="100" width="24" height="60" />
            <rect x="322" y="88" width="16" height="72" />
            <rect x="325" y="82" width="10" height="6" />
            <rect x="327" y="76" width="6" height="6" />
            <rect x="340" y="106" width="20" height="54" />
            <rect x="362" y="95" width="18" height="65" />
            <rect x="364" y="88" width="14" height="7" />
            <rect x="382" y="108" width="22" height="52" />
            <rect x="405" y="100" width="25" height="60" />
            <rect x="408" y="94" width="18" height="6" />
          </g>
          <g fill="#B8B0A4" opacity="0.5">
            {[0, 1, 2, 3, 4, 5].flatMap((row) =>
              [0, 1, 2].map((col) => (
                <rect key={`es-${row}-${col}`} x={157 + col * 5} y={84 + row * 8} width="2" height="3" />
              )),
            )}
            {[0, 1, 2, 3, 4].flatMap((row) =>
              [0, 1, 2, 3].map((col) => (
                <rect key={`wt-${row}-${col}`} x={255 + col * 5} y={80 + row * 8} width="2" height="3" />
              )),
            )}
          </g>
          <rect x="0" y="156" width="430" height="4" fill="#C0B8AE" opacity="0.5" />
        </svg>
      </div>
    </div>
  )
}
