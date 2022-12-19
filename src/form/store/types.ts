export type FieldValue = string | number | boolean | unknown;

export interface TValues<TValue = FieldValue>
  extends Record<string, TValue | TValues<TValue>> {
  [key: string]: TValue | TValues<TValue>;
}

export interface ValidationResult<T extends FieldValue> {
  error?: string;
  closestValidValue?: T;
}

export type Validator<T extends FieldValue> = (
  value: T,
  options?: {
    values?: TValues;
    externals?: Externals;
  }
) => ValidationResult<T> | undefined;

export type FieldParam<T extends FieldValue> = {
  value: T | Record<string, FieldParam<T>>;
  validators: Validator<T>[];
};

export type TFieldBase<TValue extends FieldValue> = {
  value: TValue;
  isDirty: boolean;
  validators: Validator<TValue>[];
  onChange(value: TValue): void;
  onBlur(value: TValue): void;
};

export type TField =
  | TFieldBase<string>
  | TFieldBase<number>
  | TFieldBase<boolean>;

export interface Parser<T> {
  (value: T): T;
}

export interface Formatter<T> {
  (value: T): T;
}

export type Externals = Record<string, unknown> | undefined;

export interface FieldParams<T extends FieldValue> {
  value: T;
  validators: Validator<T>[];
  getValues: () => TValues;
  parsers?: Parser<T>[];
  formatters?: Formatter<T>[];
  externals?: Externals;
}
