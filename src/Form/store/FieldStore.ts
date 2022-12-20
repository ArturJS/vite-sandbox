import { makeObservable, observable, action } from 'mobx';
import type {
  FieldValue,
  Validator,
  Parser,
  Formatter,
  FieldParams,
  TValues,
  Externals
} from './types';

const createValueParser = <TValue>(initialValue: TValue) => {
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

export class FieldStore<TValue extends FieldValue> {
  @observable public value: TValue;
  @observable public isDirty: boolean;
  @observable public error: string | null = null;
  @observable public closestValidValue: TValue | null = null;
  public validators: Validator<TValue>[];
  public parsers: Parser<TValue>[];
  public formatters: Formatter<TValue>[];
  private getValues: () => TValues;
  private externals: Externals;

  constructor({
    value,
    validators,
    parsers,
    formatters,
    getValues,
    externals
  }: FieldParams<TValue>) {
    this.value = value;
    this.validators = validators;
    this.getValues = getValues;
    this.externals = externals;
    this.isDirty = false;

    const defaultParser = createValueParser<TValue>(value) as unknown as Parser<TValue>;

    this.parsers = parsers ?? [defaultParser];
    this.formatters = formatters ?? [];

    makeObservable(this);
  }

  @action.bound
  public setDirty(isDirty = true) {
    this.isDirty = isDirty;
  }

  @action.bound
  onChange(rawValue: TValue) {
    this.parseAndValidate(rawValue);
  }

  @action.bound
  public onBlur(rawValue: TValue) {
    this.setDirty();
    this.parseAndValidate(rawValue);
  }

  @action.bound
  public validate(force: boolean = false) {
    const { value, validators, isDirty } = this;

    if (!isDirty && !force) return;

    const values = this.getValues();

    for (let validator of validators) {
      const validation = validator(value, {
        values,
        externals: this.externals
      });

      this.error = validation?.error ?? null;
      this.closestValidValue = validation?.closestValidValue ?? null;
    }
  }

  @action.bound
  private parseAndValidate(rawValue: TValue) {
    this.value = this.parsers.reduceRight((valueToParse, parser) => {
      return parser(valueToParse);
    }, rawValue);
    this.validate();
  }
}
