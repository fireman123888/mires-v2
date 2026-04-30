"use client";

import { ComingSoon } from "@/components/ComingSoon";
import { useT } from "@/components/I18nProvider";

export default function Page() {
  const { t } = useT();
  return (
    <ComingSoon
      title={t("comingSoon.video.title")}
      description={t("comingSoon.video.description")}
      emoji="🎬"
    />
  );
}
