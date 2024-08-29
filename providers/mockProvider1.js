class MockProvider1 {
    async send(email) {
        // Simulate email sending
        console.log('Sending email via MockProvider1...');
        // Simulate success or failure randomly
        
        const checkrandom=Math.random();
        console.log(`MockProvider1 random check: ${checkrandom}`);

        console.log(checkrandom);

        if (checkrandom > 0.5) {
            console.log('MockProvider1 failed to send email.');
            throw new Error('MockProvider1 failed to send email');
        }
        return true;
    }
}

module.exports = MockProvider1;
