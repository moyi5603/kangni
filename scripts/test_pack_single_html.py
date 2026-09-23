import tempfile
import unittest
from pathlib import Path

from pack_single_html import collect_public_images, inject_kn_assets


class PackSingleHtmlTest(unittest.TestCase):
    def test_collects_badges_avatars_and_forum_files(self):
        mapping = collect_public_images(Path(__file__).resolve().parent.parent / "public")
        self.assertIn("/badges/p01.png", mapping)
        self.assertTrue(mapping["/badges/p01.png"].startswith("data:image/png;base64,"))
        self.assertIn("/avatars/e001.png", mapping)
        self.assertIn("/forum/secondhand.jpg", mapping)
        self.assertIn("/profile/kone-logo.svg", mapping)
        self.assertIn("/contest-maps/city.svg", mapping)
        self.assertIn("/activities/open-day.jpg", mapping)

    def test_injects_runtime_resolver_and_rewrites_quoted_paths(self):
        mapping = {
            "/badges/p01.png": "data:image/png;base64,aaa",
            "/forum/secondhand.jpg": "data:image/jpeg;base64,bbb",
        }
        html = inject_kn_assets('<div id="root"></div><script>"/forum/secondhand.jpg"</script>', mapping)
        self.assertIn("function knAsset(", html)
        self.assertIn("HTMLImageElement.prototype", html)
        self.assertIn('"/badges/p01.png"', html)
        self.assertIn('knAsset("/forum/secondhand.jpg")', html)
        self.assertNotIn('<script>"/forum/secondhand.jpg"</script>', html)
        self.assertIn('raw.charAt(0)==="#"', html)
        self.assertIn('value.charAt(0)!=="#"', html)


if __name__ == "__main__":
    unittest.main()
