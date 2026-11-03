"""Test evaluation integrity with an explicitly simulated model transport.

Real semantic judgments, including the negative controls, are separately
recorded by --run-model. These tests exercise rejection and evidence binding.
"""
import copy
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
import evaluate_behavior as evaluator


class ModelRunIntegrityTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        shutil.copytree(ROOT / '.agents/skills', self.root / '.agents/skills')
        shutil.copytree(ROOT / 'tests/behavior', self.root / 'tests/behavior')
        self.snapshot = evaluator.capture_inputs(self.root)
        self.cases = self.snapshot['cases']
        self.output = self.root / 'observation.json'
        self.response = {'cases': [
            {'id': case['id'], 'baseline_applies': True,
             'actions': [{'kind': k, 'target': t} for k, t in case['expect'].get('sequence', case['expect'].get('required', []))],
             'gaps': case['expect'].get('gaps', []), 'answer': 'Simulated transport fixture.'}
            for case in self.cases]}
        self.judgment = {'reviews': [
            {'id': item['id'], 'verdict': 'pass', 'reason': 'Simulated transport fixture.'}
            for item in evaluator.judge_items(self.snapshot, self.response)]}
        controls = {c['id']: c for c in self.snapshot['controls']}
        for row in self.judgment['reviews']:
            if row['id'] in controls:
                row['verdict'] = 'pass' if controls[row['id']]['expected_pass'] else 'fail'

    def run_simulated(self, transport=None):
        responses = iter([self.response, self.judgment])
        def default_transport(*args):
            return copy.deepcopy(next(responses))
        with patch.object(evaluator.shutil, 'which', return_value='codex-test'), \
             patch.object(evaluator.subprocess, 'run', return_value=subprocess.CompletedProcess([], 0, stdout='test-version')), \
             patch.object(evaluator, 'model_call', side_effect=transport or default_transport) as call:
            results = evaluator.run_model(self.cases, self.root, self.output)
        return results, call

    def test_success_binds_actual_submitted_prompts_and_can_be_replayed(self):
        results, call = self.run_simulated()
        self.assertFalse(any(results.values()))
        evidence = json.loads(self.output.read_text(encoding='utf-8'))
        self.assertEqual(evaluator.digest(call.call_args_list[0].args[1]), evidence['submitted_prompt_sha256'])
        self.assertEqual(evaluator.digest(call.call_args_list[1].args[1]), evidence['judge_prompt_sha256'])
        self.assertEqual(results, evaluator.check_observation(self.cases, evidence, self.root))

    def test_expected_traces_and_control_verdicts_are_not_submitted(self):
        _, call = self.run_simulated()
        scenarios = json.loads(call.call_args_list[0].args[1].split('\n\nSCENARIOS:\n', 1)[1])
        self.assertTrue(all('expect' not in case and 'source' not in case for case in scenarios))
        items = json.loads(call.call_args_list[1].args[1].split('\n\nITEMS:\n', 1)[1])
        self.assertTrue(all('expected_pass' not in item and 'verdict' not in item for item in items))

    def test_changes_during_generation_cannot_receive_fresh_fingerprints(self):
        paths = ['.agents/skills/fable5-codex/SKILL.md',
                 '.agents/skills/fable5-codex/references/code-review.md',
                 'tests/behavior/cases.json', 'tests/behavior/answer-controls.json']
        for name in paths:
            with self.subTest(path=name):
                path = self.root / name
                original = path.read_bytes()
                def transport(*args):
                    if path.suffix == '.json':
                        data = json.loads(original)
                        data[0]['request' if 'request' in data[0] else 'answer'] = 'Changed during evaluation.'
                        path.write_text(json.dumps(data), encoding='utf-8')
                    else:
                        path.write_bytes(original + b'\nChanged during evaluation.\n')
                    return self.response
                try:
                    with self.assertRaisesRegex(RuntimeError, 'inputs changed'):
                        self.run_simulated(transport)
                    self.assertFalse(self.output.exists())
                finally:
                    path.write_bytes(original)

    def test_changes_during_answer_judging_also_abort(self):
        calls = []
        def transport(*args):
            calls.append(args)
            if len(calls) == 1:
                return self.response
            path = self.root / '.agents/skills/fable5-codex/SKILL.md'
            path.write_bytes(path.read_bytes() + b'\nChanged while judging.\n')
            return self.judgment
        with self.assertRaisesRegex(RuntimeError, 'inputs changed'):
            self.run_simulated(transport)
        self.assertFalse(self.output.exists())

    def test_failed_control_cannot_produce_accepted_evidence(self):
        control_id = next(c['id'] for c in self.snapshot['controls'] if not c['expected_pass'])
        next(row for row in self.judgment['reviews'] if row['id'] == control_id)['verdict'] = 'pass'
        with self.assertRaisesRegex(ValueError, 'failed control'):
            self.run_simulated()
        self.assertFalse(self.output.exists())

    def test_judge_must_cover_every_answer_and_control_once(self):
        for rows in [self.judgment['reviews'][:-1], self.judgment['reviews'] + self.judgment['reviews'][:1]]:
            with self.subTest(count=len(rows)), self.assertRaisesRegex(ValueError, 'exactly once'):
                evaluator.answer_reviews(self.snapshot, self.response, {'reviews': rows})

    def test_rejected_answer_is_not_hidden_by_correct_action_markers(self):
        row = next(row for row in self.judgment['reviews'] if row['id'] == 'storage-gap')
        row.update(verdict='fail', reason='The answer falsely promises persistence.')
        results, _ = self.run_simulated()
        self.assertTrue(results['storage-gap'])
        evidence = json.loads(self.output.read_text(encoding='utf-8'))
        with self.assertRaisesRegex(ValueError, 'contracts'):
            evaluator.check_observation(self.cases, evidence, self.root)

    def test_edited_response_cannot_reuse_an_old_answer_judgment(self):
        self.run_simulated()
        evidence = json.loads(self.output.read_text(encoding='utf-8'))
        next(row for row in evidence['response']['cases'] if row['id'] == 'storage-gap')['answer'] = 'It saves permanently.'
        with self.assertRaisesRegex(ValueError, 'binding'):
            evaluator.check_observation(self.cases, evidence, self.root)

    def test_changed_checker_invalidates_replayed_evidence(self):
        self.run_simulated()
        evidence = json.loads(self.output.read_text(encoding='utf-8'))
        evidence['evaluator_sha256'] = 'previous evaluator'
        with self.assertRaisesRegex(ValueError, 'stale'):
            evaluator.check_observation(self.cases, evidence, self.root)


if __name__ == '__main__':
    unittest.main()
