import React, { useEffect } from "react";
import SwaggerUI from "swagger-ui";
import swaggerData from "../utils/swaggerData";
import 'swagger-ui/dist/swagger-ui.css';

const SwaggerUIComp = () => {

  useEffect(() => {
    SwaggerUI({
      spec: swaggerData,
      dom_id: '#swagger'
    });
  }, []);

  return <div id="swagger"></div>

};

export default SwaggerUIComp;
