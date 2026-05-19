import * as React from 'react';
import { bleClient, BleDevice } from './ble';

const OMI_SERVICE_UUID = '19b10000-e8f2-537e-4f6c-d104768a1214';
const DEVICE_INFO_SERVICE_UUID = '0000180a-0000-1000-8000-00805f9b34fb';

export function useDevice(): [BleDevice | null, () => Promise<void>, boolean] {
    const [device, setDevice] = React.useState<BleDevice | null>(null);
    const [isConnecting, setIsConnecting] = React.useState<boolean>(false);

    const doConnect = React.useCallback(async () => {
        setIsConnecting(true);
        try {
            console.log('Requesting device connection...');
            const d = await bleClient.requestDevice({
                name: 'OMI Glass',
                services: [OMI_SERVICE_UUID, DEVICE_INFO_SERVICE_UUID],
            });
            console.log('Connected successfully!', d.id);
            d.onDisconnect(() => {
                console.log('Device disconnected');
                setDevice(null);
            });
            setDevice(d);
        } catch (e) {
            console.error('Connection failed:', e);
        } finally {
            setIsConnecting(false);
        }
    }, []);

    return [device, doConnect, isConnecting];
}
