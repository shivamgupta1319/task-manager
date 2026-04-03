import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '@/lib/firebase';
import { useAuth } from '@/components/AuthProvider';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  createdBy: string;
  assignedTo?: string;
  tags?: string[];
  estimatedTime?: number;
  timeSpent?: number;
  recurrence?: 'none' | 'daily' | 'weekly' | 'monthly';
  createdAt: string;
  updatedAt: string;
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setTasks([]);
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tasksData: Task[] = [];
      snapshot.forEach((doc) => {
        tasksData.push({ id: doc.id, ...doc.data() } as Task);
      });
      setTasks(tasksData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'tasks');
    });

    return () => unsubscribe();
  }, [user]);

  const addTask = async (taskData: Partial<Task>) => {
    if (!user) return;
    try {
      const now = new Date().toISOString();
      const docRef = await addDoc(collection(db, 'tasks'), {
        ...taskData,
        createdBy: user.uid,
        createdAt: now,
        updatedAt: now,
      });
      
      // Add activity log
      await addDoc(collection(db, 'activity_logs'), {
        taskId: docRef.id,
        action: 'created',
        performedBy: user.uid,
        timestamp: now,
        details: 'Task created'
      });

      // Add notification if assigned to someone else
      if (taskData.assignedTo && taskData.assignedTo !== user.uid) {
        await addDoc(collection(db, 'notifications'), {
          userId: taskData.assignedTo,
          message: `You have been assigned a new task: ${taskData.title}`,
          read: false,
          taskId: docRef.id,
          createdAt: now
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'tasks');
    }
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    if (!user) return;
    try {
      const now = new Date().toISOString();
      const taskRef = doc(db, 'tasks', taskId);
      
      // Get old task to check assignment changes and recurrence
      const oldTask = tasks.find(t => t.id === taskId);
      
      await updateDoc(taskRef, {
        ...updates,
        updatedAt: now
      });

      // Handle recurrence: if marked as done and has recurrence, create next task
      if (updates.status === 'done' && oldTask?.status !== 'done' && oldTask?.recurrence && oldTask.recurrence !== 'none') {
        let nextDueDate = new Date();
        if (oldTask.dueDate) {
          nextDueDate = new Date(oldTask.dueDate);
        }
        
        if (oldTask.recurrence === 'daily') nextDueDate.setDate(nextDueDate.getDate() + 1);
        else if (oldTask.recurrence === 'weekly') nextDueDate.setDate(nextDueDate.getDate() + 7);
        else if (oldTask.recurrence === 'monthly') nextDueDate.setMonth(nextDueDate.getMonth() + 1);

        const newTaskData: Partial<Task> = {
          title: oldTask.title,
          description: oldTask.description,
          status: 'todo',
          priority: oldTask.priority,
          dueDate: nextDueDate.toISOString(),
          assignedTo: oldTask.assignedTo,
          tags: oldTask.tags,
          estimatedTime: oldTask.estimatedTime,
          timeSpent: 0,
          recurrence: oldTask.recurrence,
        };

        await addDoc(collection(db, 'tasks'), {
          ...newTaskData,
          createdBy: user.uid,
          createdAt: now,
          updatedAt: now,
        });
      }

      // Add activity log
      await addDoc(collection(db, 'activity_logs'), {
        taskId,
        action: 'updated',
        performedBy: user.uid,
        timestamp: now,
        details: 'Task updated'
      });

      // Add notification if assigned to someone else and it changed
      if (updates.assignedTo && updates.assignedTo !== user.uid && oldTask?.assignedTo !== updates.assignedTo) {
        await addDoc(collection(db, 'notifications'), {
          userId: updates.assignedTo,
          message: `You have been assigned to task: ${updates.title || oldTask?.title || 'Unknown Task'}`,
          read: false,
          taskId,
          createdAt: now
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tasks/${taskId}`);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!user) return;
    try {
      const now = new Date().toISOString();
      await deleteDoc(doc(db, 'tasks', taskId));
      
      // Add activity log
      await addDoc(collection(db, 'activity_logs'), {
        taskId,
        action: 'deleted',
        performedBy: user.uid,
        timestamp: now,
        details: 'Task deleted'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `tasks/${taskId}`);
    }
  };

  return { tasks, loading, addTask, updateTask, deleteTask };
}
