import { useNavigate } from "react-router-dom";

import { ApiError } from "utils";
import { Button } from '../buttons';
import Backout, { BackoutProps } from './Backout';


export default function PageNotFound() {
  const navigate = useNavigate();
  return (
    <Backout
      icon="search"
      title={["PageNotFound.title"]}
      message={["PageNotFound.msg"]}
      action={
        <Button
          variant="outlined"
          text={["PageNotFound.button"]}
          onClick={() => navigate("/")}
        />
      }
    />
  );
}

export type PageNotFoundProps = { error: ApiError } & BackoutProps;
