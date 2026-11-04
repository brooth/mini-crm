import Button, { ButtonProps } from "../buttons/Button";
import "./Button.css";


export default function FormButton({
  className, ...buttonProps
}: FormButtonProps) {
  if (buttonProps.hidden)
    return null;

  const classes = ["app-form-button", className];
  return <Button className={classes.join(' ')} {...buttonProps} />;
}


type FormButtonProps = ButtonProps;
