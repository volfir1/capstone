import React from 'react';
import { PRIMARY_GOLD, CHARCOAL, THEMED_LIGHT_BG, ACCENT_TAN } from '../../../utils/constants';

export default function Privacy() {
  return (
    <div style={{ background: THEMED_LIGHT_BG, color: CHARCOAL, minHeight: '100vh', padding: 40 }}>
      <div style={{ maxWidth: 980, margin: '0 auto', background: '#ffffff', padding: 32, borderRadius: 12, boxShadow: '0 8px 30px rgba(42, 48, 60, 0.06)' }}>
        <header style={{ borderBottom: `1px solid ${THEMED_LIGHT_BG}`, paddingBottom: 12, marginBottom: 18 }}>
          <h1 style={{ color: PRIMARY_GOLD, margin: 0, fontSize: 28 }}>Privacy Policy</h1>
          <p style={{ color: ACCENT_TAN, marginTop: 6 }}>We respect your privacy and protect your data.</p>
        </header>

        <section style={{ lineHeight: 1.6, color: CHARCOAL }}>
          <h2 style={{ color: PRIMARY_GOLD, fontSize: 18, marginBottom: 8 }}>1. Information We Collect</h2>
          <p>We collect only the information necessary to provide and improve our services — for example, account details, email, and any information you provide in forms.</p>

          <h2 style={{ color: PRIMARY_GOLD, fontSize: 18, marginTop: 18, marginBottom: 8 }}>2. How We Use Data</h2>
          <p>Data is used to authenticate users, personalize experiences, and deliver features. We never sell your personal information.</p>

          <h2 style={{ color: PRIMARY_GOLD, fontSize: 18, marginTop: 18, marginBottom: 8 }}>3. Cookies & Authentication</h2>
          <p>We use secure cookies and Firebase authentication to keep you signed in. Sensitive session cookies are HTTP-only and protected.</p>

          <h2 style={{ color: PRIMARY_GOLD, fontSize: 18, marginTop: 18, marginBottom: 8 }}>4. Data Sharing</h2>
          <p>We share data only when necessary to provide services (third-party providers) or when required by law.</p>

          <h2 style={{ color: PRIMARY_GOLD, fontSize: 18, marginTop: 18, marginBottom: 8 }}>5. Security</h2>
          <p>We apply reasonable technical and organizational measures to protect your data. No system is completely secure; if a breach occurs we will notify affected users promptly.</p>

          <h2 style={{ color: PRIMARY_GOLD, fontSize: 18, marginTop: 18, marginBottom: 8 }}>6. Your Rights</h2>
          <p>You can request access to, correction of, or deletion of your personal data. Contact us to exercise these rights.</p>

          <h2 style={{ color: PRIMARY_GOLD, fontSize: 18, marginTop: 18, marginBottom: 8 }}>7. Contact</h2>
          <p>If you have privacy questions, please contact our support team at <strong style={{ color: ACCENT_TAN }}>support@example.com</strong>.</p>
        </section>

        <footer style={{ marginTop: 28, borderTop: `1px solid ${THEMED_LIGHT_BG}`, paddingTop: 14 }}>
          <small style={{ color: '#666' }}>Effective date: February 27, 2026</small>
        </footer>
      </div>
    </div>
  );
}
