# Security policy

Please do not disclose suspected vulnerabilities in a public issue. Send a private GitHub security advisory to the repository owner with reproduction steps, affected routes, and impact. Do not include live tokens or user data.

Supported security fixes target the current default branch. Secrets accidentally committed must be revoked at the provider immediately; deleting Git history is not sufficient. Provider credentials belong only in the deployment secret store, and database backups must use encryption and access controls appropriate for private engineering metadata.
