import getpass
import json
import sys
from pathlib import Path

from teacher_auth import create_password_hash


teachers_file = Path(__file__).with_name("teachers.json")


def add_teacher(username: str) -> None:
    username = username.strip()
    if not username:
        raise ValueError("Username cannot be empty")

    password = getpass.getpass("Teacher password (12+ characters): ")
    if len(password) < 12:
        raise ValueError("Password must be at least 12 characters")
    if password != getpass.getpass("Confirm password: "):
        raise ValueError("Passwords do not match")

    if teachers_file.exists():
        data = json.loads(teachers_file.read_text())
        if not isinstance(data, dict) or not isinstance(data.get("teachers"), list):
            raise ValueError("Teacher file must contain a teachers list")
    else:
        data = {"teachers": []}

    if any(
        isinstance(teacher, dict) and teacher.get("username") == username
        for teacher in data["teachers"]
    ):
        raise ValueError(f"Teacher '{username}' already exists")

    salt, password_hash = create_password_hash(password)
    data["teachers"].append(
        {"username": username, "salt": salt, "password_hash": password_hash}
    )
    teachers_file.write_text(json.dumps(data, indent=2) + "\n")
    teachers_file.chmod(0o600)
    print(f"Added teacher '{username}' to {teachers_file}")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("Usage: python manage_teachers.py <username>")
    try:
        add_teacher(sys.argv[1])
    except (OSError, json.JSONDecodeError, ValueError) as error:
        raise SystemExit(str(error)) from error