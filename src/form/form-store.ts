import { computed, makeObservable, observable, action } from 'mobx';

type FieldPrimitiveValue = string | number | boolean;

interface TValues<TValue = FieldPrimitiveValue>
  extends Record<string, TValue | TValues<TValue>> {
  [key: string]: TValue | TValues<TValue>;
}

interface ValidationResult<T> {
  error?: string;
  closestValidValue?: T;
}

type Validator<T> = (
  value: T,
  options?: {
    values?: TValues;
    externals?: Record<string, unknown>;
  }
) => ValidationResult<T> | undefined;

export type FieldParam<T extends string | number | boolean> = {
  value: T | Record<string, FieldParam<T>>;
  validators: Validator<T>[];
};

export type TField = {
  value: FieldPrimitiveValue;
  isDirty: boolean;
  validators: Validator<FieldPrimitiveValue>[];
  onChange(value: FieldPrimitiveValue): void;
  onBlur(value: FieldPrimitiveValue): void;
};

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

interface FieldParams<T> {
  value: T;
  validators: Validator<T>[];
  formStore: FormStore;
  parsers?: Parser<T>[];
  formatters?: Formatter<T>[];
}

class Field<T> {
  public value: T;
  public isDirty: boolean;
  public validators: Validator<T>[];
  public parsers: Parser<T>[];
  public formatters: Formatter<T>[];
  public error: string | null = null;
  public closestValidValue: T | null = null;
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

  @action public setDirty(isDirty = true) {
    this.isDirty = isDirty;
  }

  @action onChange = this.parseAndValidate;

  @action.bound onBlur(rawValue: T) {
    this.setDirty();
    this.parseAndValidate(rawValue);
  }

  @action.bound parseAndValidate(rawValue: T) {
    this.value = this.parsers.reduceRight((valueToParse, parser) => {
      return parser(valueToParse);
    }, rawValue);
    this.validate();
  }

  @action validate(force: boolean = false) {
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
}

export class FormStore {
  constructor(
    fields: Record<string, TField>,
    options?: {
      externals?: Record<string, unknown>;
    }
  ) {
    this.externals = options?.externals ?? {};
    this.initFields(fields);
    makeObservable(this);
  }

  @observable public isSubmitted = false;

  @observable public errors: Record<
    string,
    ValidationResult<string | number | boolean> | null
  > = {};

  @observable public externals: Record<string, unknown> = {};

  @observable private _fields: Record<string, TField> = {};

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
      const field = this._fields[name];

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
    return Object.values(this.errors).some((validation) => validation?.error);
  }

  public validate(force: boolean = false): void {
    const fieldNames = Object.keys(this._fields);
    for (let name of fieldNames) {
      this.validateField(name, force);
    }
  }

  private initFields(fields: Record<string, TField>) {
    for (let [name, { value, validators }] of Object.entries(fields)) {
      // if (value instanceof FormStore) continue;
      const parseValue = createValueParser(value);
      const parseAndValidate = action((rawValue: FieldPrimitiveValue) => {
        const field = this._fields[name];
        if (field instanceof FormStore) return;
        field.value = parseValue(rawValue);
        this.validateField(name);
      });
      this._fields[name] = {
        value,
        isDirty: false,
        validators,
        onChange: parseAndValidate,
        onBlur: (rawValue: FieldPrimitiveValue) => {
          this.setDirty(name);
          parseAndValidate(rawValue);
        }
      };
    }
  }

  @action private setDirty(name: string, isDirty: boolean = true) {
    const field = this._fields[name];
    if (field instanceof FormStore) return;
    field.isDirty = isDirty;
  }

  private validateField(name: string, force: boolean = false) {
    const field = this._fields[name];

    if (field instanceof FormStore) return;

    const { value, validators, isDirty } = field;

    if (!isDirty && !force) return;

    const values = this.getValues();

    for (let validator of validators) {
      const validation = validator(value, {
        values,
        externals: this.externals
      });
      if (validation?.error) {
        this.errors[name] = validation;
      } else {
        this.errors[name] = null;
      }
    }
  }
}
