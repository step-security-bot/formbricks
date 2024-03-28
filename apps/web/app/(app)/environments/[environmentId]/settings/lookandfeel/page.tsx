import { EditLogo } from "@/app/(app)/environments/[environmentId]/settings/lookandfeel/components/EditLogo";
import { getServerSession } from "next-auth";

import {
  getRemoveInAppBrandingPermission,
  getRemoveLinkBrandingPermission,
} from "@formbricks/ee/lib/service";
import { authOptions } from "@formbricks/lib/authOptions";
import { SURVEY_BG_COLORS } from "@formbricks/lib/constants";
import { getMembershipByUserIdTeamId } from "@formbricks/lib/membership/service";
import { getAccessFlags } from "@formbricks/lib/membership/utils";
import { getProductByEnvironmentId } from "@formbricks/lib/product/service";
import { getTeamByEnvironmentId } from "@formbricks/lib/team/service";
import { ErrorComponent } from "@formbricks/ui/ErrorComponent";

import SettingsCard from "../components/SettingsCard";
import SettingsTitle from "../components/SettingsTitle";
import { EditFormbricksBranding } from "./components/EditBranding";
import { EditPlacement } from "./components/EditPlacement";
import { ThemeStyling } from "./components/ThemeStyling";

export default async function ProfileSettingsPage({ params }: { params: { environmentId: string } }) {
  const [session, team, product] = await Promise.all([
    getServerSession(authOptions),
    getTeamByEnvironmentId(params.environmentId),
    getProductByEnvironmentId(params.environmentId),
  ]);

  if (!product) {
    throw new Error("Product not found");
  }
  if (!session) {
    throw new Error("Unauthorized");
  }
  if (!team) {
    throw new Error("Team not found");
  }

  const canRemoveInAppBranding = getRemoveInAppBrandingPermission(team);
  const canRemoveLinkBranding = getRemoveLinkBrandingPermission(team);

  const currentUserMembership = await getMembershipByUserIdTeamId(session?.user.id, team.id);
  const { isViewer } = getAccessFlags(currentUserMembership?.role);
  const isLogoEditDisabled = isViewer ? true : false;

  if (isViewer) {
    return <ErrorComponent />;
  }

  return (
    <div>
      <SettingsTitle title="Look & Feel" />
      <SettingsCard
        title="Theme"
        className="max-w-7xl"
        description="Create a style theme for all surveys. You can enable custom styling for each survey.">
        <ThemeStyling environmentId={params.environmentId} product={product} colors={SURVEY_BG_COLORS} />
      </SettingsCard>{" "}
      <SettingsCard title="Logo" description="Upload your company logo to brand surveys and link previews.">
        <EditLogo
          product={product}
          environmentId={params.environmentId}
          isLogoEditDisabled={isLogoEditDisabled}
        />
      </SettingsCard>
      <SettingsCard
        title="In-app Survey Placement"
        description="Change where surveys will be shown in your web app.">
        <EditPlacement product={product} environmentId={params.environmentId} />
      </SettingsCard>
      <SettingsCard
        title="Formbricks Branding"
        description="We love your support but understand if you toggle it off.">
        <EditFormbricksBranding
          type="linkSurvey"
          product={product}
          canRemoveBranding={canRemoveLinkBranding}
          environmentId={params.environmentId}
        />
        <EditFormbricksBranding
          type="inAppSurvey"
          product={product}
          canRemoveBranding={canRemoveInAppBranding}
          environmentId={params.environmentId}
        />
      </SettingsCard>
    </div>
  );
}
