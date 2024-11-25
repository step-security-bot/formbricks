"use client";

import { Button } from "@/modules/ui/components/button";
import { ArrowLeftIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

export const BackButton = () => {
  const router = useRouter();
  const t = useTranslations();
  return (
    <Button
      variant="secondary"
      size="sm"
      StartIcon={ArrowLeftIcon}
      onClick={() => {
        router.back();
      }}>
      {t("common.back")}
    </Button>
  );
};
