const EmailStatus = require('../models/emailStatus');
const MockProvider1 = require('../providers/mockProvider1');
const MockProvider2 = require('../providers/mockProvider2');

class EmailService {
    constructor() {
        this.providers = [new MockProvider1(), new MockProvider2()];
        this.currentProvider = 0;
        this.sentEmails = new Set();
        this.requestCounts = 0;
        this.rateLimit = 5;
        this.timeWindow = 60000;//60s
        this.resetTime = Date.now() + this.timeWindow;
        this.statusLog = [];

        // Circuit breaker
        this.failureCount = 0;
        this.maxFailures = 3;
        this.isCircuitBroken = false;

        // Queue system
        this.emailQueue = [];
        this.isProcessingQueue = false;
    }

    async sendEmail(email) {
        const idempotencyKey = this._generateIdempotencyKey(email);

        if (this.sentEmails.has(idempotencyKey)) {
            const statusEntry = new EmailStatus(idempotencyKey, email);
            statusEntry.updateStatus('duplicate');
            this.statusLog.push(statusEntry); // Log only once
            console.log(`Duplicate email detected: ${idempotencyKey}`);
            return { status: 'duplicate', message: 'Email is a duplicate.' }; // Stop further processing if email is a duplicate
        }

        const statusEntry = new EmailStatus(idempotencyKey, email);
        this.statusLog.push(statusEntry); // Log once before processing
        console.log(`Processing email: ${JSON.stringify(email)}`);

        try {
            this._checkRateLimit();

            if (this.isCircuitBroken) {
                throw new Error('Circuit breaker is open. Please try again later.');
            }

            this.emailQueue.push({ email, statusEntry });
            console.log(`Email added to queue: ${JSON.stringify(email)}`);
            if (!this.isProcessingQueue) {
                this.isProcessingQueue = true;
                await this._processQueue();
            }
            return { status: 'success', message: 'Email sent successfully.' };

        } catch (error) {
            statusEntry.updateStatus('failed', `Provider ${this.currentProvider + 1}`, error.message);
            console.log(`Error sending email: ${error.message}`);
            throw { status: 'error', message: error.message };
        }
    }

    async _processQueue() {
        while (this.emailQueue.length > 0) {
            const { email, statusEntry } = this.emailQueue.shift();

            try {
                console.log(`Attempting to send email from queue: ${JSON.stringify(email)}`);
                await this._attemptToSend(email, 5, 1000, statusEntry);
                this.sentEmails.add(this._generateIdempotencyKey(email));
                statusEntry.updateStatus('sent', `Provider ${this.currentProvider + 1}`);
                this.requestCounts++;
                this.failureCount = 0; // Reset failure count on successful send
                console.log(`Email sent successfully by ${statusEntry.provider}`);
            } catch (error) {
                statusEntry.updateStatus('failed', `Provider ${this.currentProvider + 1}`, error.message);
                console.log(`Failed to send email by ${statusEntry.provider}: ${error.message}`);
                this.failureCount++;
                if (this.failureCount >= this.maxFailures) {
                    this.isCircuitBroken = true;
                    console.log('Circuit breaker tripped due to consecutive failures.');
                }
            }
        }

        this.isProcessingQueue = false;
    }

    _checkRateLimit() {
        const now = Date.now();
        if (now > this.resetTime) {
            this.requestCounts = 0;
            this.resetTime = now + this.timeWindow;
        }
        if (this.requestCounts >= this.rateLimit) {
            console.log('Rate limit exceeded.');
            throw new Error('Rate limit exceeded. Please try again later.');
        }
    }

    async _attemptToSend(email, attemptsLeft, delay, statusEntry) {
        const provider = this.providers[this.currentProvider];
        statusEntry.provider = `Provider ${this.currentProvider + 1}`;

        try {
            console.log(`Sending email using ${statusEntry.provider}. Attempts left: ${attemptsLeft}`);
            await provider.send(email);
            statusEntry.incrementAttempts();
        } catch (error) {
            statusEntry.incrementAttempts();
            console.log(`Attempt ${statusEntry.attempts} failed with error: ${error.message}.`);
            if (attemptsLeft > 0) {
                console.log(`Retrying in ${delay}ms. Attempts left: ${attemptsLeft}`);
                await this._delay(delay);
                const nextDelay = delay * 2;
                await this._attemptToSend(email, attemptsLeft - 1, nextDelay, statusEntry);
            } else {
                this._switchProvider();
                console.log(`Max retry attempts reached for ${statusEntry.provider}. Switching to the next provider.`);
                throw new Error(`Max retry attempts reached for ${statusEntry.provider}.`);
            }
        }
    }

    _generateIdempotencyKey(email) {
        const key =`${email.to}:${email.subject}:${email.body}`;
        console.log(`Generated idempotency key: ${key}`);
        return key;
    }

    _switchProvider() {
        this.currentProvider = (this.currentProvider + 1) % this.providers.length;
        console.log(`Switched to Provider ${this.currentProvider + 1}`);
    }

    _delay(ms) {
        console.log(`Delaying for ${ms}ms`);
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getStatusLog() {
        console.log('Fetching status log');
        return this.statusLog;
    }
}

module.exports = EmailService;
