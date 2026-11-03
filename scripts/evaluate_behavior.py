#!/usr/bin/env python3
"""Evaluate model-produced action plans against source-derived scenarios.

This evaluates decisions, not real sports/storage backends. It never executes
the model's proposed actions. CI tests the trace checker; --run-model performs
a separate, authenticated Codex model evaluation and records its actual output.
"""
import argparse
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
CASES = ROOT / 'tests/behavior/cases.json'
KINDS = ['scan_skills', 'read_skill', 'edit_file', 'run_code', 'sports_scores',
         'sports_game_stats', 'sports_standings', 'ask_choice', 'ask_text',
         'connector_search', 'suggest_connector', 'report_gap', 'persist_state',
         'call_model_api', 'search_web', 'search_images', 'answer']


def check_case(case, result):
    errors = []
    expected = case['expect']
    actions = result.get('actions', [])
    if not isinstance(actions, list) or not isinstance(result.get('gaps', []), list):
        return ['actions and gaps must be arrays']
    if result.get('baseline_applies') != expected['baseline']:
        errors.append('baseline activation differs from source contract')
    if any(not isinstance(a, dict) or a.get('kind') not in KINDS
           or not isinstance(a.get('target'), str) for a in actions):
        return errors + ['invalid action shape']
    for kind, target in expected.get('required', []):
        if not any(a['kind'] == kind and (not target or a['target'] == target) for a in actions):
            errors.append(f'missing {kind} {target}'.strip())
    for kind in expected.get('forbidden', []):
        if any(a['kind'] == kind for a in actions):
            errors.append(f'forbidden action {kind}')
    for earlier, later in expected.get('before', []):
        a = [i for i, x in enumerate(actions) if x['kind'] == earlier]
        b = [i for i, x in enumerate(actions) if x['kind'] == later]
        if not a or not b or max(a) >= min(b):
            errors.append(f'{earlier} must finish before {later}')
    for gap in expected.get('gaps', []):
        if gap not in result.get('gaps', []):
            errors.append(f'undeclared capability gap {gap}')
    # An action-plan evaluator cannot approve calls absent from the fixture.
    for action in actions:
        if action['kind'] not in {'answer', 'report_gap'} and action['kind'] not in case['capabilities']:
            errors.append(f'unavailable action {action["kind"]}')
    return errors


def evaluate(cases, response):
    results = response.get('cases', [])
    ids = [r.get('id') for r in results]
    if len(ids) != len(set(ids)) or set(ids) != {c['id'] for c in cases}:
        raise ValueError('response must contain each scenario exactly once')
    lookup = {r['id']: r for r in results}
    return {c['id']: check_case(c, lookup[c['id']]) for c in cases}


def skill_context(root, ref=None):
    prefix = '.agents/skills/fable5-codex/'
    def read(path):
        if ref:
            return subprocess.run(['git', 'show', f'{ref}:{prefix}{path}'], cwd=root,
                                  capture_output=True, text=True, encoding='utf-8', check=True).stdout
        return (root / prefix / path).read_text(encoding='utf-8')
    main = read('SKILL.md')
    port = read('references/source-faithful-port.md')
    # Supply relevant instructions, never the expected traces or prior findings.
    sections = [('4', '5'), ('5-1', '5-2'), ('5-10', '6'), ('7', '8'),
                ('8-1', '8-2'), ('8-4', '8-5'), ('3', '4'), ('10', '11')]
    parts = [main]
    for start, end in sections:
        a, b = f'<a id="f5-section-{start}"></a>', f'<a id="f5-section-{end}"></a>'
        parts.append(port[port.index(a):port.index(b, port.index(a))])
    return '\n\n'.join(parts)


def fingerprints(cases, root=ROOT, ref=None):
    prefix = '.agents/skills/fable5-codex/'
    if ref:
        names = subprocess.run(['git', 'ls-tree', '-r', '--name-only', ref, '--', prefix],
                               cwd=root, capture_output=True, text=True, check=True).stdout.splitlines()
        files = {name[len(prefix):]: subprocess.run(['git', 'show', f'{ref}:{name}'], cwd=root,
                 capture_output=True, check=True).stdout for name in names}
    else:
        folder = root / prefix
        files = {p.relative_to(folder).as_posix(): p.read_bytes() for p in folder.rglob('*') if p.is_file()}
    package = {name: hashlib.sha256(data).hexdigest() for name, data in sorted(files.items())}
    def digest(value):
        return hashlib.sha256(value.encode()).hexdigest()
    return {'instruction_sha256': digest(skill_context(root, ref)),
            'scenario_sha256': digest(json.dumps(cases, sort_keys=True)),
            'skill_package_sha256': digest(json.dumps(package, sort_keys=True))}


def check_observation(cases, evidence, root=ROOT):
    if evidence.get('kind') != 'model_action_plan_evaluation' or evidence.get('baseline_ref') is not None:
        raise ValueError('expected a current-skill model observation')
    if any(evidence.get(k) != v for k, v in fingerprints(cases, root).items()):
        raise ValueError('model observation is stale; rerun --run-model for the changed skill/scenarios')
    verdicts = evaluate(cases, evidence['response'])
    if any(verdicts.values()) or evidence.get('results') != verdicts:
        raise ValueError('observed plans do not meet the scenario contracts')
    return verdicts


def run_model(cases, root, output, ref=None):
    codex = shutil.which('codex')
    if not codex:
        raise RuntimeError('Codex CLI is required for --run-model')
    action = {'type': 'object', 'additionalProperties': False,
              'properties': {'kind': {'type': 'string', 'enum': KINDS}, 'target': {'type': 'string'}},
              'required': ['kind', 'target']}
    item = {'type': 'object', 'additionalProperties': False, 'properties': {
        'id': {'type': 'string'}, 'baseline_applies': {'type': 'boolean'},
        'actions': {'type': 'array', 'items': action},
        'gaps': {'type': 'array', 'items': {'type': 'string'}}, 'answer': {'type': 'string'}},
        'required': ['id', 'baseline_applies', 'actions', 'gaps', 'answer']}
    schema = {'type': 'object', 'additionalProperties': False,
              'properties': {'cases': {'type': 'array', 'items': item}}, 'required': ['cases']}
    public_cases = [{k: v for k, v in c.items() if k not in {'expect', 'source'}} for c in cases]
    prompt = (
        'Evaluate the following skill on independent user scenarios. Decide whether its baseline '
        'applies using the skill activation metadata. Produce the action plan the skill calls for, '
        'in execution order, and a brief proposed answer. Use only the named fixture capabilities. '
        'Do not invoke real tools, shell, network or external services. Action names are a test '
        'protocol, not callable APIs. Use targets exactly from the fixture for skill names, filenames, '
        'connector IDs and game IDs; use an empty target where none is needed. For missing '
        'capabilities use report_gap with app_storage, app_model_api or game_stats as applicable, '
        'and include that identifier in gaps. An answer action means delivering a substantive final '
        'answer, not a short introduction before asking a question. Respect tool contracts that end '
        'the turn. Do not assume any preference or tool result beyond the fixture.\n\n'
        'SKILL INSTRUCTIONS:\n' + skill_context(root, ref) + '\n\nSCENARIOS:\n' + json.dumps(public_cases))
    output.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='f5-eval-') as tmp:
        temp = Path(tmp)
        schema_path, response_path = temp / 'schema.json', temp / 'response.json'
        schema_path.write_text(json.dumps(schema), encoding='utf-8')
        command = [codex, 'exec', '--ephemeral', '--ignore-user-config', '--sandbox', 'read-only',
                   '--skip-git-repo-check', '--cd', str(temp), '--json',
                   '--output-schema', str(schema_path), '--output-last-message', str(response_path), '-']
        result = subprocess.run(command, input=prompt, capture_output=True, text=True,
                                encoding='utf-8', timeout=240)
        # Raw traces remain local evaluation evidence, never repository fixtures.
        output.with_suffix('.events.jsonl').write_text(result.stdout, encoding='utf-8')
        if result.returncode or not response_path.is_file():
            raise RuntimeError(f'Codex evaluation failed: {result.stderr[-1500:]}')
        events = [json.loads(line) for line in result.stdout.splitlines() if line.strip()]
        items = [event.get('item', {}) for event in events if event.get('type') == 'item.completed']
        if any(item.get('type') not in {'agent_message', 'reasoning'} for item in items):
            raise RuntimeError('evaluation invoked a real tool; action-plan-only run required')
        response = json.loads(response_path.read_text(encoding='utf-8'))
    verdicts = evaluate(cases, response)
    evidence = {'kind': 'model_action_plan_evaluation', 'baseline_ref': ref,
                'observed_at_utc': datetime.now(timezone.utc).isoformat(),
                'codex_version': subprocess.run([codex, '--version'], capture_output=True, text=True, check=True).stdout.strip(),
                **fingerprints(cases, root, ref),
                'results': verdicts, 'response': response}
    output.write_text(json.dumps(evidence, ensure_ascii=False, indent=2), encoding='utf-8')
    return verdicts


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--run-model', action='store_true')
    parser.add_argument('--response', type=Path)
    parser.add_argument('--baseline-ref')
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    cases = json.loads(CASES.read_text(encoding='utf-8'))
    if args.run_model:
        verdicts = run_model(cases, ROOT, args.output, args.baseline_ref)
    elif args.response:
        verdicts = evaluate(cases, json.loads(args.response.read_text(encoding='utf-8')))
        args.output.write_text(json.dumps(verdicts, indent=2), encoding='utf-8')
    else:
        parser.error('choose --run-model or --response; no simulated pass is generated')
    for name, errors in verdicts.items():
        print(('[FAIL] ' if errors else '[PASS] ') + name + (': ' + '; '.join(errors) if errors else ''))
    return int(any(verdicts.values()))


if __name__ == '__main__':
    raise SystemExit(main())
