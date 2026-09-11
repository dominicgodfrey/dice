// Emergency contacts (PLAN.md D14). The one place these numbers live; the
// page reads them and never carries a literal.
//
// VERIFY before store submission: confirm every number against
// brandeis.edu/publicsafety and the Counseling Center's current after-hours
// arrangement. `verified` flips to a date once someone has.

export type EmergencyContact = {
  id: string;
  name: string;
  detail: string;
  /** E.164 where possible; "911" as is. */
  number: string;
  /** Shown on the confirmation sheet. */
  display: string;
  urgent: boolean;
};

export const EMERGENCY = {
  verified: null as string | null,
  /** Where "Share my location" sends its text. Public Safety dispatch. */
  smsTo: "+17817363333",
  contacts: [
    {
      id: "911",
      name: "911",
      detail: "Police, fire, or ambulance anywhere",
      number: "911",
      display: "911",
      urgent: true,
    },
    {
      id: "public-safety",
      name: "Public Safety emergency",
      detail: "On campus. Dispatches BEMCo and Waltham services",
      number: "+17817363333",
      display: "781-736-3333",
      urgent: true,
    },
    {
      id: "bemco",
      name: "BEMCo",
      detail: "Brandeis Emergency Medical Corps, reached through Public Safety",
      number: "+17817363333",
      display: "781-736-3333",
      urgent: true,
    },
    {
      id: "counseling",
      name: "Counseling after hours",
      detail: "Brandeis Counseling Center crisis line, any hour",
      number: "+17817363730",
      display: "781-736-3730",
      urgent: false,
    },
    {
      id: "public-safety-nonemergency",
      name: "Public Safety non-emergency",
      detail: "Escorts, lockouts, reports",
      number: "+17817365000",
      display: "781-736-5000",
      urgent: false,
    },
  ] as readonly EmergencyContact[],
};
