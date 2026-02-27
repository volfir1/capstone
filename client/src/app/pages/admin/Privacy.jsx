import React, { useState } from 'react';
import {
  IconArrowLeft,
  IconShieldCheck,
  IconDatabaseImport,
  IconChartBar,
  IconCookie,
  IconShare,
  IconLock,
  IconUserCheck,
  IconMail,
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
    title: 'Information We Collect',
    Icon: IconDatabaseImport,
    tag: 'Collection',
    content:
      'We collect only the information necessary to provide and improve our services — including account details, email address, and any information you voluntarily provide through forms or interactions with our platform.',
  },
  {
    number: '02',
    title: 'How We Use Data',
    Icon: IconChartBar,
    tag: 'Usage',
    content:
      'Your data is used solely to authenticate users, personalize your experience, and deliver platform features. We do not — and will never — sell your personal information to third parties under any circumstances.',
  },
  {
    number: '03',
    title: 'Cookies & Authentication',
    Icon: IconCookie,
    tag: 'Cookies',
    content:
      'We use secure, encrypted cookies and Firebase authentication to maintain your signed-in session. All sensitive session cookies are HTTP-only and protected against cross-site scripting to ensure your credentials remain safe.',
  },
  {
    number: '04',
    title: 'Data Sharing',
    Icon: IconShare,
    tag: 'Sharing',
    content:
      'We share your data only to the minimum extent necessary to operate our services — specifically with vetted third-party service providers — or when compelled by applicable law. We do not engage in unauthorized data sharing of any kind.',
  },
  {
    number: '05',
    title: 'Security',
    Icon: IconLock,
    tag: 'Security',
    content:
      'We employ reasonable and industry-standard technical and organizational safeguards to protect your data at rest and in transit. In the unlikely event of a security breach, we commit to notifying all affected users promptly and transparently.',
  },
  {
    number: '06',
    title: 'Your Rights',
    Icon: IconUserCheck,
    tag: 'Rights',
    content:
      'You have the right to request access to, correction of, or deletion of your personal data at any time. You may also request a portable copy of your data or object to certain processing activities. Contact us to exercise any of these rights.',
  },
  {
    number: '07',
    title: 'Contact',
    Icon: IconMail,
    tag: 'Contact',
    content: (
      <>
        Our privacy team is here to help with any questions, concerns, or requests regarding your personal data. Reach us directly at{' '}
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

const commitments = [
  { Icon: IconLock, label: 'Data Encrypted' },
  { Icon: IconShieldCheck, label: 'Never Sold' },
  { Icon: IconUserCheck, label: 'GDPR Ready' },
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

export default function Privacy() {
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
          <div style={{ position: 'absolute', top: -50, right: -30, width: 220, height: 220, borderRadius: '50%', background: `radial-gradient(circle, rgba(201,168,76,0.10) 0%, transparent 70%)`, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -30, left: 80, width: 140, height: 140, borderRadius: '50%', background: `radial-gradient(circle, rgba(168,147,106,0.07) 0%, transparent 70%)`, pointerEvents: 'none' }} />

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
                <IconShieldCheck size={12} color={PRIMARY_GOLD} stroke={2} />
                <span style={{ color: PRIMARY_GOLD, fontSize: 10, letterSpacing: '0.15em', fontFamily: 'sans-serif', fontWeight: 600, textTransform: 'uppercase' }}>
                  Data Protection
                </span>
                <span style={{ color: GOLD_LIGHT, fontSize: 10, opacity: 0.5 }}>•</span>
                <span style={{ color: CHARCOAL_LIGHT, fontSize: 10, letterSpacing: '0.1em', fontFamily: 'sans-serif', textTransform: 'uppercase' }}>
                  GDPR Compliant
                </span>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: `rgba(201,168,76,0.2)`, marginBottom: 24 }} />

          <h1 style={{ margin: '0 0 12px', fontSize: 36, fontWeight: 700, color: '#ffffff', fontFamily: '"Georgia", serif', letterSpacing: '-0.01em', lineHeight: 1.15 }}>
            Privacy{' '}
            <span style={{ background: `linear-gradient(135deg, ${PRIMARY_GOLD}, ${GOLD_LIGHT})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Policy
            </span>
          </h1>

          <p style={{ margin: 0, color: CHARCOAL_LIGHT, fontSize: 15, lineHeight: 1.6, maxWidth: 480, fontFamily: 'sans-serif', fontWeight: 300 }}>
            We respect your privacy and are committed to protecting your personal data. This policy explains how we collect, use, and safeguard your information.
          </p>

          {/* Commitment strip */}
          <div style={{ marginTop: 24, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {commitments.map(({ Icon, label }) => (
              <div
                key={label}
                style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: CHARCOAL_LIGHT, fontFamily: 'sans-serif' }}
              >
                <Icon size={14} color={PRIMARY_GOLD} stroke={2} />
                <span>{label}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 24, height: 1, background: `linear-gradient(90deg, ${PRIMARY_GOLD}55, transparent)` }} />
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
              <IconShieldCheck size={15} color="#fff" stroke={1.8} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: CHARCOAL, fontWeight: 600, fontFamily: 'sans-serif' }}>Your Privacy Is Protected</div>
              <div style={{ fontSize: 11, color: CHARCOAL_LIGHT, fontFamily: 'sans-serif' }}>Effective date: February 27, 2026</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            {['Terms of Service', 'Cookie Policy', 'GDPR'].map((link) => (
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