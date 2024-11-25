"use client";

import { IconBar } from "@/app/(app)/environments/[environmentId]/surveys/[surveyId]/(analysis)/summary/components/IconBar";
import { ShareEmbedSurvey } from "@/app/(app)/environments/[environmentId]/surveys/[surveyId]/(analysis)/summary/components/ShareEmbedSurvey";
import { SuccessMessage } from "@/app/(app)/environments/[environmentId]/surveys/[surveyId]/(analysis)/summary/components/SuccessMessage";
import { SurveyStatusDropdown } from "@/app/(app)/environments/[environmentId]/surveys/[surveyId]/components/SurveyStatusDropdown";
import { Badge } from "@/modules/ui/components/badge";
import { BellRing, Code2Icon, Eye, LinkIcon, SquarePenIcon, UsersRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { TEnvironment } from "@formbricks/types/environment";
import { TSurvey } from "@formbricks/types/surveys/types";
import { TUser } from "@formbricks/types/user";

interface SurveyAnalysisCTAProps {
  survey: TSurvey;
  environment: TEnvironment;
  isReadOnly: boolean;
  webAppUrl: string;
  user: TUser;
}

interface ModalState {
  share: boolean;
  embed: boolean;
  panel: boolean;
  dropdown: boolean;
}

export const SurveyAnalysisCTA = ({
  survey,
  environment,
  isReadOnly,
  webAppUrl,
  user,
}: SurveyAnalysisCTAProps) => {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const [modalState, setModalState] = useState<ModalState>({
    share: searchParams.get("share") === "true",
    embed: false,
    panel: false,
    dropdown: false,
  });

  const surveyUrl = useMemo(() => `${webAppUrl}/s/${survey.id}`, [survey.id, webAppUrl]);

  const widgetSetupCompleted = survey.type === "app" && environment.appSetupCompleted;

  useEffect(() => {
    setModalState((prev) => ({
      ...prev,
      share: searchParams.get("share") === "true",
    }));
  }, [searchParams]);

  const handleShareModalToggle = (open: boolean) => {
    const params = new URLSearchParams(window.location.search);
    if (open) {
      params.set("share", "true");
    } else {
      params.delete("share");
    }
    router.push(`${pathname}?${params.toString()}`);
    setModalState((prev) => ({ ...prev, share: open }));
  };

  const handleCopyLink = () => {
    navigator.clipboard
      .writeText(surveyUrl)
      .then(() => {
        toast.success(t("common.copied_to_clipboard"));
      })
      .catch((err) => {
        toast.error(t("environments.surveys.summary.failed_to_copy_link"));
        console.error(err);
      });
    setModalState((prev) => ({ ...prev, dropdown: false }));
  };

  const getPreviewUrl = () => {
    const separator = surveyUrl.includes("?") ? "&" : "?";
    return `${surveyUrl}${separator}preview=true`;
  };

  const handleModalState = (modalView: keyof Omit<ModalState, "dropdown">) => {
    return (open: boolean | ((prevState: boolean) => boolean)) => {
      const newValue = typeof open === "function" ? open(modalState[modalView]) : open;
      setModalState((prev) => ({ ...prev, [modalView]: newValue }));
    };
  };

  const shareEmbedViews = [
    { key: "share", modalView: "start" as const, setOpen: handleShareModalToggle },
    { key: "embed", modalView: "embed" as const, setOpen: handleModalState("embed") },
    { key: "panel", modalView: "panel" as const, setOpen: handleModalState("panel") },
  ];

  return (
    <div className="hidden justify-end gap-x-1.5 sm:flex">
      {survey.resultShareKey && (
        <Badge
          text={t("environments.surveys.summary.results_are_public")}
          type="warning"
          size="normal"
          className="rounded-lg"
        />
      )}

      {!isReadOnly && (widgetSetupCompleted || survey.type === "link") && survey.status !== "draft" && (
        <SurveyStatusDropdown environment={environment} survey={survey} />
      )}

      <div className="border-formbricks-border-primary flex items-center justify-center rounded-lg border bg-transparent">
        {survey.type === "link" && (
          <IconBar
            icon={<Eye />}
            tooltip={t("common.preview")}
            onClick={() => window.open(getPreviewUrl(), "_blank")}
          />
        )}

        {!isReadOnly && (
          <div>
            {survey.type === "link" && (
              <IconBar icon={<LinkIcon />} tooltip={t("common.copy_link")} onClick={handleCopyLink} />
            )}
            <IconBar
              icon={<Code2Icon />}
              tooltip={t("common.embed")}
              onClick={() => handleModalState("embed")(true)}
            />
            <IconBar
              icon={<BellRing />}
              tooltip={t("environments.surveys.summary.configure_alerts")}
              href={`/environments/${survey.environmentId}/settings/notifications`}
              onClick={() => setModalState((prev) => ({ ...prev, dropdown: false }))}
            />
            <IconBar
              icon={<UsersRound />}
              tooltip={t("environments.surveys.summary.send_to_panel")}
              onClick={() => {
                handleModalState("panel")(true);
                setModalState((prev) => ({ ...prev, dropdown: false }));
              }}
            />
            <IconBar
              icon={<SquarePenIcon />}
              tooltip={t("common.edit")}
              href={`/environments/${environment.id}/surveys/${survey.id}/edit`}
            />
          </div>
        )}
      </div>

      {user && (
        <>
          {shareEmbedViews.map(({ key, modalView, setOpen }) => (
            <ShareEmbedSurvey
              key={key}
              survey={survey}
              open={modalState[key as keyof ModalState]}
              setOpen={setOpen}
              webAppUrl={webAppUrl}
              user={user}
              modalView={modalView}
            />
          ))}
          <SuccessMessage environment={environment} survey={survey} />
        </>
      )}
    </div>
  );
};
