export type FieldValue = string | number | boolean;

export type TValues<TValue = FieldValue> = {
  [key: string]: TValue | TValues<TValue>;
}

export type ValidationResult<TValue extends FieldValue> = {
  error?: string;
  closestValidValue?: TValue;
}

export type Validator<TValue extends FieldValue> = (
  value: TValue,
  options?: {
    values?: TValues;
    externals?: Externals;
  }
) => ValidationResult<TValue> | undefined;

export type FieldParam<TValue extends FieldValue> = {
  value: TValue | Record<string, FieldParam<TValue>>;
  validators: Validator<TValue>[];
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

export type Parser<TValue> = (value: TValue) => TValue;

export type Formatter<TValue> = (value: TValue) => TValue;

export type Externals = Record<string, unknown> | undefined;

export type FieldParams<TValue extends FieldValue> = {
  value: TValue;
  validators: Validator<TValue>[];
  getValues: () => TValues;
  parsers?: Parser<TValue>[];
  formatters?: Formatter<TValue>[];
  externals?: Externals;
}
