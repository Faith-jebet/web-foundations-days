# Reflection

**The most difficult concept and how I overcame it.**
The hardest concept for me was concurrency: understanding that two requests can both read "this seat is available" and both succeed in writing. My first instinct was always "check, then update", and it looks correct until two users act at the same moment. I overcame it by slowing the problem down and tracing two requests step by step on paper, then rewriting the check and the update as a single conditional `UPDATE` inside a transaction. Seeing that the database's row lock forces one request to wait and re-check made it click. Designing TicketHub forced me to apply it, because "never sell a seat twice" is the whole point of that system.

**What I would improve in my capstone.**
Based on the feedback I received, I would improve how I handle errors and edge cases. The feedback pointed out that my project worked on the happy path but did not clearly handle failures, such as invalid input, slow responses or duplicate requests. I would add proper validation, clear error messages, and idempotent handling of repeated requests, the same ideas I used for payments in TicketHub. I would also document my design decisions and trade-offs in the README so that a reader understands why I built it that way, not only what it does.

**What I will learn next.**
I want to learn how to test systems under load, so I can check my estimates with real numbers instead of only calculations, using tools like k6 or Locust. After that, I want to study caching and message queues in practice, and then deploy a project to the cloud with monitoring, so I can see how a design behaves when real users arrive.
