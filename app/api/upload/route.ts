// app/api/upload/route.ts
import { route, type Router } from '@better-upload/server';
import { toRouteHandler } from '@better-upload/server/adapters/next';
import { cloudflare } from '@better-upload/server/clients';

const router: Router = {
    client: cloudflare({
        accountId: process.env.R2_ACCOUNT_ID!,
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    }),
    bucketName: process.env.R2_BUCKET_NAME!,
    routes: {
        graduation: route({
            fileTypes: ['image/*'],
            maxFileSize: 10 * 1024 * 1024, // 10MB
        }),
    },
};

export const { POST } = toRouteHandler(router);