// ==========================================
// COMMENT SECTION COMPONENT
// ==========================================
// Zeigt alle Kommentare zu einem Work Order + Input für neue Kommentare

import { useState } from "react";
import { useData } from "../contexts/DataContext";
import { useAuth } from "../contexts/AuthContext";
import type { WorkOrderComment } from "../types";

interface CommentSectionProps {
  workOrderId: number;
}

function CommentSection({ workOrderId }: CommentSectionProps) {
  const { currentUser } = useAuth();
  const { comments, addComment } = useData();
  const [newComment, setNewComment] = useState("");

  // Hole alle Kommentare für diesen Work Order
  const woComments = comments
    .filter((c) => c.workOrderId === workOrderId)
    .sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

  // Kommentar absenden
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newComment.trim() || !currentUser) return;

    const comment: WorkOrderComment = {
      id: Math.max(...comments.map((c) => c.id), 0) + 1,
      workOrderId,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      comment: newComment.trim(),
      timestamp: new Date().toISOString(),
      type: "comment",
    };

    addComment(comment);
    setNewComment("");
  };

  // Zeitformat: "vor 5 Minuten"
  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

    if (seconds < 60) return "vor wenigen Sekunden";
    if (seconds < 3600) return `vor ${Math.floor(seconds / 60)} Min`;
    if (seconds < 86400) return `vor ${Math.floor(seconds / 3600)} Std`;
    return `vor ${Math.floor(seconds / 86400)} Tagen`;
  };

  // Icon für Comment-Type
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

  // Farbe für User-Role
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

      {/* Kommentar-Liste */}
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

      {/* Kommentar Input */}
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
