import { useState, useRef, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useData } from "../contexts/DataContext";

interface NotificationBellProps {
  onOpenWorkOrder?: (workOrderId: number) => void;
}

function NotificationBell({ onOpenWorkOrder }: NotificationBellProps) {
  const { currentUser } = useAuth();
  const {
    notifications,
    getNotificationsForUser,
    getUnreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  } = useData();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {}, [currentUser, notifications]);

  if (!currentUser) return null;

  const userNotifications = getNotificationsForUser(currentUser.id);
  const unreadCount = getUnreadCount(currentUser.id);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = (
    notificationId: number,
    workOrderId: number
  ) => {
    console.log("🔔 Notification clicked:", notificationId);
    markNotificationAsRead(notificationId);
    setIsOpen(false);
    if (onOpenWorkOrder) {
      onOpenWorkOrder(workOrderId);
    }
  };

  const handleMarkAllRead = () => {
    console.log("🔔 Marking all as read");
    markAllNotificationsAsRead(currentUser.id);
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

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "comment":
        return "💬";
      case "assignment":
        return "👤";
      case "status_change":
        return "🔄";
      default:
        return "📬";
    }
  };

  return (
    <div className="notification-bell-container" ref={dropdownRef}>
      <button
        className="notification-bell-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Benachrichtigungen"
      >
        🔔
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-dropdown-header">
            <h3>📬 Benachrichtigungen</h3>
            {unreadCount > 0 && (
              <button
                className="notification-mark-all-read"
                onClick={handleMarkAllRead}
              >
                Alle gelesen
              </button>
            )}
          </div>

          <div className="notification-list">
            {userNotifications.length === 0 ? (
              <div className="notification-empty">
                <p>Keine Benachrichtigungen</p>
              </div>
            ) : (
              userNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item ${
                    !notification.read ? "notification-unread" : ""
                  }`}
                  onClick={() =>
                    handleNotificationClick(
                      notification.id,
                      notification.workOrderId
                    )
                  }
                >
                  <div className="notification-icon">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="notification-content">
                    <div className="notification-title">
                      {notification.workOrderTitle}
                    </div>
                    <div className="notification-message">
                      {notification.message}
                    </div>
                    <div className="notification-time">
                      {getTimeAgo(notification.createdAt)}
                    </div>
                  </div>
                  {!notification.read && (
                    <div className="notification-unread-dot"></div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
