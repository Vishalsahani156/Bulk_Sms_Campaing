import { useCallback, useEffect, useState } from "react";
import type { SmsTemplate, SmsTemplateInput } from "@/types/sms-template";
import {
  createSmsTemplate,
  deleteSmsTemplate,
  duplicateSmsTemplate,
  listSmsTemplates,
  updateSmsTemplate,
} from "@/lib/sms-template-storage";

export function useSmsTemplates() {
  const [templates, setTemplates] = useState<SmsTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(() => {
    setTemplates(listSmsTemplates());
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(refresh, 350);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  const create = useCallback(
    (input: SmsTemplateInput) => {
      const created = createSmsTemplate(input);
      refresh();
      return created;
    },
    [refresh],
  );

  const update = useCallback(
    (id: string, input: SmsTemplateInput) => {
      const updated = updateSmsTemplate(id, input);
      refresh();
      return updated;
    },
    [refresh],
  );

  const remove = useCallback(
    (id: string) => {
      const ok = deleteSmsTemplate(id);
      refresh();
      return ok;
    },
    [refresh],
  );

  const duplicate = useCallback(
    (id: string) => {
      const copy = duplicateSmsTemplate(id);
      refresh();
      return copy;
    },
    [refresh],
  );

  return {
    templates,
    isLoading,
    refresh,
    create,
    update,
    remove,
    duplicate,
  };
}
