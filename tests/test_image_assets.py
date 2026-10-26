import os
import urllib.request
import pytest

FRONTEND_PUBLIC = os.path.join(os.path.dirname(__file__), "..", "frontend", "public")
FRONTEND_SRC = os.path.join(os.path.dirname(__file__), "..", "frontend", "src")
FRONTEND_DIST = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")

REQUIRED_CANTEEN_IMAGES = [
    "kitchen-prep",
    "commercial-kitchen",
    "fresh-prep",
    "canteen-service",
    "plated-meal",
    "dining-hall",
]


def test_public_canteen_images_exist_and_valid():
    """Verify all 6 canonical canteen images exist in both WebP and JPG formats with valid signatures."""
    canteen_dir = os.path.join(FRONTEND_PUBLIC, "images", "canteen")
    assert os.path.isdir(canteen_dir), f"Canteen image directory missing: {canteen_dir}"

    for img_name in REQUIRED_CANTEEN_IMAGES:
        # Check WebP version
        webp_file = os.path.join(canteen_dir, f"{img_name}.webp")
        assert os.path.isfile(webp_file), f"Missing WebP asset: {webp_file}"
        assert os.path.getsize(webp_file) > 10000, f"WebP asset unexpectedly small: {webp_file}"
        with open(webp_file, "rb") as f:
            header = f.read(12)
            assert header[:4] == b"RIFF" and header[8:12] == b"WEBP", f"Invalid WebP magic bytes: {webp_file}"

        # Check JPG version
        jpg_file = os.path.join(canteen_dir, f"{img_name}.jpg")
        assert os.path.isfile(jpg_file), f"Missing JPG asset: {jpg_file}"
        assert os.path.getsize(jpg_file) > 10000, f"JPG asset unexpectedly small: {jpg_file}"
        with open(jpg_file, "rb") as f:
            header = f.read(3)
            assert header == b"\xff\xd8\xff", f"Invalid JPEG magic bytes: {jpg_file}"


def test_source_code_image_references_exist_in_public():
    """Verify that every image path referenced in frontend source code resolves to a file in public."""
    import re

    pattern = re.compile(r'["\'](/images/canteen/[a-zA-Z0-9_\-]+\.(?:webp|jpg|jpeg|png))["\']')
    referenced_paths = set()

    for root, _, files in os.walk(FRONTEND_SRC):
        for fname in files:
            if fname.endswith((".tsx", ".ts", ".jsx", ".js")):
                filepath = os.path.join(root, fname)
                with open(filepath, "r", encoding="utf-8") as f:
                    content = f.read()
                    matches = pattern.findall(content)
                    referenced_paths.update(matches)

    assert len(referenced_paths) > 0, "Expected at least one /images/canteen reference in source code"

    for ref in referenced_paths:
        relative_path = ref.lstrip("/").replace("/", os.sep)
        target_path = os.path.join(FRONTEND_PUBLIC, relative_path)
        assert os.path.isfile(target_path), f"Source code references missing asset: {ref} (looked at {target_path})"


def test_brand_logo_assets_exist():
    """Verify brand logo assets exist in both public and src/assets with valid PNG headers."""
    public_logo = os.path.join(FRONTEND_PUBLIC, "brand", "wastewise-mark.png")
    src_logo = os.path.join(FRONTEND_SRC, "assets", "brand", "wastewise-mark.png")

    for path in [public_logo, src_logo]:
        assert os.path.isfile(path), f"Brand logo missing: {path}"
        assert os.path.getsize(path) > 10000, f"Brand logo too small: {path}"
        with open(path, "rb") as f:
            assert f.read(8) == b"\x89PNG\r\n\x1a\n", f"Invalid PNG magic bytes: {path}"


def test_build_output_contains_canteen_images():
    """Verify that after Vite build, dist/ contains all required canteen images."""
    if not os.path.exists(FRONTEND_DIST):
        pytest.skip("frontend/dist does not exist yet (run npm run build first)")

    dist_canteen_dir = os.path.join(FRONTEND_DIST, "images", "canteen")
    assert os.path.isdir(dist_canteen_dir), f"dist/images/canteen missing: {dist_canteen_dir}"

    for img_name in REQUIRED_CANTEEN_IMAGES:
        for ext in [".webp", ".jpg"]:
            target = os.path.join(dist_canteen_dir, f"{img_name}{ext}")
            assert os.path.isfile(target), f"Build output missing asset: {target}"
            assert os.path.getsize(target) > 10000, f"Build output asset too small: {target}"


def test_production_http_smoke():
    """Smoke test to verify that the deployed Vercel site serves images with 200 OK and valid image content types."""
    prod_domain = os.environ.get("VERCEL_PROD_URL", "https://waste-wiseailive.vercel.app")
    
    probe_assets = [
        ("/images/canteen/kitchen-prep.webp", "image/webp"),
        ("/images/canteen/kitchen-prep.jpg", "image/jpeg"),
        ("/images/canteen/commercial-kitchen.webp", "image/webp"),
        ("/images/canteen/fresh-prep.webp", "image/webp"),
        ("/images/canteen/canteen-service.webp", "image/webp"),
        ("/images/canteen/plated-meal.webp", "image/webp"),
        ("/images/canteen/dining-hall.webp", "image/webp"),
        ("/brand/wastewise-mark.png", "image/png"),
        ("/favicon.svg", "image/svg+xml"),
    ]

    for rel_path, expected_mime in probe_assets:
        url = prod_domain.rstrip("/") + rel_path
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "WasteWise-SmokeTest/1.0"})
            with urllib.request.urlopen(req, timeout=10) as resp:
                assert resp.status == 200, f"Expected 200 for {url}, got {resp.status}"
                content_type = resp.headers.get("Content-Type", "")
                assert expected_mime in content_type, f"Expected {expected_mime} for {url}, got {content_type}"
                data = resp.read(64)
                assert not data.startswith(b"<!doctype") and not data.startswith(b"<html"), (
                    f"URL returned HTML document instead of binary image: {url}"
                )
        except urllib.error.URLError as e:
            pytest.fail(f"HTTP request to production asset failed for {url}: {e}")
