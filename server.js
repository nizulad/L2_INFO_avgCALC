const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// This tells Node to serve all your frontend files from the "public" folder
app.use(express.static('public'));

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

