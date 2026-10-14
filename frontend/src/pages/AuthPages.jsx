import { Alert, Box, Button, Field, Flex, Heading, Input, Stack, Text, Textarea } from "@chakra-ui/react";
import { useState } from "react";
import { Link, Navigate, Outlet } from "react-router-dom";
import { apiError } from "../api/client";
import { useNextPath } from "../lib/nextPath";
import ColorModeButton from "../components/ds/ColorModeButton";
import Logo from "../components/ds/Logo";
import Surface from "../components/ds/Surface";
import { useLogin, useMe, useSignup } from "../hooks/useAuth";

const BIO_MAX = 200;

/** Frame for the signed-out screens and onboarding: no app nav, one centered column. */
export const AuthLayout = () => (
  <Flex direction='column' minH='100dvh' px='4' py='5'>
    <Flex justify='space-between' align='center' w='full' maxW='wide' mx='auto'>
      <Logo />
      <ColorModeButton size='sm' />
    </Flex>
    <Flex flex='1' align='center' justify='center' py='8'>
      <Box w='full' maxW='sm'>
        <Outlet />
      </Box>
    </Flex>
  </Flex>
);

const AuthCard = ({ title, subtitle, submitLabel, footer, onSubmit, pending, formError, children }) => (
  <Stack gap='6'>
    <Stack gap='1' textAlign='center'>
      <Heading as='h1' textStyle='display'>
        {title}
      </Heading>
      <Text color='fg.muted'>{subtitle}</Text>
    </Stack>
    <Surface
      as='form'
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(new FormData(event.currentTarget));
      }}
      p={{ base: "5", md: "6" }}
    >
      <Stack gap='4'>
        {formError && (
          <Alert.Root status='error' rounded='control' size='sm'>
            <Alert.Indicator />
            <Alert.Title>{formError}</Alert.Title>
          </Alert.Root>
        )}
        {children}
        <Button type='submit' rounded='full' size='lg' mt='2' loading={pending}>
          {submitLabel}
        </Button>
      </Stack>
    </Surface>
    <Text textAlign='center' fontSize='sm' color='fg.muted'>
      {footer}
    </Text>
  </Stack>
);

/** A labeled input with an inline API error. `as` switches to a textarea. */
export const TextField = ({ label, name, error, helper, as = "input", required, ...inputProps }) => {
  const Control = as === "textarea" ? Textarea : Input;
  return (
    <Field.Root invalid={!!error} required={required}>
      <Field.Label>
        {label}
        {required && <Field.RequiredIndicator />}
      </Field.Label>
      <Control name={name} {...inputProps} />
      {error ? <Field.ErrorText>{error}</Field.ErrorText> : helper && <Field.HelperText>{helper}</Field.HelperText>}
    </Field.Root>
  );
};

const InlineLink = ({ to, children }) => (
  <Link to={to}>
    <Text as='span' color='brand.fg' fontWeight='600'>
      {children}
    </Text>
  </Link>
);

/** Keeps `?next=` when hopping between login and signup. */
const withNext = (path, next) => (next === "/" ? path : `${path}?next=${encodeURIComponent(next)}`);

/** Splits an API error into per-field messages and one message for the form. */
const formErrors = (error) => {
  if (!error) return { fields: {}, form: null };
  const { fields, message } = apiError(error);
  return { fields, form: Object.keys(fields).length > 0 ? null : message };
};

export const LoginPage = () => {
  const next = useNextPath();
  const { data: me } = useMe();
  const login = useLogin();
  const { fields, form } = formErrors(login.error);

  if (me) return <Navigate to={next} replace />;

  return (
    <AuthCard
      title='Welcome back'
      subtitle='Your reviews are waiting.'
      submitLabel='Log in'
      pending={login.isPending}
      formError={form}
      onSubmit={(data) => login.mutate({ email: data.get("email").trim(), password: data.get("password") })}
      footer={
        <>
          New to Sharewise? <InlineLink to={withNext("/signup", next)}>Create an account</InlineLink>
        </>
      }
    >
      <TextField label='Email' name='email' type='email' autoComplete='email' placeholder='you@example.com' error={fields.email} required />
      <TextField label='Password' name='password' type='password' autoComplete='current-password' error={fields.password} required />
    </AuthCard>
  );
};

const browserTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return undefined;
  }
};

export const SignupPage = () => {
  const next = useNextPath();
  const { data: me } = useMe();
  const signup = useSignup();
  const [bio, setBio] = useState("");
  const { fields, form } = formErrors(signup.error);

  if (me) {
    const welcome = next === "/" ? "/welcome" : `/welcome?next=${encodeURIComponent(next)}`;
    return <Navigate to={signup.isSuccess ? welcome : next} replace />;
  }

  const submit = (data) => {
    const body = {
      name: data.get("name").trim(),
      handle: data.get("handle").trim().toLowerCase(),
      email: data.get("email").trim(),
      password: data.get("password"),
      ...(bio.trim() && { bio: bio.trim() }),
    };
    const timezone = browserTimezone();
    signup.mutate(timezone ? { ...body, timezone } : body, {
      // The browser's zone is a convenience; if the API does not know it, sign up on UTC instead.
      onError: (error) => {
        if (timezone && apiError(error).fields.timezone) signup.mutate(body);
      },
    });
  };

  return (
    <AuthCard
      title='Start remembering'
      subtitle='Share what you learn. Keep what you read.'
      submitLabel='Create account'
      pending={signup.isPending}
      formError={form}
      onSubmit={submit}
      footer={
        <>
          Already have an account? <InlineLink to={withNext("/login", next)}>Log in</InlineLink>
        </>
      }
    >
      <TextField label='Name' name='name' autoComplete='name' placeholder='Ada Lovelace' error={fields.name} required />
      <TextField
        label='Handle'
        name='handle'
        autoComplete='username'
        autoCapitalize='none'
        placeholder='ada'
        error={fields.handle}
        helper='3-20 lowercase letters, digits or _. Your profile lives at /u/handle.'
        required
      />
      <TextField label='Email' name='email' type='email' autoComplete='email' placeholder='you@example.com' error={fields.email} required />
      <TextField
        label='Password'
        name='password'
        type='password'
        autoComplete='new-password'
        error={fields.password}
        helper='At least 8 characters.'
        required
      />
      <TextField
        label='Bio'
        name='bio'
        as='textarea'
        rows={2}
        maxLength={BIO_MAX}
        value={bio}
        onChange={(event) => setBio(event.target.value)}
        placeholder='What do you like to learn and teach?'
        error={fields.bio}
        helper={`Optional · ${BIO_MAX - bio.length} characters left`}
      />
    </AuthCard>
  );
};
