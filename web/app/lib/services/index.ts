import { ServiceFrontend } from './types';

export const services: ServiceFrontend[] = [
    {
        type: 'professional_photos',
        i18nKey: 'services.professionalPhotos',
        enabled: true,
        dataFields: [
            { key: 'mobile', type: 'phone', required: false, i18nKey: 'services.fields.mobile' },
            { key: 'landline', type: 'phone', required: false, i18nKey: 'services.fields.landline' }
        ]
    }
];

export function getEnabledServices(): ServiceFrontend[] {
    return services.filter(s => s.enabled);
}

export type { ServiceFrontend, ServiceDataField } from './types';
