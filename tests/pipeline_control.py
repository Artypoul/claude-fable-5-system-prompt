def normalize_paths(paths: list[str]) -> list[str]:
    if not isinstance(paths, list):
        raise ValueError('Expected a list of paths')

    result = []
    seen = set()
    for path in paths:
        if (not isinstance(path, str) or not path.strip() or '\x00' in path
                or path.startswith(('/', '\\'))):
            raise ValueError('Invalid path')
        if len(path) >= 2 and path[0] in 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz' and path[1] == ':':
            raise ValueError('Invalid path')

        segments = []
        for segment in path.replace('\\', '/').split('/'):
            if segment in ('', '.'):
                continue
            if segment == '..':
                if not segments:
                    raise ValueError('Invalid path')
                segments.pop()
            else:
                segments.append(segment)
        if not segments:
            raise ValueError('Invalid path')
        normalized = '/'.join(segments)
        if len(normalized) >= 2 and normalized[0] in 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz' and normalized[1] == ':':
            raise ValueError('Invalid path')
        if normalized not in seen:
            seen.add(normalized)
            result.append(normalized)
    return result


if __name__ == '__main__':
    import json
    import sys

    try:
        paths = json.loads(sys.stdin.buffer.read().decode('utf-8'))
        normalized = normalize_paths(paths)
    except (ValueError, RecursionError):
        print('Invalid input', file=sys.stderr)
        sys.exit(2)
    print(json.dumps(normalized))
