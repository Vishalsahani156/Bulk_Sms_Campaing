import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getContacts, bulkDeleteContacts, bulkActivateContacts } from "@/lib/api/contacts.api";

export function useContacts(params?: {
  status?: string;
  group?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["contacts", params],
    queryFn: () => getContacts(params),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["contacts"] });

  const bulkDelete = useMutation({
    mutationFn: (ids: string[]) => bulkDeleteContacts(ids),
    onSuccess: invalidate,
  });

  const bulkActivate = useMutation({
    mutationFn: (ids: string[]) => bulkActivateContacts(ids),
    onSuccess: invalidate,
  });

  return {
    contacts: query.data?.items ?? [],
    stats: query.data?.stats ?? { total: 0, active: 0, unsubscribed: 0, bounced: 0 },
    total: query.data?.total ?? 0,
    isLoading: query.isLoading,
    refresh: invalidate,
    bulkDelete: (ids: string[]) => bulkDelete.mutateAsync(ids),
    bulkActivate: (ids: string[]) => bulkActivate.mutateAsync(ids),
  };
}
