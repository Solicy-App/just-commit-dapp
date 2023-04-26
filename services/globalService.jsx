import PhonePickupsService from "./PhonePickupsContextService";

export const GlobalServices = ({ children }) => {
  return <PhonePickupsService>{children}</PhonePickupsService>;
};
