# Wanderlust Project: Master Interview Preparation Guide

This is your complete, 360-degree technical guide for the Wanderlust project. It includes feature definitions, backend architecture, and advanced problem-solving strategies.

---

## 🏗️ Backend & Business Logic

### 1. Core Business Logic: Listing Management (CRUD)
- **Definition:** **CRUD** (Create, Read, Update, Delete) are the four basic functions of persistent storage.
- **Why we use it:** It forms the backbone of the platform, allowing users to host, view, edit, and remove property listings.
- **In This Project:** 
  - **Create:** `app.post("/listings")` saves a new Mongoose model.
  - **Read:** Index shows all listings; Show uses `.populate("reviews")` for details.
  - **Update/Delete:** Protected routes for modifying or removing listings.

### 2. Review System: One-to-Many Relationships
- **Definition:** One "Listing" can have multiple "Reviews."
- **Why we use it:** To provide social proof and build trust.
- **In This Project:** A "Reference" relationship where the Listing schema stores an array of Review ObjectIds.
- **Real-Time Integration:** Ratings are validated to be between 1-5 using Mongoose/Joi schemas.

### 3. Authentication vs. Authorization
- **Authentication:** Verifying *who* you are (Login/Passport.js).
- **Authorization:** Verifying *what* you can do (your `isLoggedIn` middleware).
- **Speaker's Note:** *"I used middleware to ensure only authenticated users can post properties, and I've architected it so only owners can delete or edit their data."*

---

## 🎨 Frontend & Interactivity

### 1. Icons: FontAwesome 6
- **Definition:** An icon library used for intuitive UI iconography (e.g., home, location markers).
- **Why we use it:** Improves visual cues and creates a premium "Luxury Stays" aesthetic.

### 2. Interactivity: Vanilla JavaScript
- **Definition:** Plain JavaScript used for client-side logic (no heavy frameworks).
- **In This Project:** Used for Bootstrap form validation (instant feedback) and the Voice Assistant.

### 3. Interactive Voice Assistant (Web Speech API)
- **Definition:** Users can navigate the app using voice commands.
- **How it works:** Uses `SpeechRecognition` to listen and `SpeechSynthesisUtterance` to talk back.
- **Standard Workflow:**
  1. **Listen:** Matches keywords like "home" or "login."
  2. **Talk:** Confirms verbally (e.g., "Opening listings").
  3. **Navigate:** Redirects using `window.location.href`.

---

## ❓ 3. Interview Questions & Preparation

### A. Backend & Database
1. **Explain Middleware:** `isLoggedIn` checks authentication and then calls `next()` to pass control to the route.
2. **Relationships:** We use **References** to avoid hitting MongoDB's 16MB document limit and ensure scalability as reviews grow.
3. **Error Handling:** `wrapAsync` catches async errors and passes them to `next(err)` for central handling.
4. **Joi vs Mongoose:** Joi validates the **Incoming Request** (fast feedback); Mongoose validates the **Database Entry** (integrity).

### B. Authentication & Security
5. **Passport.js:** `serializeUser` saves the ID in the session; `deserializeUser` fetches the user object on every request.
6. **Session Management:** Stored in cookies/memory (dev) or MongoStore (prod) to persist logins.
7. **Flash Messages:** Temporary messages in the session that are deleted after being displayed once.

### C. Advanced & Problem Solving
11. **Voice API Challenges:** Handling accents and background noise by using multiple keyword patterns.
12. **RESTful Routing:** HTML forms only support GET/POST; `method-override` allows for proper PUT and DELETE requests.
13. **Env Variables:** `process.env` keeps secret keys (like DB URLs) safe and away from public source code.
14. **Scalability (1M Listings):** Use Indexing, Pagination (fetch in chunks), Redis Caching, and Cloud Storage for images.
15. **Cascading Deletes:** Use Mongoose **Post-Middleware** (`findOneAndDelete`) to automatically delete all associated reviews when a listing is removed.

---

> [!TIP]
> **Pro Tip:** Focus on **"Why"** you made these decisions. Interviewers value engineers who think about security, scalability, and the end-user experience. Good luck! 🚀✨
