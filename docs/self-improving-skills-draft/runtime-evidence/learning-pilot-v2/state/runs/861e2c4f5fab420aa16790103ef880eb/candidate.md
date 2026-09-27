---
name: learned-fixture-export
description: Download exports from the local Aurora fixture API after observing its fetch-key contract.
---

# Aurora fixture export

This procedure applies only to the local Aurora test fixture. Poll the requested export job until status is ready. Its fetch operation takes job_id, even when the response also contains artifact_id. Pass the current requested job's job_id to fetch; do not substitute artifact_id or an older job. Check the downloaded bytes against the expected export. Pending jobs cannot be fetched. Never overwrite an existing destination without authorization.
