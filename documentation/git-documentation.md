# Git Documentation

This document provides Git configuration and workflow guidelines for the Laravel + Next.js monorepo project.

## Repository

**URL:** `git@github-oaa:oaa-dev/laravel-react-project.git`

**GitHub:** https://github.com/oaa-dev/laravel-react-project

## SSH Configuration

This project uses a custom SSH host alias for the `oaa-dev` GitHub account. This is required when you have multiple GitHub accounts on the same machine.

### Setup

Add the following to your `~/.ssh/config` file:

```
Host github-oaa
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_ed25519_oaa_dev
  IdentitiesOnly yes
```

### Cloning the Repository

```bash
git clone git@github-oaa:oaa-dev/laravel-react-project.git
```

### Updating Remote for Existing Clone

If you cloned with the default `github.com` host:

```bash
git remote set-url origin git@github-oaa:oaa-dev/laravel-react-project.git
```

### Verify Remote Configuration

```bash
git remote -v
# Expected output:
# origin  git@github-oaa:oaa-dev/laravel-react-project.git (fetch)
# origin  git@github-oaa:oaa-dev/laravel-react-project.git (push)
```

## Branch Strategy

| Branch | Purpose |
|--------|---------|
| `master` | Main production branch |

## Common Git Commands

### Status and Logs

```bash
git status                  # Check working tree status
git log --oneline -10       # View last 10 commits
git diff                    # View unstaged changes
git diff --cached           # View staged changes
```

### Committing Changes

```bash
git add <file>              # Stage specific file
git add -A                  # Stage all changes
git commit -m "message"     # Commit with message
git push                    # Push to remote
```

### Pulling Updates

```bash
git pull origin master      # Pull latest from master
git fetch origin            # Fetch without merging
```

## Troubleshooting

### Permission Denied Error

If you see `Permission denied (publickey)`:

1. Verify SSH key exists:
   ```bash
   ls -la ~/.ssh/id_ed25519_oaa_dev
   ```

2. Test SSH connection:
   ```bash
   ssh -T git@github-oaa
   ```

3. Ensure SSH agent has the key:
   ```bash
   ssh-add ~/.ssh/id_ed25519_oaa_dev
   ```

### Wrong GitHub Account

If pushing with wrong account, verify your SSH config and ensure `IdentitiesOnly yes` is set to prevent SSH from trying other keys.
