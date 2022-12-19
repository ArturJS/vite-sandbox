import { computed, makeObservable, observable, action } from 'mobx';
import type { FieldValue, TValues, TFieldBase, Externals } from './types';
import { FieldStore } from './FieldStore';

type TFieldParam<TValue = FieldValue> = Omit<
  TFieldBase<TValue>,
  'isDirty' | 'onChange' | 'onBlur'
>;

export type TFieldParams<TValue = FieldValue> = {
  [key in string]: TFieldParam<TValue> | TFieldParams<TValue>;
};

function checkIsNestedField(
  field: TFieldParam | TFieldParams
): field is TFieldParams {
  return !('value' in field);
}

export class FormStore {
  constructor(
    fields: TFieldParams,
    options?: {
      externals?: Externals;
    }
  ) {
    this.externals = options?.externals ?? {};
    this.initFields(fields);
    makeObservable(this);
  }

  @observable public isSubmitted = false;

  @observable public externals: Externals = {};

  @observable private _fields: Record<string, FieldStore<unknown>> = {};

  @action public setSubmitted(isSubmitted = true) {
    this.isSubmitted = isSubmitted;
  }

  public getField = (name: string) => {
    return this._fields[name];
  };

  public getValues = () => {
    const fieldNames = Object.keys(this._fields);
    const result: TValues = {};

    for (let name of fieldNames) {
      const field = this.getField(name);
      result[name] = field.value;
    }

    return result;
  };

  @computed public get isDirty(): boolean {
    return Object.values(this._fields).some(({ isDirty }) => isDirty);
  }

  @computed public get isInvalid(): boolean {
    return Object.values(this._fields).some(({ error }) => error);
  }

  public validate = (force: boolean = false): void => {
    const fieldNames = Object.keys(this._fields);
    for (let name of fieldNames) {
      this._fields[name].validate(force);
    }
  };

  private initFields(fields: TFieldParams, parentName = ''): void {
    for (let [name, field] of Object.entries(fields)) {
      const fieldName = parentName ? `${parentName}.${name}` : name;

      if (checkIsNestedField(field)) {
        this.initFields(field, fieldName);
        return;
      }

      const { value, validators } = field;
      this._fields[fieldName] = new FieldStore<typeof value>({
        value,
        validators,
        getValues: this.getValues,
        externals: this.externals
      });
    }
  }
}
