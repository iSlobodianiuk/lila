---
name: checkpoint
description: Enforces a pre-change checkpoint before editing files. Use when the user says "/checkpoint" or asks for confirmation before any code/file changes.
---

# Checkpoint

## Purpose

Require explicit user confirmation before making any file changes.

## Workflow

Before any code or file edit:

1. List the files you plan to modify.
2. Describe the risks of the planned changes.
3. Wait for user confirmation.

Do not edit files until the user confirms.

## Response Format

Use this structure:

```markdown
Planned files:
- `path/to/file1`
- `path/to/file2`

Risks:
- Risk 1
- Risk 2

Reply with confirmation to start.
```

## Notes

- If no files need changes, say so explicitly.
- If scope changes, provide a new checkpoint and wait for confirmation again.
