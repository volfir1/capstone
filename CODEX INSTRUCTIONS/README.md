# YONDU Local Form Auto-Filler

This project is a fully local-only browser app for preparing YONDU accountability and return/sanitation forms from saved CSV sources.

## Run

Open [index.html](/D:/YONDU/index.html) directly in a browser.

- No backend, API, auth, telemetry, cloud sync, or server is required.
- Third-party browser assets are vendored locally under [assets/vendor](/D:/YONDU/assets/vendor).
- Saved CSV sources stay in the browser through IndexedDB with localStorage fallback.
- If Node.js/npm are missing on the machine, run [bootstrap.ps1](/D:/YONDU/bootstrap.ps1) first to install the prerequisite toolchain and then install dependencies.

## CSV Sources

The app keeps the existing four-source lookup behavior:

- `ITSM Asset Master Tracker`
- `ITSM Task Assignment`
- `New Hire Attendance`
- `Test Device`

Recommended filenames should still clearly identify the source type so automatic source detection stays predictable.

## Supported Search Keys

- Employee ID
- Full employee name
- Asset tag
- Serial number
- IMEI for test-device flows

Return mode still supports multiple asset identifiers in one search.

## Local Development

- `npm test`
- `powershell -ExecutionPolicy Bypass -File .\\bootstrap.ps1`

The test suite uses Node's built-in test runner and fixture CSVs under [tests/fixtures](/D:/YONDU/tests/fixtures).

## Constraints Preserved

- Print layouts, print markup contract, and print rendering behavior are unchanged.
- The 4-source auto-vlookup behavior, matching precedence, and resulting field population are unchanged for the same CSV inputs and user actions.
- Positions/titles remain hardcoded in behavior; editable person-name defaults remain prefilled.

## Known Limits

- Source data is stored in the browser, so very large CSV files may exceed browser storage limits.
- Source-role mismatches now warn clearly, but the lookup workflow still uses the existing operational parser and source precedence rules.
