import { useState } from 'react';
import { motion } from 'framer-motion';
import { useOS } from '../OSContext';
import { Icon } from '../Icon';

export function CalendarApp() {
  const { calendarTasks, addTask, toggleTask, deleteTask } = useOS();
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'system' | 'work' | 'personal'>('work');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const monthName = today.toLocaleDateString('default', { month: 'long', year: 'numeric' });

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    addTask({
      title: newTitle.trim(),
      date: selectedDate,
      time: '12:00',
      category: newCategory,
      completed: false,
      priority: newPriority,
    });
    setNewTitle('');
  };

  const tasksForSelectedDate = calendarTasks.filter((t) => t.date === selectedDate);

  return (
    <div className="flex h-full w-full bg-zinc-950/60 text-white select-none">
      {/* Left Sidebar / Calendar Grid */}
      <div className="w-80 border-r border-white/10 p-4 flex flex-col justify-between bg-black/20">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Icon name="Calendar" size={18} className="text-orange-400" />
              <h2 className="text-sm font-semibold">{monthName}</h2>
            </div>
            <span className="text-[11px] bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded-full font-medium">
              Today
            </span>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 text-center text-[10px] text-white/40 mb-1 font-semibold uppercase">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="h-8" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const isSelected = selectedDate === dateStr;
              const isToday = dayNum === today.getDate();
              const hasTasks = calendarTasks.some((t) => t.date === dateStr);

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`h-8 w-8 rounded-lg mx-auto flex flex-col items-center justify-center relative transition ${
                    isSelected
                      ? 'bg-orange-500 text-white font-bold shadow-lg shadow-orange-500/30'
                      : isToday
                      ? 'border border-orange-400 text-orange-300 font-semibold'
                      : 'hover:bg-white/10 text-white/80'
                  }`}
                >
                  <span>{dayNum}</span>
                  {hasTasks && (
                    <span
                      className={`w-1 h-1 rounded-full absolute bottom-1 ${
                        isSelected ? 'bg-white' : 'bg-orange-400'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Stats Summary */}
        <div className="glass-panel p-3 rounded-xl space-y-1 text-xs">
          <div className="text-[11px] text-white/50">Scheduled Tasks</div>
          <div className="flex justify-between items-center text-white font-semibold">
            <span>Total Tasks</span>
            <span className="font-mono text-orange-400">{calendarTasks.length}</span>
          </div>
          <div className="flex justify-between items-center text-white/70 text-[11px]">
            <span>Completed</span>
            <span className="font-mono text-emerald-400">{calendarTasks.filter((t) => t.completed).length}</span>
          </div>
        </div>
      </div>

      {/* Right Content / Tasks Agenda List */}
      <div className="flex-1 flex flex-col p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-base font-bold text-white">Agenda for {selectedDate}</h3>
            <p className="text-xs text-white/50">Manage scheduled system tasks and milestones.</p>
          </div>
        </div>

        {/* Add Task Input Form */}
        <form onSubmit={handleCreateTask} className="glass-panel p-3 rounded-xl mb-4 flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Add new task or reminder..."
              className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-orange-400"
            />
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow"
            >
              <Icon name="Plus" size={14} />
              Add Task
            </button>
          </div>

          <div className="flex items-center gap-4 text-xs text-white/60">
            <div className="flex items-center gap-1.5">
              <span>Category:</span>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as 'system' | 'work' | 'personal')}
                className="bg-black/40 border border-white/10 rounded px-2 py-0.5 text-white text-xs focus:outline-none"
              >
                <option value="system">System</option>
                <option value="work">Work</option>
                <option value="personal">Personal</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span>Priority:</span>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as 'low' | 'medium' | 'high')}
                className="bg-black/40 border border-white/10 rounded px-2 py-0.5 text-white text-xs focus:outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
        </form>

        {/* Tasks List */}
        <div className="flex-1 space-y-2">
          {tasksForSelectedDate.length === 0 ? (
            <div className="h-44 flex flex-col items-center justify-center text-white/40 gap-2">
              <Icon name="ListTodo" size={32} />
              <p className="text-xs">No tasks scheduled for this day.</p>
            </div>
          ) : (
            tasksForSelectedDate.map((task) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className={`glass-panel p-3 rounded-xl flex items-center justify-between group transition ${
                  task.completed ? 'opacity-50' : 'hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleTask(task.id)}
                    className={`h-5 w-5 rounded-md border flex items-center justify-center transition ${
                      task.completed
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-white/30 hover:border-orange-400'
                    }`}
                  >
                    {task.completed && <Icon name="Check" size={13} />}
                  </button>

                  <div>
                    <div className={`text-xs font-medium ${task.completed ? 'line-through text-white/50' : 'text-white'}`}>
                      {task.title}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-white/10 text-white/70">
                        {task.category}
                      </span>
                      <span
                        className={`text-[10px] uppercase font-mono px-1.5 py-0.2 rounded ${
                          task.priority === 'high'
                            ? 'bg-red-500/20 text-red-300'
                            : task.priority === 'medium'
                            ? 'bg-yellow-500/20 text-yellow-300'
                            : 'bg-blue-500/20 text-blue-300'
                        }`}
                      >
                        {task.priority}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => deleteTask(task.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-white/40 hover:text-red-400 hover:bg-white/10 rounded-lg transition"
                >
                  <Icon name="Trash2" size={14} />
                </button>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
