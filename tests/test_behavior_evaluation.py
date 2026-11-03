"""Test the scenario checker with valid and deliberately broken action traces.

These tests do not claim to run a model. The separate evaluate_behavior.py
--run-model command records actual model decisions against the same cases.
"""
import json
import copy
from pathlib import Path
import sys
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from evaluate_behavior import check_case, check_observation, evaluate

CASES = {c['id']: c for c in json.loads((ROOT / 'tests/behavior/cases.json').read_text())}


def trace(*actions, gaps=(), baseline=True):
    return {'baseline_applies': baseline, 'actions': [{'kind': k, 'target': t} for k, t in actions],
            'gaps': list(gaps), 'answer': 'fixture response'}


class BehaviorEvaluationTests(unittest.TestCase):
    def test_recent_score_requires_stats_for_returned_game_before_answer(self):
        case = CASES['recent-score']
        self.assertEqual([], check_case(case, trace(('sports_scores', ''), ('sports_game_stats', 'game-42'), ('answer', ''))))
        for broken in [trace(('sports_scores', ''), ('answer', '')),
                       trace(('sports_game_stats', 'game-42'), ('sports_scores', ''), ('answer', '')),
                       trace(('sports_scores', ''), ('sports_game_stats', 'invented-id'), ('answer', '')),
                       trace(('sports_scores', ''), ('answer', ''), ('sports_game_stats', 'game-42'))]:
            self.assertTrue(check_case(case, broken))

    def test_all_applicable_skills_precede_even_a_one_step_edit(self):
        case = CASES['one-step-edit']
        valid = trace(('scan_skills', ''), ('read_skill', 'editing'), ('read_skill', 'user-writing'), ('edit_file', 'README.md'))
        self.assertEqual([], check_case(case, valid))
        for index in range(3):
            broken = dict(valid, actions=valid['actions'][:index] + valid['actions'][index + 1:])
            self.assertTrue(check_case(case, broken))
        self.assertTrue(check_case(case, trace(('edit_file', 'README.md'), ('scan_skills', ''), ('read_skill', 'editing'), ('read_skill', 'user-writing'))))

    def test_broad_results_require_standings(self):
        self.assertTrue(check_case(CASES['league-results'], trace(('sports_scores', ''), ('answer', ''))))
        self.assertEqual([], check_case(CASES['league-results'], trace(('sports_scores', ''), ('sports_standings', ''), ('answer', ''))))

    def test_unavailable_statistics_are_disclosed_instead_of_invented(self):
        case = CASES['unsupported-stats']
        good = trace(('sports_scores', ''), ('report_gap', 'game_stats'), ('answer', ''), gaps=['game_stats'])
        self.assertEqual([], check_case(case, good))
        self.assertTrue(check_case(case, trace(('sports_scores', ''), ('sports_game_stats', 'game-7'), ('answer', ''))))

    def test_interactive_question_ends_turn_but_complete_brief_needs_no_question(self):
        self.assertEqual([], check_case(CASES['gift-clarification'], trace(('ask_choice', ''))))
        self.assertTrue(check_case(CASES['gift-clarification'], trace(('ask_text', ''))))
        self.assertTrue(check_case(CASES['gift-clarification'], trace(('ask_choice', ''), ('answer', ''))))
        self.assertEqual([], check_case(CASES['complete-brief'], trace(('answer', ''))))

    def test_missing_application_backends_cannot_be_claimed_available(self):
        for key, gap, fake_action in [('storage-gap', 'app_storage', 'persist_state'),
                                      ('model-api-gap', 'app_model_api', 'call_model_api')]:
            self.assertEqual([], check_case(CASES[key], trace(('report_gap', gap), ('answer', ''), gaps=[gap])))
            self.assertTrue(check_case(CASES[key], trace((fake_action, ''), ('answer', ''))))

    def test_discovery_must_precede_connector_selection(self):
        case = CASES['connector-hit']
        self.assertEqual([], check_case(case, trace(('connector_search', ''), ('suggest_connector', 'files-1'))))
        self.assertTrue(check_case(case, trace(('suggest_connector', 'files-1'), ('connector_search', ''))))

    def test_model_cannot_skip_or_duplicate_cases(self):
        with self.assertRaises(ValueError):
            evaluate(list(CASES.values()), {'cases': []})
        self.assertTrue(check_case(CASES['simple-answer'], trace(('answer', ''), baseline=False)))

    def test_recorded_model_observation_matches_current_skill_and_scenarios(self):
        evidence = json.loads((ROOT / 'tests/behavior/observed-results.json').read_text(encoding='utf-8'))
        self.assertEqual(len(CASES), len(check_observation(list(CASES.values()), evidence)))
        stale = dict(evidence, skill_package_sha256='outdated')
        with self.assertRaisesRegex(ValueError, 'stale'):
            check_observation(list(CASES.values()), stale)
        broken = copy.deepcopy(evidence)
        broken['response']['cases'][0]['baseline_applies'] = False
        with self.assertRaisesRegex(ValueError, 'contracts'):
            check_observation(list(CASES.values()), broken)


if __name__ == '__main__':
    unittest.main()
