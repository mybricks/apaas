import { FC, useEffect } from "react";
import { useNavigate } from "react-router-dom";


const PageNotFound: FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("?appId=files", {
      replace: true
    });
  }, []);

  return null;
}

export default PageNotFound;
