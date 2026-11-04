import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
  Alert, BackActivityIndicator, Backout, BackoutApiError, Button, Card, CardContent,
  CardHeader, CardItem, Column, HtmlTable, PageContent, PageHeader, PageNotFound, Toast
} from "app/components";
import { useIsManager } from "auth/auth.hooks";
import TaskDialog from "task/components/TaskDialog";
import TaskStatusTag from "task/components/TaskStatusTag";
import { ApiCallStateBuilder, formatDate, useApiErrors } from "utils";

import ObjectDialog from "../components/ObjectDialog";
import { CrmObject, ObjectTask } from "../object.entity";
import { useDeleteObject, useLoadObject, useLoadObjectTasks } from "../object.hooks";
import "./ObjectPage.css";


export default function ObjectPage() {
  const { id } = useParams() as { id: string };
  const navigate = useNavigate();
  const isManager = useIsManager();

  const { loadObjectState, loadObject } = useLoadObject(id);
  const object = loadObjectState.value;
  const { loadObjectTasksState, loadObjectTasks } = useLoadObjectTasks(id, { auto: object != null });
  const { deleteObjectState, deleteObject } = useDeleteObject();
  useApiErrors(deleteObjectState);

  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [creatingTask, setCreatingTask] = useState(false);

  const onDelete = async () => {
    if (await deleteObject(id)) {
      Toast.showSuccess({ message: `Объект «${object!.name}» удалён` });
      navigate('/objects', { replace: true });
    }
  };

  return (
    <>
      <PageHeader
        icon="@object"
        title={object?.name ?? 'Объект'}
        backButtonPath="/objects">
        {isManager && object && (
          <>
            <Button icon="edit" variant="minimal" onClick={() => setEditing(true)} />
            <Button icon="trash" variant="minimal" intent="danger" onClick={() => setDeleting(true)} />
            <Button icon="plus" intent="primary" text="Новая задача" onClick={() => setCreatingTask(true)} />
          </>
        )}
      </PageHeader>
      <PageContent>
        <ApiCallStateBuilder<CrmObject | null>
          state={loadObjectState}
          onLoading={(value) => value ? renderObject(value) : <BackActivityIndicator />}
          onError={(error) => <BackoutApiError error={error} onTryAgain={loadObject} />}
          onValueNull={() => <PageNotFound />}
          onValue={(value) => renderObject(value!)}
        />
      </PageContent>
      <ObjectDialog
        isOpen={editing}
        object={object}
        onClose={() => setEditing(false)}
      />
      <TaskDialog
        isOpen={creatingTask}
        defaultObjectId={id}
        onClose={() => setCreatingTask(false)}
      />
      <Alert
        isOpen={deleting}
        intent="danger"
        icon="trash"
        confirmButtonText="Удалить"
        cancelButtonText="Отмена"
        loading={deleteObjectState.isLoading}
        onConfirm={onDelete}
        onCancel={() => setDeleting(false)}>
        <p>Удалить объект «{object?.name}»?</p>
        <p>Вместе с ним будут удалены все его задачи ({loadObjectTasksState.value?.length ?? 0}) и их история.</p>
      </Alert>
    </>
  );

  function renderObject(object: CrmObject) {
    return (
      <Column gap={20}>
        <Card>
          <CardContent>
            <CardItem icon="map-marker" head="Адрес" text={object.address || '—'} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader title="Задачи" />
          <CardContent>
            <ApiCallStateBuilder<ObjectTask[]>
              state={loadObjectTasksState}
              onLoading={(value) => value ? renderTasks(value) : <BackActivityIndicator compact />}
              onError={(error) => <BackoutApiError compact error={error} onTryAgain={loadObjectTasks} />}
              onValue={renderTasks}
            />
          </CardContent>
        </Card>
      </Column>
    );
  }

  function renderTasks(tasks: ObjectTask[]) {
    if (!tasks.length)
      return <Backout compact icon="@task" message="Задач пока нет" />;
    return (
      <div className="app-objectPage-tableWrapper">
        <HtmlTable className="app-objectPage-table" interactive striped>
          <thead>
            <tr>
              <th>Название</th>
              <th>Исполнитель</th>
              <th>Статус</th>
              <th>Создана</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.id} onClick={() => navigate(`/tasks/${task.id}`, { state: { backpath: `/objects/${id}` } })}>
                <td>
                  <Link
                    to={`/tasks/${task.id}`}
                    state={{ backpath: `/objects/${id}` }}
                    onClick={(e) => e.stopPropagation()}>
                    {task.title}
                  </Link>
                </td>
                <td>{task.assignee?.full_name}</td>
                <td><TaskStatusTag status={task.status} /></td>
                <td>{formatDate(task.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </HtmlTable>
      </div>
    );
  }
}
