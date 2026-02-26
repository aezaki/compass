"""
Compass Backend - Policy Loader

This module loads versioned compliance policy packs from disk.

Policy packs are YAML-based and contain:
- rules.yml (risk logic, scoring, prohibited terms)
- disclosures.yml (required disclosure templates)
- taxonomy.yml (tag definitions)

Policy packs are versioned to enable auditability
and future regulatory drift handling.
"""

from pathlib import Path
import yaml


# Resolve project root dynamically
PROJECT_ROOT = Path(__file__).resolve().parents[2]

# Directory containing all policy packs
POLICY_DIR = PROJECT_ROOT / "policy_packs"


def load_policy_pack(policy_pack: str):
    """
    Load a policy pack by name.

    Parameters:
        policy_pack (str): Folder name under policy_packs/

    Returns:
        tuple: (rules, disclosures, taxonomy)
    """
    pack_dir = POLICY_DIR / policy_pack

    if not pack_dir.exists():
        raise FileNotFoundError(f"Policy pack not found: {policy_pack}")

    rules_path = pack_dir / "rules.yml"
    disclosures_path = pack_dir / "disclosures.yml"
    taxonomy_path = pack_dir / "taxonomy.yml"

    rules = yaml.safe_load(rules_path.read_text())
    disclosures = yaml.safe_load(disclosures_path.read_text())
    taxonomy = yaml.safe_load(taxonomy_path.read_text())

    return rules, disclosures, taxonomy