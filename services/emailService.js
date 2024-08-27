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
        this.timeWindow = 60000;
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
            return { status: 'duplicate', message: 'Email is a duplicate.' }; // Stop further processing if email is a duplicate
        }

        const statusEntry = new EmailStatus(idempotencyKey, email);
        this.statusLog.push(statusEntry); // Log once before processing

        try {
            this._checkRateLimit();

            if (this.isCircuitBroken) {
                throw new Error('Circuit breaker is open. Please try again later.');
            }

            this.emailQueue.push({ email, statusEntry });
            if (!this.isProcessingQueue) {
                this.isProcessingQueue = true;
                await this._processQueue();
            }
            return { status: 'success', message: 'Email sent successfully.' };

        } catch (error) {
            statusEntry.updateStatus('failed', `Provider ${this.currentProvider + 1}`, error.message);
            throw { status: 'error', message: error.message };
        }
    }

    async _processQueue() {
        while (this.emailQueue.length > 0) {
            const { email, statusEntry } = this.emailQueue.shift();

            try {
                await this._attemptToSend(email, 5, 1000, statusEntry);
                this.sentEmails.add(this._generateIdempotencyKey(email));
                statusEntry.updateStatus('sent', `Provider ${this.currentProvider + 1}`);
                this.requestCounts++;
                this.failureCount = 0; // Reset failure count on successful send
            } catch (error) {
                statusEntry.updateStatus('failed', `Provider ${this.currentProvider + 1}`, error.message);
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
            throw new Error('Rate limit exceeded. Please try again later.');
        }
    }

    async _attemptToSend(email, attemptsLeft, delay, statusEntry) {
        const provider = this.providers[this.currentProvider];
        statusEntry.provider = `Provider ${this.currentProvider + 1}`;

        try {
            await provider.send(email);
            statusEntry.incrementAttempts();
        } catch (error) {
            statusEntry.incrementAttempts();
            if (attemptsLeft > 0) {
                await this._delay(delay);
                const nextDelay = delay * 2;
                await this._attemptToSend(email, attemptsLeft - 1, nextDelay, statusEntry);
            } else {
                this._switchProvider();
                throw new Error(`Max retry attempts reached for ${statusEntry.provider}.`);
            }
        }
    }

    _generateIdempotencyKey(email) {
        return `${email.to}:${email.subject}:${email.body}`;
    }

    _switchProvider() {
        this.currentProvider = (this.currentProvider + 1) % this.providers.length;
    }

    _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getStatusLog() {
        return this.statusLog;
    }
}

module.exports = EmailService;
