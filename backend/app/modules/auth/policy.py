import re

from fastapi import HTTPException, status

from app.modules.config_console.schemas import PasswordPolicy


def validate_password_strength(password: str, policy: PasswordPolicy) -> None:
    problems: list[str] = []
    if len(password) < policy.min_length:
        problems.append(f"at least {policy.min_length} characters")
    if policy.require_uppercase and not re.search(r"[A-Z]", password):
        problems.append("an uppercase letter")
    if policy.require_lowercase and not re.search(r"[a-z]", password):
        problems.append("a lowercase letter")
    if policy.require_digit and not re.search(r"\d", password):
        problems.append("a digit")
    if policy.require_special and not re.search(r"[^A-Za-z0-9]", password):
        problems.append("a special character")

    if problems:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            f"Password must contain {', '.join(problems)}.",
        )


def mask_email(email: str) -> str:
    local, _, domain = email.partition("@")
    if len(local) <= 2:
        masked_local = local[0] + "*" * max(len(local) - 1, 1)
    else:
        masked_local = local[0] + "*" * (len(local) - 2) + local[-1]
    return f"{masked_local}@{domain}"
