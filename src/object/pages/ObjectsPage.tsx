import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  Alert, Backout, BackoutApiError, Button, GridContentLoader, HtmlTable, MenuItem,
  PageContent, PageHeader, PopupMenuButton, Toast
} from "app/components";
import { useIsManager } from "auth/auth.hooks";
import { ApiCallStateBuilder, useApiErrors, useLocalSearch } from "utils";

import ObjectDialog from "../components/ObjectDialog";
import { CrmObject, ObjectListItem } from "../object.entity";
import { useDeleteObject, useLoadObjects } from "../object.hooks";
import "./ObjectsPage.css";


export default function ObjectsPage() {
  const navigate = useNavigate();
  const isManager = useIsManager();
  const { loadObjectsState, loadObjects } = useLoadObjects();
  const { deleteObjectState, deleteObject } = useDeleteObject();
  useApiErrors(deleteObjectState);

  const [query, setQuery] = useState('');
  const { filtered } = useLocalSearch(loadObjectsState.value, query, setQuery);

  // undefined = closed, null = create, object = edit
  const [editing, setEditing] = useState<CrmObject | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<ObjectListItem | null>(null);

  const onDelete = async () => {
    if (await deleteObject(deleting!.id)) {
      Toast.showSuccess({ message: `Объект «${deleting!.name}» удалён` });
      setDeleting(null);
    }
  };

  return (
    <>
      <PageHeader
        icon="@object"
        title="Объекты"
        onSearchQueryChange={setQuery}
        searchPlaceholder="Поиск по названию или адресу">
        <Button icon="refresh" variant="minimal" onClick={loadObjects} />
        <Button
          icon="plus"
          intent="primary"
          text="Создать"
          hidden={!isManager}
          animateVisibility={false}
          onClick={() => setEditing(null)}
        />
      </PageHeader>
      <PageContent>
        <ApiCallStateBuilder<ObjectListItem[]>
          state={loadObjectsState}
          onLoading={(value) => value ? renderTable() : <GridContentLoader md={2} xs={1} gap={20} />}
          onError={(error) => <BackoutApiError error={error} onTryAgain={loadObjects} />}
          onValue={renderTable}
        />
      </PageContent>
      <ObjectDialog
        isOpen={editing !== undefined}
        object={editing}
        onClose={() => setEditing(undefined)}
        onSaved={(id) => editing === null && navigate(id)}
      />
      <Alert
        isOpen={deleting != null}
        intent="danger"
        icon="trash"
        confirmButtonText="Удалить"
        cancelButtonText="Отмена"
        loading={deleteObjectState.isLoading}
        onConfirm={onDelete}
        onCancel={() => setDeleting(null)}>
        <p>Удалить объект «{deleting?.name}»?</p>
        <p>Вместе с ним будут удалены все его задачи ({deleting?.tasks[0]?.count ?? 0}) и их история.</p>
      </Alert>
    </>
  );

  function renderTable() {
    if (!filtered?.length)
      return (
        <Backout
          className="app-objectsPage-empty"
          icon="@object"
          title={query ? 'Ничего не найдено' : 'Объектов пока нет'}
        />
      );
    return (
      <div className="app-objectsPage-tableWrapper">
        <HtmlTable className="app-objectsPage-table" interactive striped>
          <thead>
            <tr>
              <th>Название</th>
              <th>Адрес</th>
              <th className="app-objectsPage-count">Задач</th>
              {isManager && <th />}
            </tr>
          </thead>
          <tbody>
            {filtered.map((object) => (
              <tr key={object.id} onClick={() => navigate(object.id)}>
                <td><Link to={object.id} onClick={(e) => e.stopPropagation()}>{object.name}</Link></td>
                <td>{object.address}</td>
                <td className="app-objectsPage-count">{object.tasks[0]?.count ?? 0}</td>
                {isManager && (
                  <td className="app-objectsPage-actions" onClick={(e) => e.stopPropagation()}>
                    <PopupMenuButton small icon="more" endIcon={undefined}>
                      <MenuItem icon="edit" text="Изменить" onClick={() => setEditing(object)} />
                      <MenuItem icon="trash" text="Удалить" intent="danger" onClick={() => setDeleting(object)} />
                    </PopupMenuButton>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </HtmlTable>
      </div>
    );
  }
}
