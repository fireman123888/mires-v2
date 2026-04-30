"use client";

import { ComingSoon } from "@/components/ComingSoon";
import { useT } from "@/components/I18nProvider";

export default function Page() {
  const { t } = useT();
  return (
    <ComingSoon
      title={t("comingSoon.editor.title")}
      description={t("comingSoon.editor.description")}
      emoji="🎨"
    />
  );
}
