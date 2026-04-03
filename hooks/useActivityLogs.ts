import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { useAuth } from '@/components/AuthProvider';

export interface ActivityLog {
  id: string;
  taskId: string;
  action: 'created' | 'updated' | 'deleted';
  performedBy: string;
  timestamp: string;
  details?: string;
}

export function useActivityLogs(taskId: string | null) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !taskId) {
      setLogs([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'activity_logs'),
      where('taskId', '==', taskId),
      orderBy('timestamp', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logsData: ActivityLog[] = [];
      snapshot.forEach((doc) => {
        logsData.push({ id: doc.id, ...doc.data() } as ActivityLog);
      });
      setLogs(logsData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'activity_logs');
    });

    return () => unsubscribe();
  }, [user, taskId]);

  return { logs, loading };
}
