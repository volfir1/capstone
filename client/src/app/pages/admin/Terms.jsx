import React from 'react';
import { PRIMARY_GOLD, CHARCOAL, THEMED_LIGHT_BG, ACCENT_TAN } from '../../../utils/constants';

export default function Terms() {
  return (
    <div style={{ background: THEMED_LIGHT_BG, color: CHARCOAL, minHeight: '100vh', padding: 40 }}>
      <div style={{ maxWidth: 980, margin: '0 auto', background: '#ffffff', padding: 32, borderRadius: 12, boxShadow: '0 8px 30px rgba(42, 48, 60, 0.06)' }}>
        <header style={{ borderBottom: `1px solid ${THEMED_LIGHT_BG}`, paddingBottom: 12, marginBottom: 18 }}>
          <h1 style={{ color: PRIMARY_GOLD, margin: 0, fontSize: 28 }}>Terms of Service</h1>
          <p style={{ color: ACCENT_TAN, marginTop: 6 }}>Please read these terms carefully before using our service.</p>
        </header>

        <section style={{ lineHeight: 1.6, color: CHARCOAL }}>
          <h2 style={{ color: PRIMARY_GOLD, fontSize: 18, marginBottom: 8 }}>1. Acceptance</h2>
          <p>By using our service you agree to these Terms. If you do not agree, do not use the service.</p>

          <h2 style={{ color: PRIMARY_GOLD, fontSize: 18, marginTop: 18, marginBottom: 8 }}>2. Accounts</h2>
          <p>Account holders are responsible for keeping credentials secure. You agree to provide accurate information.</p>

          <h2 style={{ color: PRIMARY_GOLD, fontSize: 18, marginTop: 18, marginBottom: 8 }}>3. Acceptable Use</h2>
          <p>Do not use the service for illegal activities. Abusive behavior may lead to suspension or termination.</p>

          <h2 style={{ color: PRIMARY_GOLD, fontSize: 18, marginTop: 18, marginBottom: 8 }}>4. Intellectual Property</h2>
          <p>We and our licensors retain ownership of content and software. You may not reproduce or distribute without permission.</p>

          <h2 style={{ color: PRIMARY_GOLD, fontSize: 18, marginTop: 18, marginBottom: 8 }}>5. Disclaimers & Limitation</h2>
          <p>The service is provided "as is". We disclaim all warranties to the fullest extent permitted by law.</p>

          <h2 style={{ color: PRIMARY_GOLD, fontSize: 18, marginTop: 18, marginBottom: 8 }}>6. Governing Law</h2>
          <p>These Terms are governed by the applicable laws of the jurisdiction where the company is located.</p>

          <h2 style={{ color: PRIMARY_GOLD, fontSize: 18, marginTop: 18, marginBottom: 8 }}>7. Contact</h2>
          <p>Questions about these Terms can be directed to <strong style={{ color: ACCENT_TAN }}>legal@example.com</strong>.</p>
        </section>

        <footer style={{ marginTop: 28, borderTop: `1px solid ${THEMED_LIGHT_BG}`, paddingTop: 14 }}>
          <small style={{ color: '#666' }}>Last updated: February 27, 2026</small>
        </footer>
      </div>
    </div>
  );
}
