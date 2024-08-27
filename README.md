# Resilient Email Sending Service

This project is a resilient email sending service built with Node.js and Express. It uses a fallback mechanism with multiple mock providers, implements retry logic with exponential backoff, includes a circuit breaker for failure management, and rate limiting. The service ensures that emails are sent reliably even in the presence of transient errors or provider failures.

## Features

- **Retry Logic**: If an email send attempt fails, the service retries the operation with exponential backoff.
- **Fallback Mechanism**: Automatically switches to a different provider if the current provider fails.
- **Rate Limiting**: Limits the number of email send requests within a specified time window.
- **Circuit Breaker**: Temporarily halts email sending after a defined number of consecutive failures.
- **Idempotency**: Prevents duplicate emails from being sent.
- **Queue System**: Queues emails and processes them sequentially.

## Prerequisites

- [Node.js](https://nodejs.org/) (v14 or later)
- [npm](https://www.npmjs.com/) (v6 or later)

## Getting Started



```bash
git clone https://github.com/your-username/email-sending-service.git
cd email-sending-service
npm install
node app.js   - this will run the project

