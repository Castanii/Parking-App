import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';

export interface SlotUpdate {
  parkingAreaId: string;
  availableSlots: number;
  totalSlots: number;
}

export function useParkingWebSocket(onUpdate: (update: SlotUpdate) => void) {
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    const client = new Client({
      brokerURL: 'ws://localhost:45678/ws',
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      onConnect: () => {
        client.subscribe('/topic/parking-updates', (message) => {
          const update: SlotUpdate = JSON.parse(message.body);
          onUpdateRef.current(update);
        });
      },
      reconnectDelay: 5000,
    });
    client.activate();
    return () => { client.deactivate(); };
  }, []);
}
