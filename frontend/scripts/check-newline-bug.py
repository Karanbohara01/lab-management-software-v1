import ast
import pathlib

results = []
for f in sorted(pathlib.Path('scripts').glob('i18n-dict-*.py')):
    src = f.read_text(encoding='utf-8')
    try:
        tree = ast.parse(src, filename=str(f))
    except SyntaxError as e:
        results.append(f'{f.name}: PARSE ERROR {e}')
        continue
    found = []
    for node in ast.walk(tree):
        if isinstance(node, ast.Assign) and len(node.targets) == 1 and getattr(node.targets[0], 'id', None) == 'additions':
            if isinstance(node.value, ast.Dict):
                for k, v in zip(node.value.keys, node.value.values):
                    kval = k.value if isinstance(k, ast.Constant) else None
                    vval = v.value if isinstance(v, ast.Constant) else None
                    for label, val in (('KEY', kval), ('VALUE', vval)):
                        if isinstance(val, str) and '\n' in val:
                            found.append((label, val))
    if found:
        results.append(f'{f.name}: {len(found)} entries with embedded real newline')
        for label, val in found[:5]:
            results.append('    ' + label + ': ' + val.encode('unicode_escape').decode('ascii')[:150])
    else:
        results.append(f'{f.name}: clean')

with open('scripts/newline-check-out.txt', 'w', encoding='utf-8') as out:
    out.write('\n'.join(results))
print('done, see scripts/newline-check-out.txt')
