import express from 'express';
import cors from 'cors';
import { PORT } from './config';
import { initMinio, initElasticsearch } from './services/init';
import propertyRoutes from './routes/properties';
import userRoutes from './routes/users';
import catalogRoutes from './routes/catalogs';

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.get('/health', (req, res) => res.send('OK'));

// API Routes
app.use('/catalogs', catalogRoutes);
app.use('/properties', propertyRoutes);
app.use('/me', userRoutes);

app.listen(PORT, async () => {
    console.log(`Backend listening on port ${PORT}`);
    await initMinio();
    await initElasticsearch();
    console.log('All services initialized');
});
