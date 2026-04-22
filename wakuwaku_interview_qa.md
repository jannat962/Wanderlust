# Wakuwaku Link – Japanese Learning Platform API
**Interview Preparation Document**

This document provides clear, easy-to-understand answers to technical interview questions based on the Wakuwaku Link backend architecture. The answers are structured for speaking naturally and include specific examples from your codebase.

---

### **1. What is Wakuwaku Link? Describe its main purpose and target users (B2C learners and B2B corporate clients).**
**Answer:** Wakuwaku Link is a comprehensive, interactive Japanese learning platform. Its main purpose is to bridge the gap between textbook studying and real-world conversation. It serves two target audiences:
*   **B2C (Individual Learners):** People worldwide studying for JLPT exams (like N5 to N1) who want interactive lessons, AI pronunciation feedback, and access to live tutors.
*   **B2B (Corporate Clients):** Companies operating in Japan that want to monitor and manage the language progress of their foreign employees using an organization dashboard.

### **2. What are the core features of Wakuwaku Link (as a platform)? How do users interact with it?**
**Answer:** The platform has four main pillars:
1.  **Structured Courses:** Users navigate through hierarchical courses (Course → Lesson → Section) ranging from vocabulary to grammar.
2.  **AI Speech Evaluation:** Users record themselves speaking Japanese phrases, and our system scores their pronunciation and fluency in real-time.
3.  **Tutor Booking & Review System:** Users can book live sessions with human tutors and leave reviews on both the courses and the tutors.
4.  **Progress & Certification:** The system tracks every section a user completes and automatically issues PDF certificates upon course completion.

### **3. You are responsible for backend development. How did you design the backend architecture for Wakuwaku Link?**
**Answer:** I designed the backend as a modern, asynchronous RESTful API. 
*   **Routing Layer:** Built with FastAPI, handling incoming HTTP requests and routing them to specific domain controllers (e.g., `courses`, `speech`, `users`).
*   **Service Layer:** Contains the core business logic (like JWT validation and AI processing).
*   **Data Access Layer:** Uses SQLAlchemy ORM to manage database interactions safely.
*   **Database:** A cloud-hosted PostgreSQL instance (Neon Cloud) serving as our source of truth.
This architecture strictly separates concerns (Models, Schemas, Utils, APIs), making it highly scalable and easy for our team of 3 to work on concurrently without merge conflicts.

### **4. Why did you choose FastAPI, PostgreSQL, and SQLAlchemy? How do they fit together?**
**Answer:** 
*   **FastAPI:** I chose it because of its blazing speed and native `async/await` support, which is critical for handling thousands of concurrent users and slow AI API calls without blocking the server. It also auto-generates our Swagger API docs.
*   **PostgreSQL:** We needed a highly reliable relational database because our data is deeply interconnected (Users relate to Enrollments, which relate to Courses and Payments).
*   **SQLAlchemy:** This is the "glue" between our Python code and the database. It allows me to interact with PostgreSQL using Python objects instead of writing raw, error-prone SQL strings. It strictly enforces our data schemas, which prevents bugs.

### **5. Can you explain the data model for courses, lessons, and sections? How is the hierarchy represented in the database?**
**Answer:** The hierarchy is naturally nested using foreign keys.
*   **Course (Top Level):** Contains high-level information like `name`, `level` (e.g., N5), and `target_audience`.
*   **Lesson (Middle Level):** Has a `course_id` mapping it to a parent course. This represents a module, like "Greetings."
*   **Section (Bottom Level):** Has a `lesson_id`. This holds the actual interactive content (like a video link, a multiple-choice quiz, or a text block). 
In SQLAlchemy, I used the `relationship()` function with `back_populates` so that when I query a Course, the ORM knows exactly how to fetch all its child lessons and sections automatically.

### **6. How did you implement course CRUD operations? Walk through the flow of creating a new lesson.**
**Answer:** Let's trace a "Create Lesson" POST request:
1.  **Validation:** The frontend sends a JSON payload. FastAPI uses a Pydantic schema (e.g., `LessonCreate`) to validate that the title is a string and `course_id` is an integer. If data is missing, it auto-returns a 422 error.
2.  **Authorization:** Our dependency injects and checks the current user’s JWT to ensure they have an Admin or Creator role.
3.  **Database Commit:** I map the validated data into a new SQLAlchemy `Lesson` model object. We call `db.add(new_lesson)` and then `await db.commit()`.
4.  **Response:** The new lesson, including its newly generated ID, is returned to the frontend.

### **7. Describe how you manage educational content. How do you handle media file storage and streaming?**
**Answer:** We separate text/data from large media. Text, multiple-choice questions, and document layouts are stored directly in PostgreSQL under standard columns. However, storing large video or audio files in a database is an anti-pattern. Instead, we upload those media files to a cloud bucket (like AWS S3). The database merely stores the `thumbnail_url` or `video_url`. When a user loads a lesson, the frontend requests that URL and streams the video directly from the cloud provider, reducing load on our API server.

### **8. How do you store and update user reviews and ratings? How do you calculate the aggregated rating?**
**Answer:** We have two tables: `CourseReview` and `TutorReview`. When a student submits a review, we save their `rating` (1-5) and `comment`. 
*Calculation Strategy:* We do not dynamically average ratings on every API request—that would be a massive performance bottleneck. Instead, when a new review is added or updated, we trigger a background utility function that runs a SQL `func.avg()` on that course's reviews and updates a static `average_rating` column on the `Course` model itself. Reading the rating is instant.

### **9. How did you implement the AI speech evaluation integration? Which service are you using?**
**Answer:** I integrated Google's **Gemini AI** (`gemini-2.5-flash`). 
*Flow:* When a user practices pronunciation on the frontend, it records an audio file (e.g., `.webm`). That file is POSTed to our FastAPI `/speech/evaluate` endpoint. 
*Data:* I encode the audio into `base64` format and package it with a strict text prompt outlining the target Japanese word. I ask Gemini to act as a strict evaluator, transcribe the audio, and return a JSON payload with a `pronunciation_score`, `fluency_score`, and `detailed_tips`. Our backend parses this JSON and saves the scores to the user's progress record in the database.

### **10. How do you authenticate users? How are JWT tokens generated and verified?**
**Answer:** We use role-based JWT Authentication encoded using the `jose` library. 
*   **Generation:** Upon successful login, the server combines the user's unique ID (`sub`) and an expiration time, signs it with our server's `JWT_SECRET_KEY`, and sends an Access Token (15 mins) and Refresh Token (7 days) back to the client.
*   **Verification:** For secure endpoints, the frontend sends the token in the `Authorization` header. I built a FastAPI Dependency called `get_current_user_id` that intercepts the request, decodes the token using our secret key, and ensures it hasn't expired. If valid, the endpoint executes; if not, it throws a 401 Unauthorized error.

### **11. What measures do you take to secure the API?**
**Answer:** Security is built in at multiple layers:
1.  **Input Sanitization:** Pydantic strictly rejects malformed JSON. We also sanitize text inputs (like review comments) to prevent XSS.
2.  **SQL Injection Prevention:** Because we use SQLAlchemy's ORM, all database queries are parameterized automatically, neutralizing SQL injection vectors.
3.  **Password Security:** Plain text passwords are never stored; they are salted and hashed using `Bcrypt`.
4.  **CORS:** We restrict the `CORSMiddleware` to strictly accept requests only from our production and staging frontend domains.

### **12. Explain how you used Alembic for database migrations. What happens when you add a new column?**
**Answer:** As our platform evolved, we frequently had to alter tables (like adding a `certificate_version` column). Manually writing SQL `ALTER TABLE` commands is risky. Working with Alembic makes this safe.
When I add a new column to a Python model (e.g., `Course.py`), I run `alembic revision --autogenerate`. Alembic scans my Python models, compares them to the live PostgreSQL schema, and writes a safe Python migration script. After my team reviews it in a Pull Request, we deploy. During deployment, the CI/CD pipeline runs `alembic upgrade head`, automatically applying the changes to the live database without data loss.

### **13. How have you tested the API endpoints? Can you give an example of a pytest test case?**
**Answer:** We use `pytest` combined with FastAPI's `httpx.AsyncClient` against an isolated testing database. 
*Example Check:* I wrote a test for the "Submit Section Progress" endpoint. The test initiates an async HTTP client, injects a mock JWT token so it acts like a logged-in student, and sends an HTTP POST representing a completed lesson section. The test asserts two things to pass:
1. The API responds with an HTTP status `200 OK`.
2. Doing a raw database query in the test confirms that the `SectionProgress` table now correctly reflects the user's new progress status.

### **14. Describe a technical challenge you faced while building Wakuwaku Link and how you solved it.**
**Answer:** **Challenge:** Using Gemini AI for speech evaluation occasionally resulted in random rate limiting (429 errors) or timeouts from the provider, which would break the user's learning flow and throw a generic 500 server error on the frontend.
**Solution:** I built an automated failover system inside the `evaluate_speech` service. I created a list of backup models (`gemini-2.5-flash`, `gemini-3-flash`, `gemini-2.5-flash-lite`). I wrapped the API call in a `try-except` loop. If the primary model fails or is rate-limited, the code catches the specific exception and instantly reroutes the request to the next available model in the list. This slashed our error rates and made the feature highly resilient without any user-facing downtime.

### **15. How do you coordinate with your team of 3 developers? What tools do you use?**
**Answer:** We rely on Agile coordination and Git version control. We divide our domains (e.g., I focus heavily on core API architecture, speech eval, and progress tracking, while another developer focuses on the Tutor Portal schemas).
*   **Version Control:** We use Bitbucket/GitHub (Bitbucket pipelines are evident in the repo). No one can push directly to the `main` branch.
*   **Workflow:** We create feature branches (e.g., `feat/speech-eval`). When done, we open a Pull Request. Another developer must peer-review the code for logical bugs and ensure the automated tests pass before we merge it into staging.

### **16. Have you worked on performance optimization? If so, give examples.**
**Answer:** Yes, database performance was a massive priority. 
*   **Query Optimization:** In SQLAlchemy, pulling a student’s enrollment history alongside all the courses they are taking can trigger the "N+1 query problem" (performing 100 queries for 100 courses). I optimized this by using `selectinload` and `joinedload` on relationships, bundling the data fetch into a single optimized SQL query.
*   **Indices:** I also added PostgreSQL table indices to frequently queried columns like `user_id` on the Enrollments and Reviews tables, ensuring lookup speeds stayed under 50ms even as user data grew.

### **17. How do you ensure the API design will be maintainable as the platform grows?**
**Answer:** I enforce three strict architectural patterns:
1.  **Modularization:** Code isn't dumped into one giant file. We strictly divide the codebase into `models`, `schemas`, `api` (routers), and `core` configs. If a developer needs to fix auth, they instantly know to go to `utils/jwt.py`.
2.  **Strict Typing:** By relying heavily on Pydantic schemas and Python type hints, the codebase self-documents. The linter catches dirty data structures before the code even runs.
3.  **Scalable Connections:** We configured our async SQLAlchemy engine using a connection pool (e.g., `pool_size=10`, `pool_recycle=300`), which ensures that as traffic spikes, the database connections remain stable and don't timeout.
