"""
Unit testy pro get_atc_info tool.

Testuje ATC hierarchy logic, validation a edge cases.
"""

import pytest
from unittest.mock import MagicMock
import pandas as pd

from sukl_mcp.client_csv import SUKLClient, SUKLValidationError


@pytest.fixture
def mock_atc_data():
    """Mock data pro ATC klasifikaci (5 úrovní hierarchy)."""
    return pd.DataFrame(
        [
            # Level 1: Anatomická skupina
            {"ATC": "N", "NAZEV": "Nervový systém"},
            # Level 2: Terapeutická skupina
            {"ATC": "N02", "NAZEV": "Analgetika"},
            # Level 3: Farmakologická skupina
            {"ATC": "N02B", "NAZEV": "Jiná analgetika a antipyretika"},
            # Level 4: Chemická skupina
            {"ATC": "N02BE", "NAZEV": "Anilidy"},
            # Level 5: Chemická substance
            {"ATC": "N02BE01", "NAZEV": "Paracetamol"},
            # Další substance v N02BE
            {"ATC": "N02BE02", "NAZEV": "Propacetamol"},
            # Jiná skupina
            {"ATC": "A", "NAZEV": "Trávicí trakt a metabolismus"},
            {"ATC": "A10", "NAZEV": "Léčiva k terapii diabetu"},
        ]
    )


@pytest.fixture
async def mock_client(mock_atc_data):
    """Mock SUKLClient s ATC daty."""
    client = SUKLClient()
    client._initialized = True
    client._loader = MagicMock()
    client._loader.get_table.return_value = mock_atc_data
    return client


# =============================================================================
# HAPPY PATH - HIERARCHY TESTING
# =============================================================================


@pytest.mark.asyncio
async def test_get_atc_groups_level_1(mock_client):
    """Test level 1 - anatomická skupina (1 znak)."""
    results = await mock_client.get_atc_groups("N")

    assert len(results) > 0
    assert any(r["ATC"] == "N" for r in results)
    assert any(r["ATC"] == "N02" for r in results)  # Children


@pytest.mark.asyncio
async def test_get_atc_groups_level_2(mock_client):
    """Test level 2 - terapeutická skupina (3 znaky)."""
    results = await mock_client.get_atc_groups("N02")

    assert len(results) == 5  # N02, N02B, N02BE, N02BE01, N02BE02
    assert all(r["ATC"].startswith("N02") for r in results)


@pytest.mark.asyncio
async def test_get_atc_groups_level_3(mock_client):
    """Test level 3 - farmakologická skupina (4 znaky)."""
    results = await mock_client.get_atc_groups("N02B")

    assert len(results) == 4  # N02B, N02BE, N02BE01, N02BE02
    assert all(r["ATC"].startswith("N02B") for r in results)


@pytest.mark.asyncio
async def test_get_atc_groups_level_4(mock_client):
    """Test level 4 - chemická skupina (5 znaků)."""
    results = await mock_client.get_atc_groups("N02BE")

    assert len(results) == 3  # N02BE, N02BE01, N02BE02
    assert all(r["ATC"].startswith("N02BE") for r in results)


@pytest.mark.asyncio
async def test_get_atc_groups_level_5(mock_client):
    """Test level 5 - chemická substance (7 znaků)."""
    results = await mock_client.get_atc_groups("N02BE01")

    assert len(results) == 1
    assert results[0]["ATC"] == "N02BE01"
    assert results[0]["NAZEV"] == "Paracetamol"


# =============================================================================
# NO PREFIX (ALL GROUPS)
# =============================================================================


@pytest.mark.asyncio
async def test_get_atc_groups_no_prefix(mock_client):
    """Test bez prefixu - vrátí všechny skupiny (max 100)."""
    results = await mock_client.get_atc_groups(None)

    assert len(results) == 8  # Všechny z mock data
    assert any(r["ATC"] == "N" for r in results)
    assert any(r["ATC"] == "A" for r in results)


# =============================================================================
# VALIDATION
# =============================================================================


@pytest.mark.asyncio
async def test_get_atc_groups_too_long_prefix(mock_client):
    """Test validace - příliš dlouhý prefix (>7 znaků)."""
    with pytest.raises(SUKLValidationError, match="příliš dlouhý"):
        await mock_client.get_atc_groups("N02BE01XX")  # 9 znaků


@pytest.mark.asyncio
async def test_get_atc_groups_strips_whitespace(mock_client):
    """Test že se odstraní whitespace z prefixu."""
    results = await mock_client.get_atc_groups("  N02  ")

    assert len(results) > 0
    assert all(r["ATC"].startswith("N02") for r in results)


# =============================================================================
# EDGE CASES
# =============================================================================


@pytest.mark.asyncio
async def test_get_atc_groups_nonexistent_code(mock_client):
    """Test neexistující ATC kód."""
    results = await mock_client.get_atc_groups("Z99")

    assert len(results) == 0


@pytest.mark.asyncio
async def test_get_atc_groups_case_sensitive(mock_client):
    """Test case sensitivity - ATC kódy jsou case-sensitive."""
    results_upper = await mock_client.get_atc_groups("N")
    results_lower = await mock_client.get_atc_groups("n")

    # lowercase "n" by neměl matchnout nic (ATC jsou uppercase)
    assert len(results_upper) > 0
    assert len(results_lower) == 0


@pytest.mark.asyncio
async def test_get_atc_groups_max_100_limit():
    """Test že se vrací max 100 výsledků."""
    # Vytvoř 150 ATC kódů
    large_data = pd.DataFrame([{"ATC": f"N{i:05d}", "NAZEV": f"Group {i}"} for i in range(150)])

    client = SUKLClient()
    client._initialized = True
    client._loader = MagicMock()
    client._loader.get_table.return_value = large_data

    results = await client.get_atc_groups("N")

    assert len(results) == 100  # Max limit


# =============================================================================
# DATA STRUCTURE
# =============================================================================


@pytest.mark.asyncio
async def test_get_atc_groups_data_structure(mock_client):
    """Test struktury vrácených dat."""
    results = await mock_client.get_atc_groups("N02BE01")

    assert len(results) == 1
    group = results[0]

    assert "ATC" in group
    assert "NAZEV" in group
    assert isinstance(group["ATC"], str)
    assert isinstance(group["NAZEV"], str)


# =============================================================================
# TABLE NOT LOADED
# =============================================================================


@pytest.mark.asyncio
async def test_get_atc_groups_table_not_loaded(mock_client):
    """Test když tabulka dlp_atc není načtena."""
    mock_client._loader.get_table.return_value = None

    results = await mock_client.get_atc_groups("N")

    assert results == []


# =============================================================================
# SERVER.PY INTEGRATION (get_atc_info wrapper)
# =============================================================================


@pytest.mark.asyncio
async def test_get_atc_info_finds_target_and_children(mock_client, mock_atc_data):
    """Test že server.py wrapper najde target + children."""
    # Simulace server.py logiky
    atc_code = "N02"
    groups = await mock_client.get_atc_groups(atc_code if len(atc_code) < 7 else None)

    target = None
    children = []

    for group in groups:
        code = group.get("ATC", "")
        if code == atc_code:
            target = group
        elif code.startswith(atc_code) and len(code) > len(atc_code):
            children.append({"code": code, "name": group.get("NAZEV", "")})

    assert target is not None
    assert target["ATC"] == "N02"
    assert target["NAZEV"] == "Analgetika"
    assert len(children) == 4  # N02B, N02BE, N02BE01, N02BE02


@pytest.mark.asyncio
async def test_get_atc_info_limits_children_to_20():
    """Test že children jsou limitovány na 20."""
    # Vytvoř 30 children
    data = pd.DataFrame(
        [{"ATC": "N", "NAZEV": "Nervový systém"}]
        + [{"ATC": f"N{i:02d}", "NAZEV": f"Child {i}"} for i in range(30)]
    )

    client = SUKLClient()
    client._initialized = True
    client._loader = MagicMock()
    client._loader.get_table.return_value = data

    # Simulace server.py logiky
    atc_code = "N"
    groups = await client.get_atc_groups(atc_code if len(atc_code) < 7 else None)

    target = None
    children = []

    for group in groups:
        code = group.get("ATC", "")
        if code == atc_code:
            target = group
        elif code.startswith(atc_code) and len(code) > len(atc_code):
            children.append({"code": code, "name": group.get("NAZEV", "")})

    # Server.py limituje children[:20]
    limited_children = children[:20]

    assert target is not None
    assert len(children) == 30  # Všechny children nalezeny
    assert len(limited_children) == 20  # Ale vrací se jen 20


# =============================================================================
# LEVEL CALCULATION
# =============================================================================


@pytest.mark.asyncio
async def test_atc_level_calculation():
    """Test výpočtu ATC úrovně podle délky kódu."""
    test_cases = [
        ("N", 1),  # Level 1
        ("N02", 3),  # Level 2
        ("N02B", 4),  # Level 3
        ("N02BE", 5),  # Level 4
        ("N02BE01", 5),  # Level 5 (max 5, i když kód má 7 znaků)
    ]

    for code, expected_level in test_cases:
        # Simulace server.py logic
        level = len(code) if len(code) <= 5 else 5
        assert level == expected_level, f"Code {code} should be level {expected_level}, got {level}"
