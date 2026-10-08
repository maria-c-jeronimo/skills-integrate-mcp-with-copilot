# Mergington High School Activities API

A super simple FastAPI application that allows students to view and sign up for extracurricular activities.

## Features

- View all available extracurricular activities
- Sign up for activities

## Getting Started

1. Install the dependencies:

   ```
   pip install fastapi uvicorn itsdangerous
   ```

2. Run the application:

   ```
   uvicorn app:app --reload
   ```

3. Open your browser and go to:
   - API documentation: http://localhost:8000/docs
   - Alternative documentation: http://localhost:8000/redoc

## API Endpoints

| Method | Endpoint                                                          | Description                                                         |
| ------ | ----------------------------------------------------------------- | ------------------------------------------------------------------- |
| GET    | `/activities`                                                     | Get all activities with their details and current participant count |
| POST   | `/activities/{activity_name}/signup?email=student@mergington.edu` | Sign up for an activity                                             |

## Data Model

The application uses a simple data model with meaningful identifiers:

1. **Activities** - Uses activity name as identifier:

   - Description
   - Schedule
   - Maximum number of participants allowed
   - List of student emails who are signed up

2. **Students** - Uses email as identifier:
   - Name
   - Grade level

All data is stored in memory, which means data will be reset when the server restarts.

## Teacher Access

Activity rosters remain visible without logging in. Teachers must log in before
they can register or unregister students.

From the `src` directory, create a teacher account with:

```sh
python manage_teachers.py <username>
```

The command prompts for a password and stores a salted password hash in
`teachers.json`. This local credential file is ignored by Git; see
`teachers.json.example` for its format. Do not commit real teacher credentials.

Set a stable session-signing secret before starting the server, especially when
running multiple workers:

```sh
export SESSION_SECRET="$(python -c 'import secrets; print(secrets.token_urlsafe(32))')"
uvicorn app:app --reload
```

When serving over HTTPS, set `COOKIE_SECURE=true` so the session cookie is only
sent over secure connections.
