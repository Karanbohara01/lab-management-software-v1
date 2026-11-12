import pathlib

p = pathlib.Path('src/i18n/ne.ts')
s = p.read_text(encoding='utf-8')

# Each broken entry was written with REAL newline bytes where \n was intended.
# Reconstruct the exact broken substrings (using real newlines) and replace with
# correctly escaped single-line versions.

fixes = [
    (
        "  '{message}\n\nEnter a reason to collect without payment:': '{message}\n\nभुक्तानी बिना सङ्कलन गर्ने कारण लेख्नुहोस्:',",
        "  '{message}\\n\\nEnter a reason to collect without payment:': '{message}\\n\\nभुक्तानी बिना सङ्कलन गर्ने कारण लेख्नुहोस्:',",
    ),
    (
        "  '{message}\n\nEnter a documented reason to verify it yourself:': '{message}\n\nआफैं प्रमाणित गर्ने लिखित कारण लेख्नुहोस्:',",
        "  '{message}\\n\\nEnter a documented reason to verify it yourself:': '{message}\\n\\nआफैं प्रमाणित गर्ने लिखित कारण लेख्नुहोस्:',",
    ),
]

# For the third entry, locate it dynamically since we don't have its exact Nepali text handy.
import re

replaced = 0
for old, new in fixes:
    if old in s:
        s = s.replace(old, new, 1)
        replaced += 1
    else:
        print('NOT FOUND (exact):', old.encode('unicode_escape').decode('ascii')[:120])

# Third entry: '{message}\n\nEnter a documented reason to authorize anyway:' -- find by regex
# spanning real newlines between the known start and the closing ',\n' before the next key.
m = re.search(
    r"  '\{message\}\n\nEnter a documented reason to authorize anyway:': '\{message\}\n\n([^\n]*?):',\n",
    s,
)
if m:
    nepali = m.group(1)
    old3 = m.group(0)
    new3 = (
        "  '{message}\\n\\nEnter a documented reason to authorize anyway:': "
        f"'{{message}}\\n\\n{nepali}:',\n"
    )
    s = s.replace(old3, new3, 1)
    replaced += 1
else:
    print('NOT FOUND (regex): authorize anyway entry')

p.write_text(s, encoding='utf-8')
print(f'fixed {replaced} of 3 entries')
