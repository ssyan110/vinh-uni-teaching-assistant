# Local agent runs

Create run packets with `python3 scripts/agent_loop.py init ...`.

Individual run directories are intentionally ignored by Git because they contain
local execution traces and may reference large local-only lesson artifacts. The
operating contract and validation code are versioned; a durable lesson approval,
QA result or release record must still be written to the lesson's established
manifest or evidence directory through the approved workflow.
