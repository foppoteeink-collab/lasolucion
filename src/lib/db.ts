import { db, auth } from '../firebase';
import { doc, getDoc, setDoc, collection, getDocs, writeBatch } from 'firebase/firestore';
import { PlayerStats, TaskItem, PomodoroSession, CustomHabit, ShopReward } from '../types';
import { getTodayDateString } from '../utils/date';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo: auth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Upload full state
export const syncToCloud = async (userId: string, data: {
  stats: PlayerStats;
  tasks: TaskItem[];
  pomodoros: PomodoroSession[];
  habits: CustomHabit[];
  shop: ShopReward[];
}) => {
  if (!userId || !db) return;
  const batch = writeBatch(db);
  
  try {
    // 1. Stats
    const statsRef = doc(db, 'users', userId);
    batch.set(statsRef, {
      level: data.stats.level || 1,
      xp: data.stats.currentXp || 0,
      gold: data.stats.coins || 0,
      totalFocusMinutes: 0 /* deprecado */ || 0,
      currentStreak: data.stats.streakDays || 0,
      highestStreak: data.stats.streakDays || 0,
      totalTasksCompleted: 0 /* deprecado */ || 0
    }, { merge: true });

    // 2. Tasks
    data.tasks.forEach(task => {
      const taskRef = doc(db, 'users', userId, 'tasks', task.id);
      batch.set(taskRef, task, { merge: true });
    });

    // 3. Pomodoros
    data.pomodoros.forEach(p => {
      const pRef = doc(db, 'users', userId, 'pomodoro_history', p.id);
      batch.set(pRef, {
        id: p.id,
        duration: p.durationMinutes,
        timestamp: new Date(p.completedAt).getTime(),
        taskName: p.taskTitle
      }, { merge: true });
    });

    // 4. Custom Habits
    data.habits.forEach(h => {
      const hRef = doc(db, 'users', userId, 'custom_habits', h.id);
      batch.set(hRef, h, { merge: true });
    });

    // 5. Shop
    data.shop.forEach(s => {
      const sRef = doc(db, 'users', userId, 'shop_rewards', s.id);
      batch.set(sRef, s, { merge: true });
    });

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${userId}`);
  }
};

// Download full state
export const syncFromCloud = async (userId: string) => {
  if (!userId || !db) return null;
  try {
    const statsSnap = await getDoc(doc(db, 'users', userId));
    if (!statsSnap.exists()) {
      return null;
    }
    
    const statsData = statsSnap.data();
    
    const [tasksSnap, pomoSnap, habitsSnap, shopSnap] = await Promise.all([
      getDocs(collection(db, 'users', userId, 'tasks')),
      getDocs(collection(db, 'users', userId, 'pomodoro_history')),
      getDocs(collection(db, 'users', userId, 'custom_habits')),
      getDocs(collection(db, 'users', userId, 'shop_rewards'))
    ]);

    return {
      stats: statsData,
      tasks: tasksSnap.docs.map(d => d.data() as TaskItem),
      pomodoros: pomoSnap.docs.map(d => {
        const pd = d.data();
        return {
          id: pd.id,
          durationMinutes: pd.duration,
          completedAt: new Date(pd.timestamp).toISOString(),
          taskTitle: pd.taskName,
          category: 'trabajo',
          date: getTodayDateString(new Date(pd.timestamp)),
          xpEarned: 0,
          coinsEarned: 0
        } as PomodoroSession;
      }),
      habits: habitsSnap.docs.map(d => d.data() as CustomHabit),
      shop: shopSnap.docs.map(d => d.data() as ShopReward)
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${userId}`);
    return null;
  }
};
