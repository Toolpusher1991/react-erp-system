import { useState, useEffect } from "react";
import { useData } from "../contexts/DataContext";
import { useAuth } from "../contexts/AuthContext";
import { getWorkOrderComments, createComment } from "../services/api";
import type { WorkOrderComment } from "../types";

interface CommentSectionProps {
  workOrderId: number;
  workOrder?: { assignedTo?: number; createdBy: number; title?: string };
}

function CommentSection({ workOrderId, workOrder }: CommentSectionProps) {
  const { currentUser } = useAuth();
  const { addNotification, notifications, workOrders } = useData();
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState<WorkOrderComment[]>([]);
  const [loading, setLoading] = useState(true);

  const wo = workOrder || workOrders.find((w) => w.id === workOrderId);

  // Load comments from backend
  useEffect(() => {
    loadComments();
  }, [workOrderId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      console.log(`💬 Loading comments for WO ${workOrderId}...`);

      const result = await getWorkOrderComments(workOrderId);

      if (result.data) {
        const data = result.data as any;
        setComments(data.comments || []);
        console.log(`✅ Comments loaded: ${data.comments?.length || 0}`);
      }
    } catch (error) {
      console.error("❌ Failed to load comments:", error);
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  const woComments = comments.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newComment.trim() || !currentUser) return;

    try {
      console.log("✨ Creating comment for WO:", workOrderId);

      const result = await createComment({
        workOrderId,
        userId: currentUser.id,
        content: newComment.trim(),
        type: "COMMENT",
      });

      if (result.data) {
        console.log("✅ Comment created successfully:", result.data);
        setNewComment("");
        // Reload comments to show the new one
        await loadComments();
      }
    } catch (error: any) {
      console.error("❌ Error creating comment:", error);
      alert(
        "Fehler beim Erstellen des Kommentars: " +
          (error.response?.data?.error || error.message)
      );
      return;
    }

    // Erstelle Notifications für relevante User
    if (wo) {
      const notifyUsers: number[] = [];

      if (wo.assignedTo && wo.assignedTo !== currentUser.id) {
        notifyUsers.push(wo.assignedTo);
      }

      if (
        wo.createdBy !== currentUser.id &&
        !notifyUsers.includes(wo.createdBy)
      ) {
        notifyUsers.push(wo.createdBy);
      }

      notifyUsers.forEach((userId) => {
        const notification = {
          id: Math.max(...notifications.map((n) => n.id), 0) + 1,
          userId,
          type: "comment" as const,
          workOrderId,
          workOrderTitle: wo.title || `Work Order #${workOrderId}`,
          message: `${currentUser.name} hat kommentiert`,
          createdAt: new Date().toISOString(),
          read: false,
          createdBy: currentUser.id,
          createdByName: currentUser.name,
        };
        addNotification(notification);
      });
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

    if (seconds < 60) return "vor wenigen Sekunden";
    if (seconds < 3600) return `vor ${Math.floor(seconds / 60)} Min`;
    if (seconds < 86400) return `vor ${Math.floor(seconds / 3600)} Std`;
    return `vor ${Math.floor(seconds / 86400)} Tagen`;
  };

  const getCommentIcon = (type: WorkOrderComment["type"]) => {
    switch (type) {
      case "comment":
        return "💬";
      case "status_change":
        return "🔄";
      case "assignment":
        return "👤";
      case "priority_change":
        return "⚠️";
      default:
        return "💬";
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "Admin":
        return "#8b5cf6";
      case "E-Supervisor":
      case "M-Supervisor":
        return "#3b82f6";
      case "Elektriker":
        return "#f59e0b";
      case "Mechaniker":
        return "#10b981";
      case "RSC":
        return "#6b7280";
      default:
        return "#9ca3af";
    }
  };

  return (
    <div className="comment-section">
      <h3 className="comment-section-title">
        💬 Kommentare ({woComments.length})
      </h3>

      <div className="comment-list">
        {woComments.length === 0 ? (
          <div className="comment-empty">
            <p>Noch keine Kommentare. Sei der Erste!</p>
          </div>
        ) : (
          woComments.map((comment) => (
            <div
              key={comment.id}
              className={`comment-item ${
                comment.type !== "comment" ? "comment-system" : ""
              }`}
            >
              <div className="comment-header">
                <div className="comment-user">
                  <span className="comment-icon">
                    {getCommentIcon(comment.type)}
                  </span>
                  <span className="comment-user-name">{comment.userName}</span>
                  <span
                    className="comment-user-role"
                    style={{
                      backgroundColor: getRoleBadgeColor(comment.userRole),
                    }}
                  >
                    {comment.userRole}
                  </span>
                </div>
                <span className="comment-time">
                  {getTimeAgo(comment.timestamp)}
                </span>
              </div>

              <div className="comment-body">
                {comment.type === "status_change" && (
                  <div className="comment-change">
                    Status geändert: <strong>{comment.oldValue}</strong> →{" "}
                    <strong className="comment-new-value">
                      {comment.newValue}
                    </strong>
                  </div>
                )}
                {comment.type === "assignment" && (
                  <div className="comment-change">
                    Zugewiesen an: <strong>{comment.newValue}</strong>
                  </div>
                )}
                {comment.type === "priority_change" && (
                  <div className="comment-change">
                    Priorität geändert: <strong>{comment.oldValue}</strong> →{" "}
                    <strong className="comment-new-value">
                      {comment.newValue}
                    </strong>
                  </div>
                )}
                {comment.type === "comment" && (
                  <p className="comment-text">{comment.comment}</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="comment-form">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Schreibe einen Kommentar..."
          className="comment-input"
          rows={3}
        />
        <button
          type="submit"
          className="comment-submit-btn"
          disabled={!newComment.trim()}
        >
          💬 Kommentar senden
        </button>
      </form>
    </div>
  );
}

export default CommentSection;
