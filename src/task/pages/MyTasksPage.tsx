import { SegmentedControl } from "@blueprintjs/core";
import _ from "lodash";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  Backout, BackoutApiError, Button, Card, CardContent, CardHeader, Column,
  GridContentLoader, HtmlTable, PageContent, PageHeader
} from "app/components";
import { useProfile } from "auth/auth.hooks";
import { ApiCallStateBuilder, formatDate } from "utils";

import TaskStatusTag from "../components/TaskStatusTag";
import { MyTask, TaskStatus } from "../task.entity";
import { useLoadMyTasks } from "../task.hooks";
import { TASK_STATUSES, TASK_STATUS_ORDER } from "../task.status";
import "./MyTasksPage.css";


type Filter = TaskStatus | 'all';

export default function MyTasksPage() {
  const navigate = useNavigate();
  const profile = useProfile();
  const isManager = profile.role === 'manager';
  const { loadMyTasksState, loadMyTasks } = useLoadMyTasks(profile);
  const [filter, setFilter] = useState<Filter>('all');

  const byStatus = useMemo(() =>
    _.groupBy(loadMyTasksState.value ?? [], (t) => t.status) as Partial<Record<TaskStatus, MyTask[]>>,
    [loadMyTasksState.value]);

  const statuses = filter === 'all'
    ? TASK_STATUS_ORDER.filter((s) => byStatus[s]?.length)
    : [filter];

  return (
    <>
      <PageHeader icon={isManager ? 'clipboard' : '@myTasks'} title="Мои задачи">
        <Button icon="refresh" variant="minimal" onClick={loadMyTasks} />
      </PageHeader>
      <PageContent>
        <ApiCallStateBuilder<MyTask[]>
          state={loadMyTasksState}
          onLoading={(value) => value ? renderTasks() : <GridContentLoader md={2} xs={1} gap={20} />}
          onError={(error) => <BackoutApiError error={error} onTryAgain={loadMyTasks} />}
          onValueEmpty={() => <Backout className="app-myTasksPage-empty" icon="@task" title="Задач пока нет"
            message={isManager ? 'Здесь будут задачи, которые вы поставили исполнителям' : undefined} />}
          onValue={renderTasks}
        />
      </PageContent>
    </>
  );

  function renderTasks() {
    return (
      <Column gap={20}>
        <div className="app-myTasksPage-filter">
          <SegmentedControl
            small
            value={filter}
            onValueChange={(value) => setFilter(value as Filter)}
            options={[
              { value: 'all', label: `Все (${loadMyTasksState.value?.length ?? 0})` },
              ...TASK_STATUS_ORDER.map((s) => ({
                value: s,
                label: `${TASK_STATUSES[s].label} (${byStatus[s]?.length ?? 0})`,
              })),
            ]}
          />
        </div>
        {statuses.map((status) => (
          <Card key={status}>
            <CardHeader className="app-myTasksPage-statusHeader" left={<TaskStatusTag status={status} />} />
            <CardContent flush={!!byStatus[status]?.length}>
              {!byStatus[status]?.length ? (
                <Backout compact icon="@task" message="Нет задач в этом статусе" />
              ) : (
                <div className="app-myTasksPage-tableWrapper">
                  <HtmlTable className="app-myTasksPage-table" interactive>
                    <tbody>
                      {byStatus[status]!.map((task) => (
                        <tr key={task.id} onClick={() => navigate(`/tasks/${task.id}`, { state: { backpath: '/my-tasks' } })}>
                          <td>
                            <Link
                              to={`/tasks/${task.id}`}
                              state={{ backpath: '/my-tasks' }}
                              onClick={(e) => e.stopPropagation()}>
                              {task.title}
                            </Link>
                          </td>
                          <td className="app-myTasksPage-object">{task.object.name}</td>
                          {isManager && <td className="app-myTasksPage-assignee">{task.assignee.full_name}</td>}
                          <td className="app-myTasksPage-date">{formatDate(task.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </HtmlTable>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </Column>
    );
  }
}
