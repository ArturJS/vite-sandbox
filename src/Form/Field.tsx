import React, { useContext, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { FormContext } from './Form';

export const Field = observer(({ name }: any) => {
  const formStore = useContext(FormContext);

  if (!formStore) {
    throw new Error('FormStore is not available');
  }

  const { value, onChange, onBlur, error } = formStore.getField(name);

  useEffect(() => {}, []);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };
  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
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
      <span style={{ color: 'orangered' }}>{error}&nbsp;</span>
    </div>
  );
});
