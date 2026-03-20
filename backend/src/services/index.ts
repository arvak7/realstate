import { ServiceDefinition } from './types';

export const serviceRegistry = new Map<string, ServiceDefinition>();

serviceRegistry.set('professional_photos', {
    type: 'professional_photos',
    i18nKey: 'services.professionalPhotos',
    enabled: true,
    dataFields: [
        { key: 'mobile', type: 'phone', required: false, i18nKey: 'services.fields.mobile' },
        { key: 'landline', type: 'phone', required: false, i18nKey: 'services.fields.landline' }
    ]
});

export function listServices(): ServiceDefinition[] {
    return Array.from(serviceRegistry.values()).filter(s => s.enabled);
}

export type { ServiceDefinition } from './types';
