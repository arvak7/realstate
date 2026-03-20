export interface ServiceDataField {
    key: string;
    type: 'phone' | 'text' | 'url' | 'email';
    required: boolean;
    i18nKey: string;
}

export interface ServiceFrontend {
    type: string;
    i18nKey: string;
    enabled: boolean;
    dataFields: ServiceDataField[];
}
