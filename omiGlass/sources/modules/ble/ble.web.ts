import type {
    BleCharacteristic,
    BleClient,
    BleDevice,
    BleService,
    RequestDeviceOptions,
} from './types';

class WebBleCharacteristic implements BleCharacteristic {
    constructor(private characteristic: BluetoothRemoteGATTCharacteristic) {}

    async read(): Promise<Uint8Array> {
        const value = await this.characteristic.readValue();
        return new Uint8Array(value.buffer);
    }

    async write(data: Uint8Array): Promise<void> {
        await this.characteristic.writeValue(data as BufferSource);
    }

    async subscribe(callback: (data: Uint8Array) => void): Promise<() => void> {
        await this.characteristic.startNotifications();
        const handler = (event: Event) => {
            const target = event.target as BluetoothRemoteGATTCharacteristic;
            if (target.value) {
                callback(new Uint8Array(target.value.buffer));
            }
        };
        this.characteristic.addEventListener('characteristicvaluechanged', handler);
        return () => {
            this.characteristic.removeEventListener('characteristicvaluechanged', handler);
            this.characteristic.stopNotifications().catch(() => {
                /* device may already be gone */
            });
        };
    }
}

class WebBleService implements BleService {
    constructor(private service: BluetoothRemoteGATTService) {}

    async getCharacteristic(uuid: string): Promise<BleCharacteristic> {
        const char = await this.service.getCharacteristic(uuid);
        return new WebBleCharacteristic(char);
    }
}

class WebBleDevice implements BleDevice {
    constructor(
        private device: BluetoothDevice,
        private server: BluetoothRemoteGATTServer,
    ) {}

    get id(): string {
        return this.device.id;
    }

    get name(): string | null {
        return this.device.name ?? null;
    }

    async getService(uuid: string): Promise<BleService> {
        const service = await this.server.getPrimaryService(uuid);
        return new WebBleService(service);
    }

    onDisconnect(callback: () => void): () => void {
        const handler = () => callback();
        this.device.addEventListener('gattserverdisconnected', handler);
        return () => {
            this.device.removeEventListener('gattserverdisconnected', handler);
        };
    }
}

class WebBleClient implements BleClient {
    async requestDevice(opts: RequestDeviceOptions): Promise<BleDevice> {
        const device = await navigator.bluetooth.requestDevice({
            filters: [{ name: opts.name }],
            optionalServices: opts.services,
        });
        const server = await device.gatt!.connect();
        return new WebBleDevice(device, server);
    }
}

export const bleClient: BleClient = new WebBleClient();
export type { BleCharacteristic, BleDevice, BleService } from './types';
