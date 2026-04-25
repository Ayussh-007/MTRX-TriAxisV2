import { createContext, useContext, useState, useEffect } from 'react';

const ClassroomContext = createContext(null);

export function ClassroomProvider({ children }) {
  const [classroom, setClassroomState] = useState(() => {
    try {
      const stored = sessionStorage.getItem('activeClassroom');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });

  useEffect(() => {
    if (classroom) {
      sessionStorage.setItem('activeClassroom', JSON.stringify(classroom));
    } else {
      sessionStorage.removeItem('activeClassroom');
    }
  }, [classroom]);

  const setClassroom = (room) => setClassroomState(room);
  const clearClassroom = () => setClassroomState(null);

  return (
    <ClassroomContext.Provider value={{ classroom, setClassroom, clearClassroom }}>
      {children}
    </ClassroomContext.Provider>
  );
}

export function useClassroom() {
  const ctx = useContext(ClassroomContext);
  if (!ctx) throw new Error('useClassroom must be used within ClassroomProvider');
  return ctx;
}
