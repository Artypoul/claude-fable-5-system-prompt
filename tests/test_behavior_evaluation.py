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
from evaluate_behavior import check_case, check_observation, digest, evaluate

CASES = {c['id']: c for c in json.loads((ROOT / 'tests/behavior/cases.json').read_text())}


def trace(*actions, gaps=(), baseline=True):
    return {'baseline_applies': baseline, 'actions': [{'kind': k, 'target': t} for k, t in actions],
            'gaps': list(gaps), 'answer': 'fixture response'}


def review(result, verdict='pass'):
    # This is a checker unit-test double, not a semantic/model evaluation.
    return {'answer_sha256': digest(result['answer']), 'verdict': verdict, 'reason': 'unit-test judgment'}


class BehaviorEvaluationTests(unittest.TestCase):
    def test_superpowers_route_requires_exact_source_and_order(self):
        case = CASES['superpowers-route']
        good = trace(('scan_skills', ''), ('read_skill', 'superpowers@gigma-skills:using-superpowers'), ('read_skill', 'superpowers@gigma-skills:subagent-driven-development'), ('run_code', 'implementation'), ('answer', ''))
        self.assertEqual([], check_case(case, good, review(good)))
        wrong_source = trace(('scan_skills', ''), ('read_skill', 'superpowers@other:using-superpowers'), ('read_skill', 'superpowers@gigma-skills:subagent-driven-development'), ('run_code', 'implementation'), ('answer', ''))
        self.assertTrue(check_case(case, wrong_source, review(wrong_source)))
        too_late = trace(('scan_skills', ''), ('run_code', 'implementation'), ('read_skill', 'superpowers@gigma-skills:using-superpowers'), ('read_skill', 'superpowers@gigma-skills:subagent-driven-development'), ('answer', ''))
        self.assertTrue(check_case(case, too_late, review(too_late)))
        missing_lifecycle = trace(('scan_skills', ''), ('read_skill', 'superpowers@gigma-skills:using-superpowers'), ('run_code', 'implementation'), ('answer', ''))
        self.assertTrue(check_case(case, missing_lifecycle, review(missing_lifecycle)))
        mixed = trace(('scan_skills', ''), ('read_skill', 'superpowers@other:using-superpowers'), ('read_skill', 'superpowers@gigma-skills:using-superpowers'), ('read_skill', 'superpowers@gigma-skills:subagent-driven-development'), ('run_code', 'implementation'), ('answer', ''))
        self.assertTrue(check_case(case, mixed, review(mixed)))

    def test_superpowers_unavailable_blocks_execution(self):
        case = CASES['superpowers-source-unavailable']
        good = trace(('scan_skills', ''), ('report_gap', 'superpowers_source'), ('answer', ''), gaps=['superpowers_source'])
        self.assertEqual([], check_case(case, good, review(good)))
        wrong = trace(('scan_skills', ''), ('read_skill', 'superpowers@other:using-superpowers'), ('run_code', 'implementation'), ('answer', ''))
        self.assertTrue(check_case(case, wrong, review(wrong)))

    def test_superpowers_incomplete_mcp_uses_verified_host_source(self):
        case = CASES['superpowers-discovery-fallback']
        good = trace(('scan_skills', ''), ('read_skill', 'superpowers@gigma-skills:using-superpowers'), ('answer', ''))
        self.assertEqual([], check_case(case, good, review(good)))
        wrong = trace(('scan_skills', ''), ('read_skill', 'superpowers@other:using-superpowers'), ('answer', ''))
        self.assertTrue(check_case(case, wrong, review(wrong)))
        mixed = trace(('scan_skills', ''), ('read_skill', 'superpowers@other:using-superpowers'), ('read_skill', 'superpowers@gigma-skills:using-superpowers'), ('answer', ''))
        self.assertTrue(check_case(case, mixed, review(mixed)))

    def test_delegation_models_unavailable_are_not_substituted(self):
        case = CASES['superpowers-role-unavailable']
        good = trace(('report_gap', 'reviewer_model'), ('answer', ''), gaps=['reviewer_model'])
        self.assertEqual([], check_case(case, good, review(good)))
        self.assertTrue(check_case(case, trace(('run_code', 'fallback reviewer'), ('answer', ''))))

    def test_incomplete_or_changed_skill_read_blocks_implementation(self):
        for case_id in ('superpowers-read-partial', 'superpowers-read-changed'):
            with self.subTest(case=case_id):
                case = CASES[case_id]
                good = trace(('scan_skills', ''), ('read_skill', 'superpowers@gigma-skills:using-superpowers'),
                             ('report_gap', 'skill_read_integrity'), ('answer', ''), gaps=['skill_read_integrity'])
                self.assertEqual([], check_case(case, good, review(good)))
                wrong_source = trace(('read_skill', 'superpowers@other:using-superpowers'),
                                     ('report_gap', 'skill_read_integrity'), ('answer', ''), gaps=['skill_read_integrity'])
                self.assertTrue(check_case(case, wrong_source, review(wrong_source)))
                mixed = trace(('read_skill', 'superpowers@other:using-superpowers'),
                              ('read_skill', 'superpowers@gigma-skills:using-superpowers'),
                              ('report_gap', 'skill_read_integrity'), ('answer', ''), gaps=['skill_read_integrity'])
                self.assertTrue(check_case(case, mixed, review(mixed)))
                unsafe = trace(('read_skill', 'superpowers@gigma-skills:using-superpowers'),
                               ('report_gap', 'skill_read_integrity'), ('run_code', 'implementation'),
                               ('answer', ''), gaps=['skill_read_integrity'])
                self.assertTrue(check_case(case, unsafe, review(unsafe)))

    def test_recovery_advice_requires_reference_and_ordered_prerequisites(self):
        case = CASES['scope-recovery-advice']
        sequence = case['expect']['sequence']
        valid = trace(*sequence)
        self.assertEqual([], check_case(case, valid, review(valid)))
        for index in range(len(sequence)):
            with self.subTest(missing=sequence[index]):
                broken = trace(*(sequence[:index] + sequence[index + 1:]))
                self.assertTrue(check_case(case, broken, review(broken)))
        for index in range(len(sequence) - 1):
            with self.subTest(swapped=sequence[index:index + 2]):
                swapped = copy.deepcopy(sequence)
                swapped[index], swapped[index + 1] = swapped[index + 1], swapped[index]
                broken = trace(*swapped)
                self.assertTrue(check_case(case, broken, review(broken)))
        broken = copy.deepcopy(valid)
        broken['actions'][0]['target'] = 'SKILL.md'
        self.assertTrue(check_case(case, broken, review(broken)))

    def test_unverified_writers_block_restoration_and_success_claims(self):
        case = CASES['scope-recovery-blocked']
        valid = trace(*case['expect']['sequence'], gaps=['writer_containment'])
        self.assertEqual([], check_case(case, valid, review(valid)))
        for action in ['restore_selective', 'verify_recovery']:
            broken = copy.deepcopy(valid)
            broken['actions'].insert(-1, {'kind': action, 'target': ''})
            self.assertTrue(check_case(case, broken, review(broken)))
        self.assertTrue(check_case(case, valid, review(valid, 'fail')))

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
        self.assertEqual([], check_case(case, good, review(good)))
        self.assertTrue(check_case(case, trace(('sports_scores', ''), ('sports_game_stats', 'game-7'), ('answer', ''))))

    def test_interactive_question_ends_turn_but_complete_brief_needs_no_question(self):
        self.assertEqual([], check_case(CASES['gift-clarification'], trace(('ask_choice', ''))))
        self.assertTrue(check_case(CASES['gift-clarification'], trace(('ask_text', ''))))
        self.assertTrue(check_case(CASES['gift-clarification'], trace(('ask_choice', ''), ('answer', ''))))
        self.assertEqual([], check_case(CASES['complete-brief'], trace(('answer', ''))))

    def test_missing_application_backends_cannot_be_claimed_available(self):
        for key, gap, fake_action in [('storage-gap', 'app_storage', 'persist_state'),
                                      ('model-api-gap', 'app_model_api', 'call_model_api')]:
            good = trace(('report_gap', gap), ('answer', ''), gaps=[gap])
            self.assertEqual([], check_case(CASES[key], good, review(good)))
            self.assertTrue(check_case(CASES[key], trace((fake_action, ''), ('answer', ''))))

    def test_discovery_must_precede_connector_selection(self):
        case = CASES['connector-hit']
        self.assertEqual([], check_case(case, trace(('connector_search', ''), ('suggest_connector', 'files-1'))))
        self.assertTrue(check_case(case, trace(('suggest_connector', 'files-1'), ('connector_search', ''))))

    def test_connector_miss_requires_action_continuation(self):
        case = CASES['connector-miss-action']
        good = trace(('connector_search', ''), ('scan_skills', ''), ('navigate', 'https://rail.example/book'))
        self.assertEqual([], check_case(case, good))
        self.assertTrue(check_case(case, trace(('connector_search', ''), ('answer', ''))))
        self.assertTrue(check_case(case, trace(('scan_skills', ''), ('navigate', 'https://rail.example/book'), ('connector_search', ''))))
        self.assertTrue(check_case(case, trace(('connector_search', ''), ('scan_skills', ''), ('navigate', 'https://wrong.example/'))))

    def test_connector_miss_information_does_not_require_browser(self):
        case = CASES['connector-miss-information']
        self.assertEqual([], check_case(case, trace(('search_web', ''), ('answer', ''))))
        self.assertTrue(check_case(case, trace(('answer', ''))))

    def test_ambiguous_destination_requires_question_and_no_navigation(self):
        case = CASES['connector-miss-ambiguous']
        self.assertEqual([], check_case(case, trace(('connector_search', ''), ('ask_text', ''))))
        self.assertTrue(check_case(case, trace(('connector_search', ''), ('navigate', 'https://guessed.example/'))))

    def test_unavailable_browser_requires_gap_instead_of_fake_navigation(self):
        case = CASES['connector-no-browser']
        good = trace(('connector_search', ''), ('report_gap', 'browser_navigation'), ('answer', ''), gaps=['browser_navigation'])
        self.assertEqual([], check_case(case, good, review(good)))
        self.assertTrue(check_case(case, trace(('connector_search', ''), ('navigate', 'https://rail.example/book'))))

    def test_connected_integration_is_called_without_rediscovery(self):
        case = CASES['connector-connected-direct']
        self.assertEqual([], check_case(case, trace(('connector_call', 'calendar-1'), ('answer', ''))))
        self.assertTrue(check_case(case, trace(('connector_search', ''), ('connector_call', 'calendar-1'), ('answer', ''))))

    def test_multi_item_images_must_follow_their_own_text(self):
        for name in ['visual-multi-item', 'visual-product-comparison']:
            case = CASES[name]
            sequence = case['expect']['sequence']
            self.assertEqual([], check_case(case, trace(*sequence)))
            self.assertTrue(check_case(case, trace(*sequence[:-1])))
            front_loaded = [sequence[1], sequence[3], sequence[0], sequence[2], sequence[4]]
            self.assertTrue(check_case(case, trace(*front_loaded)))
            self.assertTrue(check_case(case, trace(sequence[1], *sequence)))
            swapped_targets = copy.deepcopy(sequence)
            swapped_targets[1][1], swapped_targets[3][1] = swapped_targets[3][1], swapped_targets[1][1]
            self.assertTrue(check_case(case, trace(*swapped_targets)))

    def test_specific_product_and_real_host_restriction_allow_leading_images(self):
        for name in ['visual-specific-product', 'visual-host-restriction']:
            case = CASES[name]
            self.assertEqual([], check_case(case, trace(*case['expect']['sequence'])))
        case = CASES['visual-host-restriction']
        self.assertTrue(check_case(case, trace(*CASES['visual-multi-item']['expect']['sequence'])))

    def test_gap_markers_cannot_replace_review_of_the_answer_text(self):
        case = CASES['storage-gap']
        contradictory = trace(('report_gap', 'app_storage'), ('answer', ''), gaps=['app_storage'])
        contradictory['answer'] = 'The working journal is ready and will save all entries permanently between visits.'
        self.assertTrue(check_case(case, contradictory))
        self.assertTrue(check_case(case, contradictory, review(contradictory, 'fail')))
        stale_review = review(contradictory)
        contradictory['answer'] = 'A different unchecked answer.'
        self.assertTrue(check_case(case, contradictory, stale_review))

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
        with self.assertRaisesRegex(ValueError, 'binding'):
            check_observation(list(CASES.values()), broken)


if __name__ == '__main__':
    unittest.main()
