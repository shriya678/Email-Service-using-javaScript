const express = require('express');
const emailRoutes = require('./routes/emailRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
console.log('Middleware setup complete.');
app.use('/api/emails', emailRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});


