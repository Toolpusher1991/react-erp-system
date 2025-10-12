import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import type { WorkOrderTask } from "../types";

interface TaskListProps {
  tasks: WorkOrderTask[];
  onUpdateTasks: (tasks: WorkOrderTask[]) => void;
  readOnly?: boolean;
}

function TaskList({ tasks, onUpdateTasks, readOnly = false }: TaskListProps) {
  const { currentUser } = useAuth();
  const [newTaskDescription, setNewTaskDescription] = useState("");

  // Berechne Fortschritt
  const completedTasks = tasks.filter((t) => t.completed).length;
  const totalTasks = tasks.length;
  const progressPercentage =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Task abhaken/abhaken rückgängig
  const handleToggleTask = (taskId: number) => {
    if (readOnly) return;

    const updatedTasks = tasks.map((task) => {
      if (task.id === taskId) {
        return {
          ...task,
          completed: !task.completed,
          completedBy: !task.completed ? currentUser?.id : undefined,
          completedByName: !task.completed ? currentUser?.name : undefined,
          completedAt: !task.completed ? new Date().toISOString() : undefined,
        };
      }
      return task;
    });

    onUpdateTasks(updatedTasks);
  };

  // Neuen Task hinzufügen
  const handleAddTask = () => {
    if (!newTaskDescription.trim()) return;

    const newTask: WorkOrderTask = {
      id: Math.max(...tasks.map((t) => t.id), 0) + 1,
      description: newTaskDescription.trim(),
      completed: false,
      required: true,
    };

    onUpdateTasks([...tasks, newTask]);
    setNewTaskDescription("");
  };

  // Task löschen
  const handleDeleteTask = (taskId: number) => {
    if (readOnly) return;
    onUpdateTasks(tasks.filter((t) => t.id !== taskId));
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

    if (seconds < 60) return "gerade eben";
    if (seconds < 3600) return `vor ${Math.floor(seconds / 60)} Min`;
    if (seconds < 86400) return `vor ${Math.floor(seconds / 3600)} Std`;
    return `vor ${Math.floor(seconds / 86400)} Tagen`;
  };

  return (
    <div className="task-list-container">
      <div className="task-list-header">
        <h3 className="task-list-title">
          ✅ Aufgaben ({completedTasks}/{totalTasks})
        </h3>
        {totalTasks > 0 && (
          <div className="task-progress-container">
            <div className="task-progress-bar">
              <div
                className="task-progress-fill"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <span className="task-progress-text">{progressPercentage}%</span>
          </div>
        )}
      </div>

      {/* Task Liste */}
      <div className="task-list">
        {tasks.length === 0 ? (
          <div className="task-empty">
            <p>Keine Aufgaben definiert.</p>
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className={`task-item ${task.completed ? "task-completed" : ""}`}
            >
              <div className="task-checkbox-container">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => handleToggleTask(task.id)}
                  disabled={readOnly}
                  className="task-checkbox"
                />
              </div>

              <div className="task-content">
                <div className="task-description">{task.description}</div>
                {task.completed && task.completedByName && (
                  <div className="task-metadata">
                    ✅ Erledigt von <strong>{task.completedByName}</strong>{" "}
                    {task.completedAt && getTimeAgo(task.completedAt)}
                  </div>
                )}
              </div>

              {!readOnly && !task.completed && (
                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="task-delete-btn"
                  title="Task löschen"
                >
                  🗑️
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Neuen Task hinzufügen */}
      {!readOnly && (
        <div className="task-add-form">
          <input
            type="text"
            value={newTaskDescription}
            onChange={(e) => setNewTaskDescription(e.target.value)}
            placeholder="Neue Aufgabe hinzufügen..."
            className="task-add-input"
            onKeyPress={(e) => {
              if (e.key === "Enter") handleAddTask();
            }}
          />
          <button
            onClick={handleAddTask}
            className="task-add-btn"
            disabled={!newTaskDescription.trim()}
          >
            ➕ Hinzufügen
          </button>
        </div>
      )}

      {/* Warnung wenn nicht alle Tasks erledigt */}
      {totalTasks > 0 && completedTasks < totalTasks && !readOnly && (
        <div className="task-warning">
          ⚠️ {totalTasks - completedTasks} Aufgabe(n) noch nicht erledigt
        </div>
      )}

      {/* Success wenn alle erledigt */}
      {totalTasks > 0 && completedTasks === totalTasks && (
        <div className="task-success">
          ✅ Alle Aufgaben erledigt! Work Order kann abgeschlossen werden.
        </div>
      )}
    </div>
  );
}

export default TaskList;
