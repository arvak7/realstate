import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import * as Minio from 'minio';
import { Client as ElasticsearchClient } from '@elastic/elasticsearch';
import Redis from 'ioredis';

dotenv.config();

// Prisma
export const prisma = new PrismaClient();

// MinIO
export const minioClient = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT || '9000'),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY || 'minioadminpassword',
});
export const MINIO_BUCKET = process.env.MINIO_BUCKET || 'realstate-properties';

// Elasticsearch
export const esClient = new ElasticsearchClient({
    node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
});

// Redis
export const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
});

export const PORT = process.env.PORT || 3002;
