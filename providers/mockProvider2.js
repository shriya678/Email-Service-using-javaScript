class MockProvider2 {
    async send(email) {
        // Simulate email sending
        console.log('Sending email via MockProvider2...');
        // Simulate success or failure randomly
        const checkrandomNo=Math.random();
        console.log(`MockProvider2 random check: ${checkrandomNo}`);
        console.log(checkrandomNo);
        if (checkrandomNo > 0.5) {
            console.log('MockProvider2 failed to send email.');
            console.log(Math.random);
            throw new Error('MockProvider2 failed to send email');
        }
        return true;
    }
}

module.exports = MockProvider2;