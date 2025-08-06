const express = require('express');
const cors = require('cors');
const pitchRoutes = require('./routes/pitchRoutes');
var bodyParser = require('body-parser');

require('dotenv').config();

const app = express();
// Increase the request size limit for body-parser
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());
app.use(express.json());
const payloadLimit = "50mb"; 

app.use('/uploads', express.static('uploads'));
app.use('/api/pitch', pitchRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
