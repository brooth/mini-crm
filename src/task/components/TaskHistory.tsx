import { Icon } from "@blueprintjs/core";

import { Backout } from "app/components";
import { formatDateTime } from "utils";

import { TaskHistoryEntry } from "../task.entity";
import TaskStatusTag from "./TaskStatusTag";
import "./TaskHistory.css";


/** Read-only: history rows are written by the database only (trigger + RPC). */
export default function TaskHistory({ entries }: TaskHistoryProps) {
  if (!entries.length)
    return <Backout compact icon="@history" message="История пуста" />;

  return (
    <ol className="app-taskHistory">
      {[...entries].reverse().map((entry) => (
        <li key={entry.id} className="app-taskHistory-entry">
          <div className="app-taskHistory-meta">
            <span>{formatDateTime(entry.created_at)}</span>
            <span className="app-taskHistory-actor">{entry.actor?.full_name}</span>
          </div>
          <div className="app-taskHistory-statuses">
            {entry.from_status == null ? (
              <span className="app-taskHistory-created">Создана</span>
            ) : (
              <>
                <TaskStatusTag status={entry.from_status} />
                <Icon icon="arrow-right" size={12} />
              </>
            )}
            <TaskStatusTag status={entry.to_status} />
          </div>
          {entry.comment && (
            <blockquote className="app-taskHistory-comment">{entry.comment}</blockquote>
          )}
        </li>
      ))}
    </ol>
  );
}

export type TaskHistoryProps = {
  entries: TaskHistoryEntry[],
}
