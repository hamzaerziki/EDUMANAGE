import React from "react";
import WeeklySchedule from "./WeeklySchedule";

class ScheduleErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; message?: string }>{
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, message: String(error?.message || error) };
  }
  componentDidCatch(error: any, info: any) {
    // eslint-disable-next-line no-console
    console.error("Schedule crashed:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6">
          <div className="max-w-xl mx-auto border rounded-md p-4 bg-amber-50 border-amber-200">
            <h2 className="font-semibold mb-2">Schedule encountered a problem</h2>
            <p className="text-sm text-muted-foreground mb-3">{this.state.message || "Unknown error"}</p>
            <div className="flex gap-2">
              <button
                className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground"
                onClick={() => {
                  try {
                    localStorage.removeItem('schedule-sessions');
                  } catch {}
                  location.reload();
                }}
              >
                Reset schedule data
              </button>
              <button
                className="px-3 py-1.5 rounded-md border"
                onClick={() => location.reload()}
              >
                Reload
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children as any;
  }
}

const CourseSchedule = () => (
  <ScheduleErrorBoundary>
    <WeeklySchedule />
  </ScheduleErrorBoundary>
);

export default CourseSchedule;