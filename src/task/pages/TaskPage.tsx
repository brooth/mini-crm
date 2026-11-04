import { useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

import {
  Alert, BackActivityIndicator, BackoutApiError, Button, Card, CardContent, CardHeader,
  CardItem, Column, Grid, PageContent, PageHeader, PageNotFound, Toast
} from "app/components";
import { useIsManager, useProfile } from "auth/auth.hooks";
import { ApiCallStateBuilder, formatDateTime, useApiErrors } from "utils";

import TaskActions from "../components/TaskActions";
import TaskDialog from "../components/TaskDialog";
import TaskHistory from "../components/TaskHistory";
import TaskStatusTag from "../components/TaskStatusTag";
import { availableActions } from "../task.actions";
import { Task, TaskHistoryEntry } from "../task.entity";
import { useDeleteTask, useLoadTask, useLoadTaskHistory } from "../task.hooks";
import "./TaskPage.css";


export default function TaskPage() {
  const { id } = useParams() as { id: string };
  const navigate = useNavigate();
  const { state: locationState } = useLocation();
  const isManager = useIsManager();

  const { loadTaskState, loadTask } = useLoadTask(id);
  const task = loadTaskState.value;
  const { loadTaskHistoryState, loadTaskHistory } = useLoadTaskHistory(id, { auto: task != null });
  const { deleteTaskState, deleteTask } = useDeleteTask();
  useApiErrors(deleteTaskState);

  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const backPath = locationState?.backpath
    ?? (task && isManager ? `/objects/${task.object_id}` : isManager ? '/objects' : '/my-tasks');

  const onDelete = async () => {
    if (await deleteTask(id, task!.object_id)) {
      Toast.showSuccess({ message: `Задача «${task!.title}» удалена` });
      navigate(`/objects/${task!.object_id}`, { replace: true });
    }
  };

  return (
    <>
      <PageHeader
        icon="@task"
        title={task?.title ?? 'Задача'}
        tag={task ? <TaskStatusTag large status={task.status} /> : undefined}
        backButtonPath={backPath}>
        {isManager && task && (
          <>
            <Button icon="edit" variant="minimal" text="Изменить" onClick={() => setEditing(true)} />
            <Button icon="trash" variant="minimal" intent="danger" onClick={() => setDeleting(true)} />
          </>
        )}
      </PageHeader>
      <PageContent>
        <ApiCallStateBuilder<Task | null>
          state={loadTaskState}
          onLoading={(value) => value ? renderTask(value) : <BackActivityIndicator />}
          onError={(error) => <BackoutApiError error={error} onTryAgain={loadTask} />}
          // missing and foreign tasks look the same
          onValueNull={() => <PageNotFound />}
          onValue={(value) => renderTask(value!)}
        />
      </PageContent>
      <TaskDialog
        isOpen={editing}
        task={task}
        onClose={() => setEditing(false)}
      />
      <Alert
        isOpen={deleting}
        intent="danger"
        icon="trash"
        confirmButtonText="Удалить"
        cancelButtonText="Отмена"
        loading={deleteTaskState.isLoading}
        onConfirm={onDelete}
        onCancel={() => setDeleting(false)}>
        <p>Удалить задачу «{task?.title}» вместе с историей статусов?</p>
      </Alert>
    </>
  );

  function renderTask(task: Task) {
    return (
      <Grid md={2} xs={1} gap={20}>
        <Column gap={20}>
          <Card>
            <CardHeader title="Задача" />
            <CardContent>
              <CardItem
                icon="office"
                text="Объект"
                tail={<Link to={`/objects/${task.object_id}`}>{task.object.name}</Link>}
              />
              <CardItem icon="map-marker" text="Адрес" tail={task.object.address || '—'} />
              <CardItem icon="person" text="Исполнитель" tail={task.assignee.full_name} />
              <CardItem icon="edit" text="Постановщик" tail={task.author.full_name} />
              <CardItem icon="calendar" text="Создана" tail={formatDateTime(task.created_at)} />
              <div className="app-taskPage-description">
                {task.description || <span className="app-taskPage-noDescription">Без описания</span>}
              </div>
            </CardContent>
          </Card>
          <TaskActionsCard task={task} />
        </Column>
        <Column gap={20}>
          <Card>
            <CardHeader title="История" />
            <CardContent>
              <ApiCallStateBuilder<TaskHistoryEntry[]>
                state={loadTaskHistoryState}
                onLoading={(value) => value ? <TaskHistory entries={value} /> : <BackActivityIndicator compact />}
                onError={(error) => <BackoutApiError compact error={error} onTryAgain={loadTaskHistory} />}
                onValue={(value) => <TaskHistory entries={value} />}
              />
            </CardContent>
          </Card>
        </Column>
      </Grid>
    );
  }
}

function TaskActionsCard({ task }: { task: Task }) {
  const profile = useProfile();
  const hasActions = availableActions(task, profile).length > 0;
  const hint = task.status === 'accepted'
    ? 'Задача принята — статус окончательный.'
    : task.status === 'review'
      ? 'Ожидает проверки постановщиком.'
      : 'Ожидает действий исполнителя.';
  return (
    <Card>
      <CardHeader title="Действия" />
      <CardContent>
        {hasActions ? <TaskActions task={task} /> : <p className="app-taskPage-hint">{hint}</p>}
      </CardContent>
    </Card>
  );
}
