import { Tag } from "app/components";
import type { TagProps } from "app/components/base/Tag";

import { TaskStatus } from "../task.entity";
import { TASK_STATUSES } from "../task.status";


export default function TaskStatusTag({ status, ...rest }: TaskStatusTagProps) {
  const { label, intent } = TASK_STATUSES[status];
  return <Tag intent={intent} minimal={status === 'new'} {...rest}>{label}</Tag>;
}

export type TaskStatusTagProps = Omit<TagProps, "children" | "intent"> & {
  status: TaskStatus,
}
