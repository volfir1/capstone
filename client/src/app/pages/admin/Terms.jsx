import React, { useState } from 'react';
import {
  IconArrowLeft,
  IconScale,
  IconUser,
  IconBan,
  IconCopyright,
  IconAlertCircle,
  IconWorld,
  IconMail,
  IconFileText,
  IconBuildingArch,
} from '@tabler/icons-react';

const PRIMARY_GOLD = '#C9A84C';
const CHARCOAL = '#2A303C';
const THEMED_LIGHT_BG = '#F5F1EB';
const ACCENT_TAN = '#A8936A';
const GOLD_LIGHT = '#E8D5A3';
const GOLD_PALE = '#FAF6EE';
const CHARCOAL_MUTED = '#6B7280';
const CHARCOAL_LIGHT = '#9CA3AF';

const sections = [
  {
    number: '01',
    title: 'Acceptance',
    Icon: IconFileText,
    tag: 'Agreement',
    content:
      'By accessing or using our service, you acknowledge that you have read, understood, and agree to be bound by these Terms. If you do not agree to these Terms in their entirety, you are not authorized to use our service in any manner.',
  },
  {
    number: '02',
    title: 'Accounts',
    Icon: IconUser,
    tag: 'Accounts',
    content:
      'Account holders bear full responsibility for safeguarding their credentials and maintaining the security of their account. You agree to provide accurate, current, and complete information during registration and to update such information as necessary.',
  },
  {
    number: '03',
    title: 'Acceptable Use',
    Icon: IconBan,
    tag: 'Conduct',
    content:
      'You agree not to use the service for any unlawful purpose or in any way that violates these Terms. Abusive, harmful, or fraudulent behavior — including unauthorized access attempts — may result in immediate suspension or permanent termination of your account.',
  },
  {
    number: '04',
    title: 'Intellectual Property',
    Icon: IconCopyright,
    tag: 'IP Rights',
    content:
      'All content, software, trademarks, and materials made available through the service are the exclusive property of us and our licensors. You may not copy, reproduce, distribute, or create derivative works without prior written permission.',
  },
  {
    number: '05',
    title: 'Disclaimers & Limitation',
    Icon: IconAlertCircle,
    tag: 'Liability',
    content:
      'The service is provided on an "as is" and "as available" basis without warranties of any kind, either express or implied. To the fullest extent permitted by applicable law, we expressly disclaim all warranties, including implied warranties of merchantability and fitness for a particular purpose.',
  },
  {
    number: '06',
    title: 'Governing Law',
    Icon: IconWorld,
    tag: 'Jurisdiction',
    content:
      'These Terms of Service and any disputes arising out of or related to them shall be governed by and construed in accordance with the applicable laws of the jurisdiction in which the company is incorporated, without regard to conflict of law provisions.',
  },
  {
    number: '07',
    title: 'Contact',
    Icon: IconMail,
    tag: 'Contact',
    content: (
      <>
        If you have questions, concerns, or requests regarding these Terms, our legal team is available to assist you. Please direct all correspondence to{' '}
        <a
          href="mailto:justreach4@gmail.com"
          style={{
            color: PRIMARY_GOLD,
            fontWeight: 600,
            textDecoration: 'none',
            borderBottom: `1px solid ${GOLD_LIGHT}`,
            paddingBottom: 1,
          }}
        >
          justreach4@gmail.com
        </a>
        .
      </>
    ),
  },
];

function LogoPlaceholder() {
  return (
    <div
      title="Place your logo here"
      style={{
        width: 54,
        height: 54,
        borderRadius: 10,
        overflow: 'hidden',
        border: `1.5px dashed rgba(201,168,76,0.55)`,
        background: GOLD_PALE,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        cursor: 'pointer',
      }}
    >
      <img
        src="/sola_logo.png"
        alt="Organization logo"
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
    </div>
  );
}

function SectionCard({ section }) {
  const [hovered, setHovered] = useState(false);
  const { Icon } = section;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: '64px 1fr',
        gap: '0 24px',
        padding: '28px 0',
        borderBottom: `1px solid ${THEMED_LIGHT_BG}`,
        cursor: 'default',
      }}
    >
      {/* Icon column */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, paddingTop: 2 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: hovered ? `linear-gradient(135deg, ${PRIMARY_GOLD}, ${ACCENT_TAN})` : GOLD_PALE,
            border: `1.5px solid ${hovered ? PRIMARY_GOLD : GOLD_LIGHT}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease',
            boxShadow: hovered ? `0 4px 16px rgba(201,168,76,0.3)` : 'none',
          }}
        >
          <Icon size={18} color={hovered ? '#fff' : PRIMARY_GOLD} stroke={1.8} />
        </div>
        <div
          style={{
            width: 1,
            flex: 1,
            minHeight: 20,
            background: `linear-gradient(to bottom, ${GOLD_LIGHT}, transparent)`,
            opacity: 0.6,
          }}
        />
      </div>

      {/* Content */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
          <h2
            style={{
              margin: 0,
              fontSize: 17,
              fontWeight: 700,
              color: hovered ? PRIMARY_GOLD : CHARCOAL,
              fontFamily: '"Georgia", serif',
              letterSpacing: '0.01em',
              transition: 'color 0.25s',
            }}
          >
            {section.title}
          </h2>
          <span
            style={{
              fontSize: 10,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: ACCENT_TAN,
              background: GOLD_PALE,
              border: `1px solid ${GOLD_LIGHT}`,
              borderRadius: 10,
              padding: '2px 9px',
              fontFamily: 'sans-serif',
              fontWeight: 600,
            }}
          >
            {section.tag}
          </span>
        </div>
        <p
          style={{
            margin: 0,
            lineHeight: 1.75,
            color: CHARCOAL_MUTED,
            fontSize: 15,
            fontFamily: '"Palatino Linotype", "Book Antiqua", Palatino, serif',
          }}
        >
          {section.content}
        </p>
      </div>
    </div>
  );
}

export default function Terms() {
  return (
    <div style={{ background: THEMED_LIGHT_BG, minHeight: '100vh', padding: '40px 20px', fontFamily: 'Georgia, serif' }}>

      {/* Back button */}
      <div style={{ maxWidth: 860, margin: '0 auto 16px' }}>
        <button
          onClick={() => window.history.back()}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            background: 'transparent',
            border: `1px solid ${GOLD_LIGHT}`,
            borderRadius: 8,
            padding: '7px 16px',
            cursor: 'pointer',
            color: ACCENT_TAN,
            fontSize: 13,
            fontFamily: 'sans-serif',
            fontWeight: 500,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = GOLD_PALE; e.currentTarget.style.borderColor = PRIMARY_GOLD; e.currentTarget.style.color = PRIMARY_GOLD; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = GOLD_LIGHT; e.currentTarget.style.color = ACCENT_TAN; }}
        >
          <IconArrowLeft size={15} stroke={2} />
          Back
        </button>
      </div>

      {/* Top gold bar */}
      <div
        style={{
          maxWidth: 860,
          margin: '0 auto',
          height: 4,
          borderRadius: '4px 4px 0 0',
          background: `linear-gradient(90deg, ${PRIMARY_GOLD}, ${ACCENT_TAN}, ${GOLD_LIGHT})`,
        }}
      />

      <div
        style={{
          maxWidth: 860,
          margin: '0 auto',
          background: '#ffffff',
          borderRadius: '0 0 16px 16px',
          boxShadow: '0 16px 60px rgba(42,48,60,0.10), 0 2px 8px rgba(201,168,76,0.07)',
          overflow: 'hidden',
        }}
      >
        {/* Hero Header */}
        <header
          style={{
            background: `linear-gradient(135deg, ${CHARCOAL} 0%, #1a1f28 100%)`,
            padding: '40px 48px 36px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Decorative orbs */}
          <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: `radial-gradient(circle, rgba(201,168,76,0.12) 0%, transparent 70%)`, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -20, left: 100, width: 120, height: 120, borderRadius: '50%', background: `radial-gradient(circle, rgba(168,147,106,0.08) 0%, transparent 70%)`, pointerEvents: 'none' }} />

          {/* Org identity row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
            <LogoPlaceholder />
            <div>
              <p style={{ margin: 0, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: PRIMARY_GOLD, fontFamily: 'sans-serif', fontWeight: 700, marginBottom: 3 }}>
                San Sebastian
              </p>
              <p style={{ margin: 0, fontSize: 16, color: '#ffffff', fontFamily: '"Georgia", serif', fontWeight: 600, letterSpacing: '0.01em' }}>
                Office of Legal Aid
              </p>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <div
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: 'rgba(201,168,76,0.12)', border: `1px solid rgba(201,168,76,0.3)`,
                  borderRadius: 20, padding: '5px 14px',
                }}
              >
                <IconScale size={12} color={PRIMARY_GOLD} stroke={2} />
                <span style={{ color: PRIMARY_GOLD, fontSize: 10, letterSpacing: '0.15em', fontFamily: 'sans-serif', fontWeight: 600, textTransform: 'uppercase' }}>
                  Legal Document
                </span>
                <span style={{ color: GOLD_LIGHT, fontSize: 10, opacity: 0.5 }}>•</span>
                <span style={{ color: CHARCOAL_LIGHT, fontSize: 10, letterSpacing: '0.1em', fontFamily: 'sans-serif', textTransform: 'uppercase' }}>
                  v2.0
                </span>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: `rgba(201,168,76,0.2)`, marginBottom: 24 }} />

          <h1 style={{ margin: '0 0 12px', fontSize: 36, fontWeight: 700, color: '#ffffff', fontFamily: '"Georgia", serif', letterSpacing: '-0.01em', lineHeight: 1.15 }}>
            Terms of{' '}
            <span style={{ background: `linear-gradient(135deg, ${PRIMARY_GOLD}, ${GOLD_LIGHT})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Service
            </span>
          </h1>

          <p style={{ margin: 0, color: CHARCOAL_LIGHT, fontSize: 15, lineHeight: 1.6, maxWidth: 480, fontFamily: 'sans-serif', fontWeight: 300 }}>
            Please read these terms carefully before using our service. Your continued use constitutes acceptance of all conditions herein.
          </p>

          <div style={{ marginTop: 28, height: 1, background: `linear-gradient(90deg, ${PRIMARY_GOLD}55, transparent)` }} />
        </header>

        {/* Quick nav */}
        <div style={{ padding: '18px 48px', background: GOLD_PALE, borderBottom: `1px solid ${GOLD_LIGHT}40`, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: ACCENT_TAN, fontFamily: 'sans-serif', fontWeight: 600, marginRight: 4 }}>
            Sections:
          </span>
          {sections.map((s) => (
            <span
              key={s.number}
              style={{ fontSize: 12, padding: '3px 12px', borderRadius: 12, border: `1px solid ${GOLD_LIGHT}`, color: ACCENT_TAN, fontFamily: 'sans-serif', cursor: 'pointer', background: '#fff', userSelect: 'none' }}
            >
              {s.title}
            </span>
          ))}
        </div>

        {/* Sections */}
        <div style={{ padding: '8px 48px 0' }}>
          {sections.map((section) => (
            <SectionCard key={section.number} section={section} />
          ))}
        </div>

        {/* Footer */}
        <footer style={{ margin: '8px 48px 0', padding: '24px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: `linear-gradient(135deg, ${PRIMARY_GOLD}, ${ACCENT_TAN})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconScale size={15} color="#fff" stroke={1.8} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: CHARCOAL, fontWeight: 600, fontFamily: 'sans-serif' }}>Legally Binding Agreement</div>
              <div style={{ fontSize: 11, color: CHARCOAL_LIGHT, fontFamily: 'sans-serif' }}>Last updated: February 27, 2026</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            {['Privacy Policy', 'Cookie Policy', 'GDPR'].map((link) => (
              <a key={link} href="#" style={{ fontSize: 12, color: ACCENT_TAN, textDecoration: 'none', fontFamily: 'sans-serif', borderBottom: `1px solid ${GOLD_LIGHT}`, paddingBottom: 1 }}>
                {link}
              </a>
            ))}
          </div>
        </footer>

        <div style={{ height: 3, background: `linear-gradient(90deg, ${PRIMARY_GOLD}, ${ACCENT_TAN}, ${GOLD_LIGHT})` }} />
      </div>

      <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: CHARCOAL_LIGHT, fontFamily: 'sans-serif' }}>
        © 2026 San Sebastian Office of Legal Aid. All rights reserved.
      </p>
    </div>
  );
}