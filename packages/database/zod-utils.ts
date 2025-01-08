/* eslint-disable import/no-relative-packages -- required for importing types */
import { z } from "zod";

export const ZActionProperties = z.record(z.string());
export { ZActionClassNoCodeConfig } from "../types/action-classes";
export { ZIntegrationConfig } from "../types/integration";

export { ZResponseData, ZResponseMeta, ZResponseTtc, ZResponseVariables, ZResponseContactAttributes } from "../types/responses";

export {
  ZSurveyWelcomeCard,
  ZSurveyQuestions,
  ZSurveyHiddenFields,
  ZSurveyVariables,
  ZSurveyClosedMessage,
  ZSurveyProjectOverwrites,
  ZSurveyStyling,
  ZSurveySingleUse,
  ZSurveyInlineTriggers,
  ZSurveyEnding,
} from "../types/surveys/types";

export { ZSurveyFollowUpAction, ZSurveyFollowUpTrigger } from "./types/survey-follow-up";

export { ZSegmentFilters } from "../types/segment";
export { ZOrganizationBilling, ZOrganizationWhitelabel } from "../types/organizations";
export { ZUserNotificationSettings, ZUserLocale } from "../types/user";

export { ZProjectStyling, ZProjectConfig, ZLogo } from "../types/project";
