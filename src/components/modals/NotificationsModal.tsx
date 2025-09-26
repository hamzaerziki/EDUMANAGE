import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, Check, Trash2, User, Calendar, AlertTriangle } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface NotificationsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NotificationsModal = ({ open, onOpenChange }: NotificationsModalProps) => {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: "student",
      title: t.notif_new_student_registration || "New Student Registration",
      message: "John Doe has submitted registration for Grade 9",
      time: "2 hours ago",
      read: false,
      icon: User
    },
    {
      id: 2,
      type: "course",
      title: t.notif_course_schedule_updated || "Course Schedule Updated",
      message: "Mathematics course has been rescheduled to next Friday",
      time: "4 hours ago",
      read: false,
      icon: Calendar
    },
    {
      id: 3,
      type: "alert",
      title: t.notif_payment_overdue || "Payment Overdue",
      message: "3 students have overdue payment notifications",
      time: "6 hours ago",
      read: true,
      icon: AlertTriangle
    },
    {
      id: 4,
      type: "teacher",
      title: t.notif_teacher_leave_request || "Teacher Leave Request",
      message: "Dr. Sarah Johnson requested sick leave for tomorrow",
      time: "1 day ago",
      read: true,
      icon: User
    }
  ]);

  const markAsRead = (id: number) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const deleteNotification = (id: number) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            {t.notifications}
            {unreadCount > 0 && (
              <Badge variant="destructive" className="h-5 text-xs">
                {unreadCount}
              </Badge>
            )}
          </DialogTitle>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              {t.markAllAsRead || 'Mark all as read'}
            </Button>
          )}
        </DialogHeader>

        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{t.noNotifications || 'No notifications'}</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${
                    notification.read ? 'bg-muted/30' : 'bg-primary/5 border-primary/20'
                  }`}
                >
                  <div className={`p-2 rounded-full ${
                    notification.read ? 'bg-muted' : 'bg-primary/10'
                  }`}>
                    <notification.icon className={`h-4 w-4 ${
                      notification.read ? 'text-muted-foreground' : 'text-primary'
                    }`} />
                  </div>
                  
                  <div className="flex-1 space-y-1">
                    <div className="flex items-start justify-between">
                      <h4 className="text-sm font-medium">{notification.title}</h4>
                      <div className="flex items-center gap-1">
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                            className="h-6 w-6 p-0"
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteNotification(notification.id)}
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{notification.message}</p>
                    <p className="text-xs text-muted-foreground">{notification.time}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default NotificationsModal;