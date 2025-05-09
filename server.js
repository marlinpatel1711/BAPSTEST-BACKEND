const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const fileRoutes = require('./routes/fileRoutes');
const protectedRoutes = require('./routes/protected');
const cors = require('cors'); 

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:5173', // or your frontend URL
  credentials: true
}));

mongoose.connect(process.env.MONGO_URI, {

}).then(() => console.log('MongoDB Connected'))
  .catch(err => console.error(err));

app.use('/api/auth', authRoutes);
app.use("/" , console.log("backemd is live"));
app.use('/api/file',fileRoutes);
app.use('/api/protected',protectedRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
