import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { SmsTemplateInput } from "@/types/sms-template";
import {
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  duplicateTemplate,
} from "@/lib/api/templates.api";

export function useSmsTemplates() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["templates"],
    queryFn: async () => {
      const res = await getTemplates();
      return res.items;
    },
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["templates"] });

  const create = useMutation({
    mutationFn: (input: SmsTemplateInput) => createTemplate(input),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: SmsTemplateInput }) =>
      updateTemplate(id, input),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteTemplate(id),
    onSuccess: invalidate,
  });

  const duplicate = useMutation({
    mutationFn: (id: string) => duplicateTemplate(id),
    onSuccess: invalidate,
  });

  return {
    templates: query.data ?? [],
    isLoading: query.isLoading,
    refresh: invalidate,
    create: (input: SmsTemplateInput) => create.mutateAsync(input),
    update: (id: string, input: SmsTemplateInput) => update.mutateAsync({ id, input }),
    remove: (id: string) => remove.mutateAsync(id),
    duplicate: (id: string) => duplicate.mutateAsync(id),
  };
}
