#Frontend Folder Structure

src/
│
├── app/                     # Application layer (Next.js app router)
│   ├── routes/              # Application routes / can also be pages
│   │   ├── (public)/        # Public routes (landing, login, register)
│   │   ├── (dashboard)/     # Authenticated routes (user dashboard, case tracking)
│   │   └── api/             # API routes (Next.js API handlers if used)
│   │
│   ├── app.tsx              # Main application component
│   ├── provider.tsx         # Global providers (auth, i18n, state mgmt, theme)
│   └── router.tsx           # Router configuration (if not using file-based routing)
│
├── assets/                  # Static assets (images, fonts, icons, etc.)
│   ├── images/
│   ├── fonts/
│   └── icons/
│
├── components/              # Shared UI components (buttons, modals, cards)
│   ├── layout/              # Global layouts (Navbar, Sidebar, Footer)
│   ├── forms/               # Form components (inputs, selects, validation)
│   ├── ui/                  # Small reusable UI parts (Badge, Spinner, Tooltip)
│   └── feedback/            # Alerts, Toasts, Dialogs
│
├── config/                  # Global configuration
│   ├── env.ts               # Environment variable exports
│   ├── api.ts               # API endpoints, base URLs
│   └── constants.ts         # App-wide constants
│
├── features/                # Feature-based modules
│   ├── auth/                # Authentication (login, register, OTP)
│   ├── cases/               # Case filing, tracking, status updates
│   ├── consultation/        # Online legal consultations
│   ├── forms/               # Legal form generation and storage
│   └── notifications/       # Push/email/SMS notifications
│
├── hooks/                   # Shared custom hooks
│   ├── useAuth.ts
│   ├── useFetch.ts
│   └── useOffline.ts
│
├── lib/                     # Preconfigured libraries & integrations
│   ├── axios.ts             # API client config
│   ├── i18n.ts              # Internationalization (multi-language)
│   ├── tailwind.ts          # Tailwind config helper
│   └── validation.ts        # Zod/Yup validation schemas
│
├── stores/                  # Global state management (Zustand, Redux, etc.)
│   └── userStore.ts
│
├── testing/                 # Test utilities & mocks
│   ├── mocks/
│   ├── setup.ts
│   └── utils.ts
│
├── types/                   # Shared TypeScript types/interfaces
│   ├── auth.ts
│   ├── case.ts
│   └── index.d.ts
│
├── utils/                   # Helper functions
│   ├── formatDate.ts
│   ├── logger.ts
│   └── validators.ts
│
└── styles/                  # Global styles
    ├── globals.css
    └── tailwind.css
