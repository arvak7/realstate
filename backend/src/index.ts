import express from 'express';
import cors from 'cors';
import { PORT } from './config';
import { initMinio, initElasticsearch, syncPrivacyToElasticsearch } from './services/init';
import propertyRoutes from './routes/properties';
import userRoutes from './routes/users';
import catalogRoutes from './routes/catalogs';
import webhookRoutes from './routes/webhooks';

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.get('/health', (req, res) => res.send('OK'));

// API Routes
app.use('/catalogs', catalogRoutes);
app.use('/properties', propertyRoutes);
app.use('/me', userRoutes);
app.use('/webhooks', webhookRoutes);

app.listen(PORT, async () => {
    console.log(`Backend listening on port ${PORT}`);
    await initMinio();
    await initElasticsearch();
    await syncPrivacyToElasticsearch();
    console.log('All services initialized');
});
