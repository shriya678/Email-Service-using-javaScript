class EmailStatus {
    constructor(idempotencyKey, email) {
        this.idempotencyKey = idempotencyKey;
        this.email = email;
        this.status = 'pending';
        this.provider = null;
        this.error = null;
        this.attempts = 0;
        this.timestamp = new Date();
    }

    updateStatus(newStatus, provider, error = null) {
        this.status = newStatus;
        this.provider = provider;
        this.error = error;
    }

    incrementAttempts() {
        this.attempts += 1;
    }
}

module.exports = EmailStatus;
