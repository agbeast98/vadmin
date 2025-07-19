
import type { PanelType } from '../types';

// This file can be used to export panel-specific logic and details.
// For now, it provides a centralized place for panel metadata.

export const panelDetails: Record<PanelType, { name: string; }> = {
    'alireza-xui': {
        name: 'Alireza-XUI'
    },
    'sanaei': {
        name: 'Sanaei'
    },
    'marzban': {
        name: 'Marzban'
    },
    'shahan': {
        name: 'Shahan'
    }
};

// Later, you could export functions from each panel's file like so:
// export * as alireza from './alireza-xui';
// export * as sanaei from './sanaei';
