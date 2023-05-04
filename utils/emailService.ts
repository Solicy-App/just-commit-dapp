import emailjs from "emailjs-com";
import env from "./env";

export const sendAnEmail = (email: string): void => {
  const templateParams = {
    email,
  };

  const { emailJsServiceId, emailJsTemplateId, emailJsPublicKey } = env;

  if (emailJsServiceId && emailJsTemplateId)
    emailjs.send(
      emailJsServiceId,
      emailJsTemplateId,
      templateParams,
      emailJsPublicKey
    );
};
