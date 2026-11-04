import _ from 'lodash';

export function deepDiffs<T extends {}>(obj1: T, obj2: T) {
  return _.reduce(obj1 as Record<string, any>, function (result: Record<string, any>, value: any, key: string) {
    if (_.isPlainObject(value)) {
      const diffs = deepDiffs(value, _.get(obj2 as any, key, {}));
      if (!_.isEmpty(diffs)) result[key] = diffs;
    } else if (!_.isEqual(value, _.get(obj2 as any, key, {}))) {
      result[key] = value;
    }
    return result;
  }, _.reduce(obj2 as Record<string, any>, function (result: Record<string, any>, value: any, key: string) {
    if (_.get(obj1 as any, key) == null && _.get(obj2 as any, key) != null)
      result[key] = null;
    return result;
  }, {} as Record<string, any>));
}

export function diffs<T extends {}>(obj1: T, obj2: T) {
  return _.reduce(obj1 as Record<string, any>, function (result: Record<string, any>, value: any, key: string) {
    if (!_.isEqual(value, _.get(obj2 as any, key, {}))) {
      result[key] = value;
    }
    return result;
  }, _.reduce(obj2 as Record<string, any>, function (result: Record<string, any>, value: any, key: string) {
    if (_.get(obj1 as any, key) == null && _.get(obj2 as any, key) != null)
      result[key] = null;
    return result;
  }, {} as Record<string, any>));
}

export function cloneEntityDeep(obj: object) {
  const transform = (o: object) =>
    _.transform(o as Record<string, any>, function (result: any, value: any, key: string) {
      if (_.isArray(value)) {
        result[key] = _.map(value, cloneEntityDeep)
      } else if (_.isPlainObject(value)) {
        result[key] = transform(value);
      } else if (!["id", "createdBy", "updatedBy", "deletedBy", "createdAt", "updatedAt", "deletedAt"].includes(key)) {
        result[key] = value;
      }
    });
  return transform(_.cloneDeep(obj));
}
