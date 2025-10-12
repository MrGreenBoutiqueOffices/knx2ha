"use client";

import { Button } from "@/components/ui/button";

type Props = {
  onExportYaml: () => void;
  onExportZip: () => void;
  disabled?: boolean;
  variant?: "desktop" | "mobile";
};

export function ExportActions({
  onExportYaml,
  onExportZip,
  disabled,
  variant = "desktop",
}: Props) {
  const shared = {
    disabled,
  } as const;

  if (variant === "mobile") {
    return (
      <>
        <Button
          className="flex-1 cursor-pointer"
          variant="outline"
          onClick={onExportYaml}
          {...shared}
        >
          Export single YAML
        </Button>
        <Button
          className="flex-1 cursor-pointer"
          variant="default"
          onClick={onExportZip}
          {...shared}
        >
          Export ZIP
        </Button>
      </>
    );
  }

  return (
    <>
      <Button
        className="cursor-pointer"
        variant="outline"
        onClick={onExportYaml}
        {...shared}
      >
        Export single YAML
      </Button>
      <Button
        className="cursor-pointer"
        variant="default"
        onClick={onExportZip}
        {...shared}
      >
        Export ZIP
      </Button>
    </>
  );
}

export default ExportActions;
