const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.static('public'));

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Frontend running on http://localhost:${PORT}`);
});