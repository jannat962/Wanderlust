# Sagbrain – Backend Developer Interview Q&A
**Interview Preparation Document (Speak-Ready Answers)**

Every answer below is crafted to be **spoken naturally** in an interview. Each one includes a **specific, real example** from the actual Wakuwaku Link / Sagbrain codebase.

---

## 1. What is FastAPI, and why did you choose it for building RESTful APIs at Sagbrain?

**Answer:**

FastAPI is a modern, high-performance Python web framework built on top of Starlette and Pydantic.

I chose it at Sagbrain for three practical reasons:

1. **Native async support** — Our API makes calls to external AI services like Google Gemini. With FastAPI's `async/await`, one user waiting for an AI response doesn't block the server for everyone else. In our codebase, every single endpoint function starts with `async def`, so the entire server is non-blocking.

2. **Automatic validation** — We use Pydantic schemas like `LessonCreate` and `CourseReview`. When a frontend developer sends a POST request with a missing field, FastAPI **automatically** returns a clear 422 error — I don't have to write that validation manually.

3. **Auto-generated documentation** — FastAPI creates a full Swagger UI at `/docs`. Our frontend team literally opens that page, sees all 204 endpoints neatly organized by tags like "Courses", "Speech", "Enrollments", and can test any endpoint live. It saved us hours of communication.

---

## 2. Describe the course management system you built. How did you structure the database and endpoints?

**Answer:**

The course management system is the backbone of our learning platform. I structured it as three interconnected database tables using SQLAlchemy ORM:

- **`courses` table** — Stores high-level info: `name`, `level` (N5 to N1), `description`, `thumbnail_url`, `status` (draft or published).
- **`lessons` table** — Each lesson has a `course_id` foreign key linking it to its parent course, plus `lesson_number`, `lesson_name`, and `learning_objectives`.
- **`lesson_sections` table** — Each section belongs to a lesson via `lesson_id`. It has a `section_type` (vocabulary, conversation, practice, assessment) and `sequence_order`.

For the endpoints, I created dedicated API router files:
- `course_api.py` — handles `GET /courses`, `POST /courses`, `PATCH /courses/{id}`, `DELETE /courses/{id}`
- `lesson_api.py` — handles lesson CRUD under courses
- `section_api.py` — handles section CRUD under lessons

**Specific example:** When a frontend calls `GET /api/courses/1`, my endpoint fetches the Course object, and SQLAlchemy's `relationship()` automatically loads all related lessons and their sections — the admin sees the full course tree in one API call.

---

## 3. Why is a hierarchical structure (Course → Lesson → Section) beneficial? How did you implement it?

**Answer:**

The hierarchy mirrors how people naturally learn a language. Think about a real textbook:
- The **Course** is the book itself — "Japanese N5"
- A **Lesson** is a chapter — "Greetings and Self-Introduction"
- A **Section** is a specific activity — a vocabulary list, a conversation drill, or a quiz

This matters because:
1. **Progress tracking becomes granular** — we can tell a user "You've completed 7 out of 12 sections in Lesson 3" instead of just "50% done."
2. **Content creation is modular** — an admin can add a new vocabulary section to Lesson 3 without touching anything else.
3. **Cascade operations work naturally** — if we delete a course, all its lessons and their sections are removed cleanly.

**How I implemented it:** Each model uses SQLAlchemy foreign keys. In `lesson.py`, the `Lesson` class has `course_id = Column(Integer, ForeignKey("courses.id"))` and `sections = relationship("LessonSection", back_populates="lesson")`. This means calling `lesson.sections` in Python automatically generates the right SQL JOIN.

---

## 4. How did you implement CRUD operations? Walk through creating a new lesson.

**Answer:**

Let me walk through exactly what happens when an admin creates a new lesson:

**Step 1 — HTTP Request:** The frontend sends a `POST /api/lessons` with JSON body:
```json
{
  "course_id": 1,
  "lesson_number": 3,
  "lesson_name": "Greetings",
  "learning_objectives": ["Say hello", "Introduce yourself"],
  "estimated_minutes": 30
}
```

**Step 2 — Authentication:** FastAPI runs my `get_current_user` dependency. It extracts the JWT from the `Authorization` header, decodes it with `python-jose`, and verifies the user has an admin role. If not → 403 Forbidden.

**Step 3 — Validation:** Pydantic validates every field. If `lesson_name` is missing → FastAPI returns 422 with a clear error message automatically.

**Step 4 — Database Write:**
```python
new_lesson = Lesson(
    course_id=data.course_id,
    lesson_number=data.lesson_number,
    lesson_name=data.lesson_name,
    learning_objectives=data.learning_objectives
)
db.add(new_lesson)
await db.commit()
await db.refresh(new_lesson)
```

**Step 5 — Response:** The new lesson object (including its auto-generated `id` and `created_at` timestamp) is returned as JSON.

---

## 5. How did you design the data model for reviews? How do you calculate the overall rating?

**Answer:**

We have two separate review models — `CourseReview` and `TutorReview`.

The `CourseReview` model in `review.py` stores:
- `course_id` — which course is being reviewed
- `user_id` — who wrote the review
- `enrollment_id` — proves the reviewer actually took the course
- `rating` — integer, 1 to 5
- `comment` — their written feedback
- `status` — an enum: `pending`, `approved`, or `rejected` (for moderation)
- `is_public` — boolean, controls visibility

**How I calculate the aggregated rating:**

I don't calculate it dynamically on every page load — that would be a slow `SELECT AVG(rating)` across thousands of rows on every request. Instead, when a new review is submitted or updated, I run a background aggregation:

```python
avg_result = await db.execute(
    select(func.avg(CourseReview.rating))
    .where(CourseReview.course_id == course_id)
    .where(CourseReview.status == ReviewStatus.approved)
)
```

This computed average is then stored directly on the Course model. So when the landing page shows "4.3 stars", it's reading one pre-computed column — instant response.

---

## 6. What validation logic did you implement for reviews?

**Answer:**

Reviews go through multiple validation layers:

1. **Schema Validation (Pydantic):** The rating must be an integer between 1 and 5. If someone sends `rating: 6` or `rating: "abc"`, Pydantic rejects it with a 422 before my code even runs.

2. **Enrollment Verification:** Before accepting a review, I check the `enrollment_id` — the user must have an active or completed enrollment for that course. You can't review a course you haven't taken.

3. **Duplicate Prevention:** I query `CourseReview` to check if this `user_id` already reviewed this `course_id`. If yes, they can only update — not create a duplicate.

4. **Moderation Status:** Every new review starts with `status = ReviewStatus.pending`. An admin must approve it before it becomes visible. We also maintain a `ReviewModerationLog` table that tracks who approved/rejected each review and why — this creates an audit trail.

5. **Text Sanitization:** The `comment` field is sanitized to strip potentially harmful HTML/JavaScript to prevent XSS attacks.

---

## 7. Explain the AI-powered speech evaluation integration. Which service do you use?

**Answer:**

I integrated **Google's Gemini AI** for real-time pronunciation evaluation. Here's exactly how it works:

1. **User records audio** on the frontend → sends a `.webm` audio file to `POST /api/speech/evaluate`
2. **My endpoint receives** the file along with a `target_word` (e.g., "こんにちは") and optionally a `target_reading`
3. **I convert the audio to base64:**
   ```python
   audio_base64 = base64.b64encode(audio_data).decode("utf-8")
   ```
4. **I build a detailed prompt** telling Gemini to act as a strict Japanese pronunciation evaluator. It must:
   - Transcribe what it hears
   - Compare against the target word
   - Return scores in a strict JSON format
5. **I send both the audio and prompt to Gemini:**
   ```python
   response = model.generate_content([
       {"inline_data": {"mime_type": "audio/webm", "data": audio_base64}},
       prompt
   ])
   ```
6. **I parse the JSON response** which contains a `pronunciation_score` (0-100), `fluency_score` (0-100), and `detailed_feedback` with specific tips.
7. **I save the scores** to our `SpeechEvaluation` table linked to the user's enrollment progress.

**Failover system:** I also built resilience. I maintain a list of fallback models — `gemini-2.5-flash`, `gemini-3-flash`, `gemini-2.5-flash-lite`. If the primary model hits a rate limit (429 error), my code automatically tries the next model in the list without failing the user's request.

---

## 8. How do you handle asynchronous calls to the AI service without slowing down the user experience?

**Answer:**

There are two key strategies:

**1. FastAPI's native async/await:**
My `evaluate_speech` endpoint is defined as `async def`. When it awaits the Gemini API response (which can take 2-3 seconds), FastAPI's event loop **releases the thread**. This means other users' requests continue being served while one user waits for their speech evaluation. If I used synchronous code, the entire server would freeze for every AI call.

**2. Non-blocking database saves:**
After the AI returns, I save the evaluation result to the database **asynchronously**:
```python
db.add(db_evaluation)
await db.commit()
```
I also wrapped the database save in a `try-except` block — if the save fails for some reason, the user still gets their scores back. The saving failure is just logged, not surfaced to the user:
```python
except Exception as e:
    print(f"[Speech Eval] Failed to save to DB: {e}")
    # Don't fail the request, just log error
```

This ensures the user always gets a fast, reliable experience.

---

## 9. What is Neon Cloud (PostgreSQL)? Why was it chosen? How did you connect FastAPI to it?

**Answer:**

**Neon Cloud** is a serverless PostgreSQL platform. Think of it as "PostgreSQL as a service" — we don't manage any database servers ourselves. 

We chose it because:
- It **scales automatically** — handles traffic spikes without manual intervention
- It supports **database branching** — we can create a staging copy of our production database in seconds for testing
- It's **cost-effective** — you only pay for compute time when queries are running

**How I connected to it:** In our `database.py`, I use SQLAlchemy's async engine:
```python
engine = create_async_engine(
    cleaned_url,
    pool_pre_ping=True,
    pool_recycle=300,
    pool_size=10,
    max_overflow=20,
    pool_timeout=30,
    connect_args={"ssl": "require"}
)
```

I had to solve a specific compatibility issue — Neon's connection string includes `sslmode` parameters that conflict with `asyncpg`. So I wrote a regex to clean those out:
```python
cleaned_url = re.sub(r'(\?|&)sslmode=[^&]*', '', settings.DATABASE_URL)
```

The `pool_recycle=300` is critical for Neon because serverless databases can drop idle connections. This forces our pool to recycle connections every 5 minutes, preventing random "connection closed" errors.

---

## 10. Give an example of a database query optimization you performed.

**Answer:**

**The Problem:** When loading a user's enrollment dashboard, we needed to show all their courses with lesson counts, progress percentages, and tutor info. The original query was separate: one query for enrollments, then for each enrollment another query for courses, then for each course another query for lessons. With 10 enrollments, that's **30+ database calls** — the N+1 query problem.

**The Solution — Eager Loading:**
I used SQLAlchemy's `selectinload` to bundle related data into a single optimized query:
```python
result = await db.execute(
    select(Enrollment)
    .where(Enrollment.user_id == user_id)
    .options(
        selectinload(Enrollment.course)
        .selectinload(Course.lessons),
        selectinload(Enrollment.progress)
    )
)
```
This reduced 30+ queries down to just 3 batched queries.

**Indices:**
In our `section.py`, I explicitly created composite database indices:
```python
__table_args__ = (
    Index("practice_content_items_order_idx", "section_content_id", "order_index", unique=True),
)
```
This ensures that queries filtering by `section_content_id` and sorting by `order_index` are extremely fast, even with thousands of practice questions.

**Result:** Dashboard load time dropped from ~1.2 seconds to under 200 milliseconds.

---

## 11. How does Alembic fit into your development workflow?

**Answer:**

Alembic is our database migration tool. Here's our exact workflow when someone adds a new feature:

**Scenario: Adding a `lesson_goal_furigana` column to `lesson_sections`.**

1. **Developer updates the model** in `lesson.py`:
   ```python
   lesson_goal_furigana = Column(JSON, nullable=True)
   ```

2. **Generate migration script:**
   ```bash
   alembic revision --autogenerate -m "add lesson_goal_furigana"
   ```
   Alembic compares our Python models against the live database schema and generates:
   ```python
   def upgrade():
       op.add_column('lesson_sections', sa.Column('lesson_goal_furigana', JSON, nullable=True))

   def downgrade():
       op.drop_column('lesson_sections', 'lesson_goal_furigana')
   ```

3. **Code review** — the migration script goes through a Pull Request. A teammate reviews it.

4. **Apply to staging:**
   ```bash
   alembic upgrade head
   ```

5. **Apply to production** via our Bitbucket CI/CD pipeline automatically during deployment.

The `downgrade()` function is key — if something goes wrong, we can run `alembic downgrade -1` to safely roll back without data loss.

---

## 12. Describe an example pytest unit test you wrote.

**Answer:**

Here's a test I wrote for the course listing endpoint:

```python
@pytest.mark.asyncio
async def test_list_courses_returns_published():
    async with AsyncClient(app=app, base_url="http://test") as client:
        # Create a test JWT for an admin user
        token = create_access_token(subject="test-admin-id")

        # Call the endpoint
        response = await client.get(
            "/api/courses",
            headers={"Authorization": f"Bearer {token}"}
        )

        # Assert status code
        assert response.status_code == 200

        # Assert response structure
        data = response.json()
        assert "courses" in data
        assert isinstance(data["courses"], list)

        # Assert only published courses are returned
        for course in data["courses"]:
            assert course["status"] == "published"
```

This test covers the scenario: **"When a user requests the course list, only published courses should be returned — not drafts."**

We use `pytest-asyncio` because our endpoints are async, and `httpx.AsyncClient` to simulate real HTTP requests against our FastAPI app without spinning up a real server.

---

## 13. How do you handle authentication and authorization? Describe the JWT process.

**Answer:**

**Authentication — "Who are you?"**

1. User sends `POST /api/auth/login` with email and password.
2. I look up the user in the database and verify the password using `bcrypt.checkpw()`.
3. If valid, I generate two tokens using `python-jose`:
   - **Access Token** (15 minutes): Contains `{"sub": "user-id-123", "exp": ..., "type": "access"}`
   - **Refresh Token** (7 days): Contains `{"sub": "user-id-123", "exp": ..., "type": "refresh"}`
4. Both are signed with our `JWT_SECRET_KEY` using the `HS256` algorithm.

**Verification — "Are you allowed here?"**

For every protected endpoint, I have a dependency chain:
1. `get_current_user_id` — Extracts the token from the `Authorization: Bearer <token>` header, decodes it, checks expiration, and returns the `user_id`.
2. `get_current_user` — Takes that `user_id`, queries the database, and returns the full `User` object. Also checks if the account is `disabled`.
3. `require_role(UserRole.ADMIN)` — A factory function that checks if the user's role is in the allowed list. If a student tries to access an admin endpoint → 403 Forbidden.

**Refresh flow:** When the access token expires, the frontend sends the refresh token to `POST /api/auth/refresh`. I verify it with a separate secret key, then issue a brand-new access token — so the user doesn't have to log in again.

---

## 14. Discuss security measures you implemented.

**Answer:**

We implemented security at five different layers:

**1. Password Hashing (bcrypt):**
In `security.py`, every password is hashed before storage:
```python
salt = bcrypt.gensalt()
hashed = bcrypt.hashpw(password_bytes, salt)
```
Even if our database is breached, attackers only see hashed values — they can't reverse them.

**2. CORS Configuration:**
In `main.py`, we explicitly whitelist only our frontend origins:
```python
origins = [
    "http://localhost:3001",
    "http://localhost:5173",
]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True)
```
A random website cannot make API calls to our backend — the browser blocks it.

**3. SQL Injection Prevention:**
Because we use SQLAlchemy ORM (not raw SQL strings), all queries are automatically parameterized. A user entering `'; DROP TABLE users;--` in a search field will never execute as SQL.

**4. Input Validation (Pydantic):**
Every request body passes through Pydantic schemas with strict type checking. Invalid data is rejected automatically before reaching any business logic.

**5. Account Status Checks:**
In `dependencies.py`, after verifying the JWT, I also check:
```python
if user.status == UserStatus.disabled:
    raise HTTPException(status_code=403, detail="Account has been disabled")
```
This means even if someone has a valid token but their account was disabled by an admin, they can't access anything.

---

## 15. How did you collaborate with your team of 3? What tools did you use?

**Answer:**

We worked as a team of 3 backend developers, and here's how we stayed organized:

**Version Control — Bitbucket Git:**
Our actual codebase has a `bitbucket-pipelines.yml` file for CI/CD. We use a feature-branch workflow:
- Each developer works on branches like `feat/speech-eval` or `fix/cascade-delete`
- When done, we open a Pull Request
- At least one teammate must review and approve before merging to `main`
- The Bitbucket Pipeline then automatically runs tests and deploys to staging

**Code Organization by Team:**
In our codebase, every model file has a comment showing ownership:
```python
# Responsibility: Team 2 (Course/Lesson)
```
```python
# Responsibility: Team 2 (Content Structure) & Team 3 (Conversation Content)
```
I focused on course APIs, speech evaluation, and the caching system. Another developer handled sessions and tutor management. The third handled enrollments, progress tracking, and certificates.

**Communication:**
- **Slack/Discord** for daily standups and quick questions
- **Notion** for documenting API contracts, so the frontend team always knew the exact request/response format
- We also maintained the FastAPI auto-generated Swagger docs at `/docs` — this was our single source of truth for API shapes

**Conflict Prevention:**
By splitting the code into modular files (`course_api.py`, `lesson_api.py`, `section_api.py`), we rarely had merge conflicts. If I was editing course logic, my teammate editing session logic was in a completely different file.
