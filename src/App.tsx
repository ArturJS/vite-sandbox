import { useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { Form, Field, TFieldGroup } from './Form';
import logo from './logo.svg';
import './App.scss';

// construct simple DCA form with fields sync
// + computed things

const App = observer(() => {
  const fields = useMemo(
    () =>
      ({
        name: {
          value: '',
          validators: [
            (value: string) => {
              if (value.length < 3) {
                return {
                  error: 'Please enter at least 3 symbols'
                };
              }
            }
          ]
        },

        // todo: implement nested field groups
        postalOffice: {
          address: {
            value: '',
            validators: [
              (value: string) => {
                if (value.length === 0) {
                  return {
                    error: 'Address must not be empty',
                    closestValidValue: null
                  };
                }
              }
            ]
          }
        }
      } as TFieldGroup),
    []
  );

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>Hello Vite + React!</p>

        {/* @ts-ignore */}
        <Form
          fields={fields}
          onSubmit={(values) => {
            console.log(values);
          }}
        >
          <Field name="name" />
          <hr />
          <Field name="postalOffice.address" />
        </Form>
      </header>
    </div>
  );
});

export default App;
