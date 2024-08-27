class MockProvider1 {
    async send(email) {
        // Simulate email sending
        console.log('Sending email via MockProvider1...');
        // Simulate success or failure randomly
        
        const checkrandom=Math.random();
        console.log(checkrandom);

        if (checkrandom > 0.5) {
            throw new Error('MockProvider1 failed to send email');
        }
        return true;
    }
}

module.exports = MockProvider1;
