import pathlib

ROOT = pathlib.Path('src')

# Each printed document deliberately uses a literal (non-theme-reactive) colour instead of the
# `--primary` token, so the printed page looks identical regardless of the viewer's light/dark
# setting. They were built against the app's old sky-blue; now that the app's actual brand colour
# is navy, swap the literal shade for the fixed `--brand-*` ramp defined in index.css (same hue,
# never affected by `.dark`), not for the dynamic `--primary` token.
SHADE_MAP = {
    'sky-50': '[hsl(var(--brand-50))]',
    'sky-100': '[hsl(var(--brand-100))]',
    'sky-300': '[hsl(var(--brand-300))]',
    'sky-600': '[hsl(var(--brand-600))]',
    'sky-700': '[hsl(var(--brand-700))]',
    'sky-900': '[hsl(var(--brand-900))]',
}

FILES = [
    'features/patients/PatientCard.tsx',
    'features/reports/ReportDocument.tsx',
    'features/billing/InvoicePrintDocument.tsx',
]

for relpath in FILES:
    p = ROOT / relpath
    s = p.read_text(encoding='utf-8')
    counts = {}
    # Replace longer/more-specific keys first isn't needed here since all keys are the same
    # "sky-NNN" shape with distinct numbers -- but guard against partial-number collisions
    # (e.g. "sky-50" must not also match inside "sky-500") by requiring a non-digit boundary.
    import re

    for shade, replacement in SHADE_MAP.items():
        pattern = re.compile(r'\b' + re.escape(shade) + r'\b')
        new_s, n = pattern.subn(replacement, s)
        if n:
            counts[shade] = n
            s = new_s
    p.write_text(s, encoding='utf-8')
    print(f'{relpath}: {counts}')
