export type Comparator<T> = (a: T, b: T) => number;
export type EquaLator<T> = (a: T, b: T) => boolean;
export type IdEquaLator<T> = (a: T, b: T) => boolean;

export interface ListOperation<T> {
  apply(origin?: T[] | null): T[];
}

export class CreateListOperation<T> implements ListOperation<T> {
  constructor(
    private list: T[],
    private sort?: Comparator<T>) { }

  apply(origin?: T[] | undefined): T[] {
    if (this.sort != null) this.list.sort(this.sort);
    return this.list;
  }
}

export class ExtendListOperation<T> implements ListOperation<T> {
  constructor(
    private list: T[],
    private sort?: Comparator<T>) { }

  apply(origin?: T[] | undefined): T[] {
    const res = origin?.slice() || [];
    res.push(...this.list);
    if (this.sort != null) res.sort(this.sort);
    return res;
  }
}

export class MergeListOperation<T> implements ListOperation<T> {
  constructor(
    private updates: T[],
    private test: EquaLator<T>,
    private sort?: Comparator<T>) { }

  apply(origin?: T[] | undefined): T[] {
    const list = this.updates.slice();
    if (origin != null) {
      list.push(...origin.filter((existing) =>
        list.findIndex((value) => this.test(value, existing)) == -1));
    }
    if (this.sort != null) list.sort(this.sort);
    return list;
  }
}

export class ReduceListOperation<T> implements ListOperation<T> {
  constructor(
    private deleteItems: T[],
    private test: EquaLator<T>) { }

  apply(origin?: T[] | undefined): T[] {
    if (origin == null) return [];
    return origin.filter((item) =>
      this.deleteItems.findIndex((toDel) => this.test(item, toDel)) >= 0)
  }
}

export class ClearListOperation<T> implements ListOperation<T> {
  apply(): T[] {
    return [];
  }
}

export class DoNothingListOperation<T> implements ListOperation<T> {
  apply(origin: []): T[] {
    return origin;
  }
}

export class AddListItemOperation<T> implements ListOperation<T> {
  constructor(
    private item: T,
    private sort?: Comparator<T>) { }

  apply(origin?: T[] | undefined): T[] {
    if (origin == null) return [this.item];
    const list = origin.slice();
    list.push(this.item);
    if (this.sort != null) list.sort(this.sort);
    return list;
  }
}

export class UpdateListItemOperation<T> implements ListOperation<T> {
  constructor(
    private item: T,
    private test: EquaLator<T>,
    private sort?: Comparator<T>) { }

  apply(origin?: T[] | undefined): T[] {
    if (origin == null) return [];
    const list = origin
      .map((item) => this.test(item, this.item) ? this.item : item);
    if (this.sort != null) list.sort(this.sort);
    return list;
  }
}

export class UpsertListItemOperation<T> implements ListOperation<T> {
  constructor(
    private item: T,
    private test: EquaLator<T>,
    private sort?: Comparator<T>) { }

  apply(origin?: T[] | undefined): T[] {
    if (origin == null) return [];
    const list = origin.slice();
    const idx = origin.findIndex((item) => this.test(item, this.item));
    if (idx == -1) {
      list.push(this.item);
    } else {
      list[idx] = this.item;
    }
    if (this.sort != null) list.sort(this.sort);
    return list;
  }
}

export class DeleteListItemOperation<T> implements ListOperation<T> {
  constructor(
    private item: T,
    private test: EquaLator<T>,
    private sort?: Comparator<T>) { }

  apply(origin?: T[] | undefined): T[] {
    if (origin == null) return [];
    const list = origin.filter((item) => this.test(item, this.item) != true);
    if (this.sort != null) list.sort(this.sort);
    return list;
  }
}

export class InsertListItemOperation<T> implements ListOperation<T> {
  constructor(
    private item: T,
    private index: number,
    private sort?: Comparator<T>) { }

  apply(origin?: T[] | undefined): T[] {
    if (origin == null) return [];
    const list = origin.slice();
    list[this.index] = this.item;
    if (this.sort != null) list.sort(this.sort);
    return list;
  }
}
