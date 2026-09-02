#!/usr/bin/env python3
"""Validate one local agent run packet and its evidence hashes."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from agent_loop import load_state, run_paths, validate_state


PROJECT_ROOT = Path(__file__).resolve().parents[1]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--run-id", required=True)
    args = parser.parse_args()
    path = run_paths(PROJECT_ROOT, args.run_id)["state"]
    try:
        state = load_state(path)
        failures = validate_state(PROJECT_ROOT, state, check_evidence=True)
    except (FileNotFoundError, OSError, RuntimeError, ValueError) as error:
        failures = [str(error)]
    result = {
        "run_id": args.run_id,
        "status": "passed" if not failures else "failed",
        "failures": failures,
    }
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if not failures else 1


if __name__ == "__main__":
    raise SystemExit(main())
