import FormLabel from "./FormLabel";
import FormField from "./FormField";

type FormType = {
  Label: typeof FormLabel,
  Field: typeof FormField
}

const Form: FormType = {} as FormType;

Form.Field = FormField;
Form.Label = FormLabel;

export default Form;
