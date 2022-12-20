import React, { createContext, useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { FormStore, TFieldGroup } from './store';

export const FormContext = createContext<FormStore | null>(null);

export const Form = observer(
  ({
    onSubmit,
    fields,
    children
  }: {
    onSubmit(values: Record<string, unknown>): void;
    fields: TFieldGroup;
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
