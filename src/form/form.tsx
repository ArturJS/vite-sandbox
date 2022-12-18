import React, { useContext, useEffect, createContext, useMemo } from 'react';
import { observer } from 'mobx-react-lite';

import { FormStore, TFieldParams } from './form-store';

// @ts-ignore
export const FormContext = createContext<FormStore>({});

export const Field = observer(({ name }: any) => {
  const formStore = useContext<FormStore>(FormContext);
  const field = formStore.getField(name);

  if (field instanceof FormStore) {
    throw new TypeError(`Field with ${name} is instance of FormStore and cannot be accepted`);
  }

  const { value, onChange, onBlur, error } = field;

  useEffect(() => {}, []);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // @ts-ignore
    onChange(event.target.value);
  };
  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    // @ts-ignore
    onBlur(event.target.value);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <input
        type="text"
        name={name}
        value={value as string}
        onChange={handleChange}
        onBlur={handleBlur}
      />
      {error ? (
        <span style={{ color: 'orangered' }}>{error}</span>
      ) : (
        <span>&nbsp;</span>
      )}
    </div>
  );
});

export const Form = observer(
  ({
    onSubmit,
    fields,
    children
  }: {
    onSubmit(values: Record<string, unknown>): void;
    fields: TFieldParams;
    children: React.ReactNode | React.ReactChildren;
  }) => {
    const formStore = useMemo(() => new FormStore(fields), []);
    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      formStore.validate();
      if (formStore.isInvalid) return;

      onSubmit(formStore.getValues());

      formStore.setSubmitted();
    };

    return (
      <FormContext.Provider value={formStore}>
        <form onSubmit={handleSubmit} noValidate>
          {children}
        </form>
      </FormContext.Provider>
    );
  }
);
