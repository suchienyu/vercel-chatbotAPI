// start.js
const app = require('./server');
const port = process.env.PORT || 3002;

const server = app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${port}`);
});