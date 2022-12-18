import { computed, makeObservable, observable, action } from 'mobx';

type FieldPrimitiveValue = string | number | boolean;

interface TValues<TValue = FieldPrimitiveValue>
  extends Record<string, TValue | TValues<TValue>> {
  [key: string]: TValue | TValues<TValue>;
}

interface ValidationResult<T extends FieldPrimitiveValue> {
  error?: string;
  closestValidValue?: T;
}

type Validator<T extends FieldPrimitiveValue> = (
  value: T,
  options?: {
    values?: TValues;
    externals?: Record<string, unknown>;
  }
) => ValidationResult<T> | undefined;

export type FieldParam<T extends FieldPrimitiveValue> = {
  value: T | Record<string, FieldParam<T>>;
  validators: Validator<T>[];
};

export type TFieldBase<TValue extends FieldPrimitiveValue> = {
  value: TValue;
  isDirty: boolean;
  validators: Validator<TValue>[];
  onChange(value: TValue): void;
  onBlur(value: TValue): void;
};

export type TField = TFieldBase<string> | TFieldBase<number> | TFieldBase<boolean>;

const createValueParser = <T>(initialValue: T) => {
  const valueType = typeof initialValue;
  switch (valueType) {
    case 'string':
      return String;
    case 'number':
      return Number;
    case 'boolean':
      return Boolean;
    default: {
      throw new TypeError(
        [
          `Unsupported field type for ${JSON.stringify(
            {
              initialValue
            },
            null,
            2
          )}`,
          `Expected one of: string, number, boolean.`
        ].join(' ')
      );
    }
  }
};

interface Parser<T> {
  (value: T): T;
}

interface Formatter<T> {
  (value: T): T;
}

interface FieldParams<T extends FieldPrimitiveValue> {
  value: T;
  validators: Validator<T>[];
  formStore: FormStore;
  parsers?: Parser<T>[];
  formatters?: Formatter<T>[];
}

class Field<T extends FieldPrimitiveValue> {
  @observable public value: T;
  @observable public isDirty: boolean;
  @observable public error: string | null = null;
  @observable public closestValidValue: T | null = null;
  public validators: Validator<T>[];
  public parsers: Parser<T>[];
  public formatters: Formatter<T>[];
  private formStore: FormStore;

  constructor({
    value,
    validators,
    parsers,
    formatters,
    formStore
  }: FieldParams<T>) {
    this.value = value;
    (this.isDirty = false), (this.validators = validators);
    this.formStore = formStore;

    const defaultParser = createValueParser<T>(value) as unknown as Parser<T>;

    this.parsers = parsers ?? [defaultParser];
    this.formatters = formatters ?? [];

    makeObservable(this);
  }

  @action.bound
  public setDirty(isDirty = true) {
    this.isDirty = isDirty;
  }

  @action.bound
  onChange(rawValue: T) {
    this.parseAndValidate(rawValue);
  }

  @action.bound
  public onBlur(rawValue: T) {
    this.setDirty();
    this.parseAndValidate(rawValue);
  }

  @action.bound
  public validate(force: boolean = false) {
    const { value, validators, isDirty } = this;

    if (!isDirty && !force) return;

    const values = this.formStore.getValues();

    for (let validator of validators) {
      const validation = validator(value, {
        values,
        externals: this.formStore.externals
      });

      this.error = validation?.error ?? null;
      this.closestValidValue = validation?.closestValidValue ?? null;
    }
  }

  @action.bound
  private parseAndValidate(rawValue: T) {
    this.value = this.parsers.reduceRight((valueToParse, parser) => {
      return parser(valueToParse);
    }, rawValue);
    this.validate();
  }
}

type TFieldParamsBase<TValue extends FieldPrimitiveValue> = Record<
  string,
  Omit<TFieldBase<TValue>, 'isDirty' | 'onChange' | 'onBlur'>
>;

export type TFieldParams =
  | TFieldParamsBase<string>
  | TFieldParamsBase<number>
  | TFieldParamsBase<boolean>;

export class FormStore {
  constructor(
    fields: TFieldParams,
    options?: {
      externals?: Record<string, unknown>;
    }
  ) {
    this.externals = options?.externals ?? {};
    this.initFields(fields);
    makeObservable(this);
  }

  @observable public isSubmitted = false;

  @observable public externals: Record<string, unknown> = {};

  @observable private _fields: Record<string, Field<string> | Field<number> | Field<boolean>> = {};

  @action public setSubmitted(isSubmitted = true) {
    this.isSubmitted = isSubmitted;
  }

  public getField(name: string) {
    // todo implement get field by path like 'settings.option.1.param';
    return this._fields[name];
  }

  public getValues() {
    const fieldNames = Object.keys(this._fields);
    const result: TValues = {};

    for (let name of fieldNames) {
      const field = this.getField(name);

      if (field instanceof FormStore) {
        result[name] = field.getValues();
      } else {
        result[name] = field.value;
      }
    }

    return result;
  }

  @computed public get isDirty(): boolean {
    return Object.values(this._fields).some(({ isDirty }) => isDirty);
  }

  @computed public get isInvalid(): boolean {
    return Object.values(this._fields).some(({ error }) => error);
  }

  public validate(force: boolean = false): void {
    const fieldNames = Object.keys(this._fields);
    for (let name of fieldNames) {
      this._fields[name].validate(force);
    }
  }

  private initFields(fields: TFieldParams) {
    for (let [name, { value, validators }] of Object.entries(fields)) {
      this._fields[name] = new Field<typeof value>({
        value,
        validators,
        formStore: this,
      });
    }
  }
}
