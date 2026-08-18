import unittest
from backend.core.database import get_user_settings, update_user_settings, settings_collection

class TestSettingsBackend(unittest.TestCase):
    def setUp(self):
        self.test_user_id = "test_user_phase1"
        settings_collection.delete_many({"user_id": self.test_user_id})

    def tearDown(self):
        settings_collection.delete_many({"user_id": self.test_user_id})

    def test_auto_create_default_settings(self):
        settings = get_user_settings(self.test_user_id)
        self.assertIsNotNone(settings)
        self.assertEqual(settings["user_id"], self.test_user_id)
        
        # Verify schema sections
        self.assertIn("appearance", settings)
        self.assertEqual(settings["appearance"]["theme"], "dark")
        self.assertEqual(settings["appearance"]["accent_color"], "#6366f1")
        self.assertEqual(settings["appearance"]["compact_mode"], False)

        self.assertIn("ai", settings)
        self.assertEqual(settings["ai"]["response_length"], "balanced")
        self.assertEqual(settings["ai"]["markdown_enabled"], True)
        self.assertEqual(settings["ai"]["personality"], "default")

        self.assertIn("memory", settings)
        self.assertEqual(settings["memory"]["memory_enabled"], True)
        self.assertEqual(settings["memory"]["allow_long_term_memory"], True)

        self.assertIn("system", settings)
        self.assertIn("created_at", settings["system"])
        self.assertIn("updated_at", settings["system"])

    def test_update_settings(self):
        get_user_settings(self.test_user_id)
        updated = update_user_settings(self.test_user_id, {
            "appearance": {"theme": "light", "compact_mode": True},
            "ai": {"personality": "axiom"}
        })
        self.assertEqual(updated["appearance"]["theme"], "light")
        self.assertEqual(updated["appearance"]["compact_mode"], True)
        self.assertEqual(updated["ai"]["personality"], "axiom")
        # Ensure unchanged defaults remain intact
        self.assertEqual(updated["appearance"]["accent_color"], "#6366f1")
        self.assertEqual(updated["ai"]["markdown_enabled"], True)

if __name__ == "__main__":
    unittest.main()
