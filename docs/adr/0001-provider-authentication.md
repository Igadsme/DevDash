# ADR 0001: Separate identity and provider authorization

Status: accepted.

GitHub OAuth identifies the user with minimal profile/email scopes. A GitHub App separately grants explicit read-only repository access and creates short-lived installation tokens at sync time. GitLab and Bitbucket use read-only OAuth credentials encrypted with AES-256-GCM. This prevents an identity session from silently inheriting broad repository access.
