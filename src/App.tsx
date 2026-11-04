import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { PageNotFound } from 'app/components'
import WorkspaceLayout from 'app/layouts/Workspace'
import { homePath, useProfile } from 'auth/auth.hooks'
import AuthGuard from 'auth/guards/AuthGuard'
import LoginPage from 'auth/pages/LoginPage'
import ObjectPage from 'object/pages/ObjectPage'
import ObjectsPage from 'object/pages/ObjectsPage'
import MyTasksPage from 'task/pages/MyTasksPage'
import TaskPage from 'task/pages/TaskPage'

function HomeRedirect() {
  const profile = useProfile();
  return <Navigate to={homePath(profile.role)} replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<AuthGuard />}>
          <Route element={<WorkspaceLayout />}>
            <Route index element={<HomeRedirect />} />
            <Route path="objects" element={<ObjectsPage />} />
            <Route path="objects/:id" element={<ObjectPage />} />
            <Route path="tasks/:id" element={<TaskPage />} />
            <Route path="my-tasks" element={<MyTasksPage />} />
            <Route path="*" element={<PageNotFound />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
