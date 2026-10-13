import { Alert, Button, Dialog, Field, HStack, Input, NativeSelect, Portal, Stack, Text } from "@chakra-ui/react";
import { useMemo, useState } from "react";
import { LuLogOut, LuTrash2 } from "react-icons/lu";
import { useNavigate } from "react-router-dom";
import { apiError } from "../api/client";
import { PageContainer, PageHeader, SectionHeading } from "../components/ds/Page";
import Surface from "../components/ds/Surface";
import { toaster } from "../components/ui/toaster";
import { useDeleteMe, useLogout, useMe, useUpdateMe } from "../hooks/useAuth";
import { TextField } from "./AuthPages";

const BIO_MAX = 200;

const allTimezones = () => {
  try {
    return Intl.supportedValuesOf("timeZone");
  } catch {
    return [];
  }
};

const DeleteAccount = ({ me }) => {
  const navigate = useNavigate();
  const deleteMe = useDeleteMe();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const remove = () =>
    deleteMe.mutate(undefined, {
      onSuccess: () => {
        toaster.info({ title: "Account deleted", description: "Your lessons and reviews are gone. Thanks for learning with us." });
        navigate("/explore", { replace: true });
      },
      onError: (error) => toaster.error({ title: "Could not delete the account", description: apiError(error).message }),
    });

  return (
    <Dialog.Root open={open} onOpenChange={(event) => setOpen(event.open)} placement='center' role='alertdialog'>
      <Dialog.Trigger asChild>
        <Button rounded='full' variant='outline' colorPalette='clay'>
          <LuTrash2 />
          Delete account
        </Button>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner px='4'>
          <Dialog.Content rounded='card'>
            <Dialog.Header>
              <Dialog.Title>Delete your account?</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Stack gap='3'>
                <Text>
                  This deletes your lessons (and everyone's reviews of them), your review cards, history and follows. It cannot be undone.
                </Text>
                <Field.Root>
                  <Field.Label>Type your handle, {me.handle}, to confirm</Field.Label>
                  <Input value={confirm} onChange={(event) => setConfirm(event.target.value)} autoCapitalize='none' autoComplete='off' />
                </Field.Root>
              </Stack>
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.ActionTrigger asChild>
                <Button rounded='full' variant='ghost' colorPalette='gray'>
                  Cancel
                </Button>
              </Dialog.ActionTrigger>
              <Button rounded='full' colorPalette='clay' disabled={confirm.trim().toLowerCase() !== me.handle} loading={deleteMe.isPending} onClick={remove}>
                Delete forever
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

const ProfileForm = ({ me }) => {
  const navigate = useNavigate();
  const update = useUpdateMe();
  const [form, setForm] = useState({ name: me.name, handle: me.handle, bio: me.bio ?? "", timezone: me.timezone });
  const timezones = useMemo(() => {
    const zones = allTimezones();
    return zones.includes(me.timezone) ? zones : [me.timezone, ...zones];
  }, [me.timezone]);

  const set = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));
  const changes = Object.fromEntries(
    Object.entries({ ...form, name: form.name.trim(), handle: form.handle.trim().toLowerCase(), bio: form.bio.trim() }).filter(
      ([field, value]) => value !== (me[field] ?? "")
    )
  );
  const dirty = Object.keys(changes).length > 0;
  const { fields, message } = update.error ? apiError(update.error) : { fields: {}, message: null };
  const formError = update.error && Object.keys(fields).length === 0 ? message : null;

  const save = (event) => {
    event.preventDefault();
    if (!dirty) return;
    update.mutate(changes, {
      onSuccess: (user) => {
        toaster.success({ title: "Profile saved" });
        navigate(`/u/${user.handle}`);
      },
    });
  };

  return (
    <Surface as='form' onSubmit={save} noValidate>
      <Stack gap='4'>
        {formError && (
          <Alert.Root status='error' rounded='control' size='sm'>
            <Alert.Indicator />
            <Alert.Title>{formError}</Alert.Title>
          </Alert.Root>
        )}
        <TextField label='Name' name='name' autoComplete='name' value={form.name} onChange={set("name")} error={fields.name} required />
        <TextField
          label='Handle'
          name='handle'
          autoComplete='username'
          autoCapitalize='none'
          value={form.handle}
          onChange={set("handle")}
          error={fields.handle}
          helper='Changing it changes your profile link.'
          required
        />
        <Field.Root disabled>
          <Field.Label>Email</Field.Label>
          <Input value={me.email} readOnly />
          <Field.HelperText>Your email cannot be changed.</Field.HelperText>
        </Field.Root>
        <TextField
          label='Bio'
          name='bio'
          as='textarea'
          rows={3}
          maxLength={BIO_MAX}
          value={form.bio}
          onChange={set("bio")}
          error={fields.bio}
          helper={`${BIO_MAX - form.bio.length} characters left`}
        />
        <Field.Root invalid={!!fields.timezone}>
          <Field.Label>Time zone</Field.Label>
          <NativeSelect.Root>
            <NativeSelect.Field name='timezone' value={form.timezone} onChange={set("timezone")}>
              {timezones.map((zone) => (
                <option key={zone} value={zone}>
                  {zone.replaceAll("_", " ")}
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
          {fields.timezone ? (
            <Field.ErrorText>{fields.timezone}</Field.ErrorText>
          ) : (
            <Field.HelperText>Reviews come due and streak days end at midnight here.</Field.HelperText>
          )}
        </Field.Root>
        <HStack justify='flex-end' gap='2' pt='2'>
          <Button rounded='full' variant='ghost' colorPalette='gray' onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type='submit' rounded='full' disabled={!dirty} loading={update.isPending}>
            Save changes
          </Button>
        </HStack>
      </Stack>
    </Surface>
  );
};

const EditProfilePage = () => {
  const { data: me } = useMe();
  const navigate = useNavigate();
  const logout = useLogout();

  return (
    <PageContainer>
      <PageHeader eyebrow='Settings' title='Edit profile' description='How other learners see you.' backTo={`/u/${me.handle}`} backLabel='Your profile' />
      <Stack gap='8'>
        {/* Remount on the saved user so the form starts from what the API stored. */}
        <ProfileForm key={`${me.handle}:${me.name}:${me.bio}:${me.timezone}`} me={me} />

        <section>
          <SectionHeading>Account</SectionHeading>
          <Surface>
            <Stack gap='4'>
              <Text color='fg.muted' fontSize='sm' overflowWrap='anywhere'>
                Signed in as {me.email}
              </Text>
              <HStack gap='2' flexWrap='wrap'>
                <Button
                  rounded='full'
                  variant='outline'
                  colorPalette='gray'
                  onClick={() => logout.mutate(undefined, { onSuccess: () => navigate("/login", { replace: true }) })}
                >
                  <LuLogOut />
                  Log out
                </Button>
                <DeleteAccount me={me} />
              </HStack>
            </Stack>
          </Surface>
        </section>
      </Stack>
    </PageContainer>
  );
};

export default EditProfilePage;
