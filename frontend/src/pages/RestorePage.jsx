import { Alert, Button, Stack, Text } from "@chakra-ui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import client, { apiError } from "../api/client";
import { useMe } from "../hooks/useAuth";
import { PageContainer, PageHeader } from "../components/ds/Page";
import Surface from "../components/ds/Surface";

export default function RestorePage() {
  const { data: me } = useMe();
  const queryClient = useQueryClient();
  const eligible = ["maya", "omar", "priya", "sam", "lena"].some((name) => me?.email === `${name}@sharewise.dev`);
  const restore = useMutation({
    mutationFn: async () => (await client.post("/restore")).data,
    onSuccess: () => queryClient.invalidateQueries(),
  });
  return (
    <PageContainer>
      <PageHeader eyebrow='Demo tools' title='Restore demo data' description='A fresh start for the Sharewise demo community.' />
      <Surface>
        <Stack gap='5'>
          <Text>This restores all five demo accounts, their lessons, decks, follows and review history to the original demo fixtures. Changes made using demo accounts will be lost.</Text>
          <Text color='fg.muted'>Other accounts and their data are not reset. Demo passwords and existing sessions stay the same. Unchanged demo data is left alone.</Text>
          {!eligible && <Text role='status'>Log in with a seeded demo account to restore the demo community.</Text>}
          {restore.error && <Alert.Root status='error'><Alert.Indicator /><Alert.Title>{apiError(restore.error).message}</Alert.Title></Alert.Root>}
          {restore.isSuccess && <Alert.Root status='success'><Alert.Indicator /><Alert.Title>{restore.data.restored ? "Demo data restored. You can explore it now." : "Demo data is already unchanged. Nothing to restore."}</Alert.Title></Alert.Root>}
          <Button alignSelf='start' rounded='full' disabled={!eligible} loading={restore.isPending} onClick={() => restore.mutate()}>
            Restore demo data
          </Button>
        </Stack>
      </Surface>
    </PageContainer>
  );
}
